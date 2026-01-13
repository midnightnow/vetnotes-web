<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WhisperWorker from '$lib/workers/whisper.worker?worker';

  let isRecording = $state(false);
  let status = $state('initializing'); // initializing, ready, recording, processing, error
  let transcript = $state('');
  
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
        console.log('Whisper Worker Ready');
      } else if (workerStatus === 'complete') {
        transcript += (transcript ? ' ' : '') + text;
        console.log('Transcription:', text);
      } else if (workerStatus === 'error') {
        console.error('Worker Error:', error);
        status = 'error';
      }
    };
    
    worker.postMessage({ type: 'load' });
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
        // e.data is float32 audio chunk
        if (worker) {
          worker.postMessage({ type: 'transcribe', audio: e.data });
        }
      };
      
      source.connect(workletNode);
      workletNode.connect(audioContext.destination); // Keep alive? mute?
      
      isRecording = true;
      status = 'recording';
    } catch (err) {
      console.error('Mic Error:', err);
      status = 'error';
    }
  }
  
  function stopRecording() {
    isRecording = false;
    status = 'ready';
    if (audioContext) {
      audioContext.suspend();
    }
    // TODO: Clean up stream tracks
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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

<div class="flex flex-col items-center justify-center gap-8 w-full max-w-2xl">
  <!-- Status Text -->
  <h2 class="text-2xl font-mono tracking-widest text-base-content/70">
    {status.toUpperCase()}
  </h2>

  <!-- The Blind Eye (Recorder Button) -->
  <button
    class="relative group"
    onclick={toggleRecording}
    disabled={status === 'initializing' || status === 'error'}
    aria-label="Toggle Recording"
  >
    <!-- Outer Glow (Active only when recording) -->
    {#if isRecording}
      <div class="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
    {/if}

    <!-- The Core Button -->
    <div class="relative w-32 h-32 flex items-center justify-center bg-base-300 rounded-full shadow-xl transition-all duration-300 {status === 'initializing' ? 'opacity-50' : 'group-hover:scale-105 group-active:scale-95'} {isRecording ? 'bg-red-900/20 ring-4 ring-red-500/30' : 'hover:bg-base-200'}">
      <div class="w-16 h-16 rounded-full transition-colors duration-300 {isRecording ? 'bg-red-500' : 'bg-red-500/50'} {pulseClass}"></div>
    </div>
  </button>

  <!-- Transcript Viewer (Live) -->
  {#if transcript}
    <div class="w-full p-4 bg-base-200 rounded-lg shadow-inner min-h-[100px] max-h-[200px] overflow-y-auto">
        <p class="font-mono text-sm whitespace-pre-wrap">{transcript}</p>
    </div>
  {/if}

  <!-- Safe Guards -->
  {#if isRecording}
    <div class="alert alert-warning shadow-lg max-w-sm">
      <span class="font-bold">⚠️ DO NOT CLOSE TAB</span>
      <span class="text-xs">Processing in Local RAM</span>
    </div>
  {/if}
</div>
