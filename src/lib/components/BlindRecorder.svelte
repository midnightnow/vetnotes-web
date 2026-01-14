<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WhisperWorker from '$lib/workers/whisper.worker?worker';
  import { structureNote } from '$lib/services/gemini';
  import { structureNoteLocal } from '$lib/services/ollama';

  let isRecording = $state(false);
  let status = $state('initializing'); // initializing, ready, recording, processing, error, structuring
  let transcript = $state('');
  let structuredNote = $state('');
  let errorMessage = $state('');
  
  // Settings
  let apiKey = $state('');
  let ollamaModel = $state('llama3');
  let provider = $state('gemini'); // gemini, ollama
  let showSettings = $state(false);

  let audioContext: AudioContext;
  let workletNode: AudioWorkletNode;
  let worker: Worker;
  
  let pulseClass = $derived(isRecording ? 'animate-pulse' : '');
  
  async function initWorker() {
    status = 'initializing';
    worker = new WhisperWorker();
    
    worker.onmessage = (e) => {
      const { status: workerStatus, text, error } = e.data;
      
      if (workerStatus === 'ready') {
        status = 'ready';
      } else if (workerStatus === 'complete') {
        transcript += (transcript ? ' ' : '') + text;
      } else if (workerStatus === 'error') {
        status = 'error';
        errorMessage = error || 'Worker error';
      }
    };
    
    worker.postMessage({ type: 'load' });
    
    // Load Settings
    apiKey = localStorage.getItem('vetnotes_gemini_key') || '';
    ollamaModel = localStorage.getItem('vetnotes_ollama_model') || 'llama3';
    provider = localStorage.getItem('vetnotes_provider') || 'gemini';
  }

  function saveSettings() {
      localStorage.setItem('vetnotes_gemini_key', apiKey);
      localStorage.setItem('vetnotes_ollama_model', ollamaModel);
      localStorage.setItem('vetnotes_provider', provider);
      showSettings = false;
  }
  
  async function startRecording() {
    try {
      if (!audioContext) {
        audioContext = new AudioContext({ sampleRate: 16000 });
        await audioContext.audioWorklet.addModule('/audio-processor.js');
      }
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      
      workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      
      workletNode.port.onmessage = (e) => {
        if (worker) {
          worker.postMessage({ type: 'transcribe', audio: e.data });
        }
      };
      
      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
      
      isRecording = true;
      status = 'recording';
    } catch (err) {
      status = 'error';
      errorMessage = "Microphone access denied";
    }
  }
  
  function stopRecording() {
    isRecording = false;
    status = 'ready';
    if (audioContext) {
      audioContext.suspend();
    }
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  async function handleStructure() {
      if (provider === 'gemini' && !apiKey) {
          showSettings = true;
          return;
      }
      status = 'structuring';
      try {
          if (provider === 'gemini') {
            structuredNote = await structureNote(transcript, apiKey);
          } else {
            structuredNote = await structureNoteLocal(transcript, ollamaModel);
          }
          status = 'ready';
      } catch (e) {
          errorMessage = provider === 'gemini' ? "Gemini structuring failed" : "Ollama connection failed";
          status = 'error';
      }
  }
  
  onMount(() => {
    initWorker();
  });
  
  onDestroy(() => {
    if (worker) worker.terminate();
    if (audioContext) audioContext.close();
  });
</script>

<div class="flex flex-col items-center justify-center gap-12 w-full max-w-2xl px-6 py-12">
  <!-- Header Glass Panel -->
  <div class="w-full glass-panel rounded-3xl p-6 flex justify-between items-center transition-all duration-500">
      <div class="flex flex-col">
          <h2 class="text-xs uppercase tracking-[0.3em] text-primary/80 font-bold mb-1">
            Status
          </h2>
          <span class="text-xl font-mono tracking-widest text-base-content/90 uppercase">
            {status}
          </span>
          {#if status === 'error' && errorMessage}
            <p class="text-error text-[10px] mt-2 font-mono uppercase tracking-wider">{errorMessage}</p>
          {/if}
      </div>
      
      <div class="flex items-center gap-3">
          {#if provider === 'ollama'}
              <div class="badge badge-accent badge-outline font-mono text-[10px] p-3 gap-1">
                  <div class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                  BUNKER MODE
              </div>
          {/if}
          <button class="btn btn-circle btn-ghost btn-sm hover:rotate-90 transition-transform duration-500" onclick={() => showSettings = !showSettings} aria-label="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
      </div>
  </div>

  <!-- Settings Panel -->
  {#if showSettings}
    <div class="glass-panel w-full rounded-3xl p-8 gap-6 flex flex-col animate-in fade-in zoom-in duration-300">
        <h3 class="text-sm font-bold uppercase tracking-widest opacity-70">Architecture Settings</h3>
        
        <div class="form-control">
            <span class="label-text text-xs mb-2 opacity-50">LLM PROVIDER</span>
            <div class="join w-full">
                <button class="join-item btn btn-sm flex-1 {provider === 'gemini' ? 'btn-primary' : 'btn-ghost bg-base-300'}" onclick={() => provider = 'gemini'}>GEMINI (CLOUD)</button>
                <button class="join-item btn btn-sm flex-1 {provider === 'ollama' ? 'btn-primary' : 'btn-ghost bg-base-300'}" onclick={() => provider = 'ollama'}>OLLAMA (LOCAL)</button>
            </div>
        </div>

        {#if provider === 'gemini'}
            <div class="form-control">
                <span class="label-text text-xs mb-2 opacity-50">API KEY</span>
                <input type="password" placeholder="sk-..." class="input input-bordered input-sm w-full bg-base-200/50" bind:value={apiKey} />
            </div>
        {:else}
            <div class="form-control">
                <span class="label-text text-xs mb-2 opacity-50">OLLAMA MODEL</span>
                <input type="text" placeholder="llama3, mistral..." class="input input-bordered input-sm w-full bg-base-200/50" bind:value={ollamaModel} />
            </div>
        {/if}

        <button class="btn btn-primary btn-block rounded-xl mt-2" onclick={saveSettings}>SAVE CONFIGURATION</button>
    </div>
  {/if}

  <!-- The Blind Eye (Recorder Button) -->
  <div class="relative py-12">
    <button
        class="relative z-10"
        onclick={toggleRecording}
        disabled={status === 'initializing' || status === 'error' || status === 'structuring'}
        aria-label="Toggle Recording"
    >
        {#if isRecording}
            <div class="absolute inset-0 bg-red-500/30 rounded-full animate-pulse-ring"></div>
            <div class="absolute inset-0 bg-red-500/20 rounded-full animate-pulse-ring" style="animation-delay: 1s"></div>
        {/if}

        <div class="relative w-48 h-48 flex items-center justify-center glass-panel rounded-full transition-all duration-700 {status === 'initializing' ? 'opacity-30' : 'hover:scale-110 active:scale-95'} {isRecording ? 'border-red-500/50' : 'hover:border-primary/50'}">
            <div class="w-20 h-20 rounded-full transition-all duration-700 {isRecording ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]' : 'bg-base-content/10'} {pulseClass}"></div>
        </div>
    </button>
  </div>

  <!-- Transcript & Actions -->
  {#if transcript && !isRecording}
    <div class="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div class="flex justify-between items-end px-2">
            <div>
                <span class="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/60">Data Buffered</span>
                <h4 class="text-sm font-mono opacity-80">RAW TRANSCRIPT</h4>
            </div>
            <button class="btn btn-primary rounded-2xl shadow-lg hover:shadow-primary/20 px-8" onclick={handleStructure} disabled={status === 'structuring'}>
                {#if status === 'structuring'}
                    <span class="loading loading-dots loading-sm"></span>
                {:else}
                    STRUCTURE {provider === 'ollama' ? 'LOCAL' : 'SOAP'}
                {/if}
            </button>
        </div>
        <div class="w-full glass-panel rounded-3xl p-6 min-h-[100px] max-h-[200px] overflow-y-auto border-dashed border opacity-90 border-white/5">
            <p class="font-mono text-sm leading-relaxed opacity-70 whitespace-pre-wrap">{transcript}</p>
        </div>
    </div>
  {/if}

  <!-- Structured Result -->
  {#if structuredNote}
    <div class="w-full glass-panel rounded-[2.5rem] p-10 mt-4 border-t-2 border-primary/20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div class="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--p),0.5)]"></div>
                <h3 class="text-primary font-black uppercase tracking-[0.2em] text-[10px]">Clinical Output</h3>
            </div>
            <button class="btn btn-xs btn-ghost opacity-50 hover:opacity-100" onclick={() => navigator.clipboard.writeText(structuredNote)}>COPY NOTE</button>
        </div>
        <div class="prose prose-sm font-sans max-w-none text-base-content/90 whitespace-pre-line leading-loose">
            {structuredNote}
        </div>
    </div>
  {/if}

  <!-- Footer Warnings -->
  {#if isRecording}
      <div class="flex flex-col items-center gap-2 opacity-50 font-mono text-[10px] tracking-widest text-warning">
          <span class="animate-pulse">● NO DATA LEAVES RAM</span>
          <span>● DO NOT REFRESH</span>
      </div>
  {/if}
</div>
