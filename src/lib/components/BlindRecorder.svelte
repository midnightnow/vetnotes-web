<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import WhisperWorker from "$lib/workers/whisper.worker?worker";
  import { structureNote } from "$lib/services/gemini";
  import { structureNoteLocal } from "$lib/services/ollama";
  import { redactPII } from "$lib/utils/redactor";
  import { TEMPLATES, type TemplateId } from "$lib/constants/templates";
  import {
    saveSession,
    getSessions,
    getSessionStats,
    type Session,
  } from "$lib/services/storage";

  let isRecording = $state(false);
  let status = $state("initializing");
  let transcript = $state("");
  let structuredNote = $state("");
  let errorMessage = $state("");

  // Settings
  let apiKey = $state("");
  let ollamaModel = $state("llama3");
  let provider = $state<"gemini" | "ollama">("gemini");
  let autoRedact = $state(true);
  let autoCopy = $state(true);
  let selectedTemplate = $state<TemplateId>("general");
  let showSettings = $state(false);
  let showHistory = $state(false);

  // History
  let sessions = $state<Session[]>([]);
  let stats = $state({ total: 0, today: 0, week: 0 });

  let audioContext: AudioContext;
  let workletNode: AudioWorkletNode;
  let worker: Worker;

  let pulseClass = $derived(isRecording ? "animate-pulse" : "");

  async function initWorker() {
    status = "initializing";
    worker = new WhisperWorker();

    worker.onmessage = (e) => {
      const { status: workerStatus, text, error } = e.data;
      if (workerStatus === "ready") {
        status = "ready";
      } else if (workerStatus === "complete") {
        transcript += (transcript ? " " : "") + text;
      } else if (workerStatus === "error") {
        status = "error";
        errorMessage = error || "Worker error";
      }
    };
    worker.postMessage({ type: "load" });

    // Load Settings
    apiKey = localStorage.getItem("vetnotes_gemini_key") || "";
    ollamaModel = localStorage.getItem("vetnotes_ollama_model") || "llama3";
    provider =
      (localStorage.getItem("vetnotes_provider") as "gemini" | "ollama") ||
      "gemini";
    const savedRedact = localStorage.getItem("vetnotes_auto_redact");
    if (savedRedact !== null) autoRedact = savedRedact === "true";
    const savedCopy = localStorage.getItem("vetnotes_auto_copy");
    if (savedCopy !== null) autoCopy = savedCopy === "true";

    // Load history
    await refreshHistory();
  }

  async function refreshHistory() {
    sessions = await getSessions(20);
    stats = await getSessionStats();
  }

  function saveSettings() {
    localStorage.setItem("vetnotes_gemini_key", apiKey);
    localStorage.setItem("vetnotes_ollama_model", ollamaModel);
    localStorage.setItem("vetnotes_provider", provider);
    localStorage.setItem("vetnotes_auto_redact", String(autoRedact));
    localStorage.setItem("vetnotes_auto_copy", String(autoCopy));
    showSettings = false;
  }

  async function startRecording() {
    try {
      if (!audioContext) {
        audioContext = new AudioContext({ sampleRate: 16000 });
        await audioContext.audioWorklet.addModule("/audio-processor.js");
      }
      if (audioContext.state === "suspended") await audioContext.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      workletNode = new AudioWorkletNode(audioContext, "audio-processor");
      workletNode.port.onmessage = (e) => {
        if (worker) worker.postMessage({ type: "transcribe", audio: e.data });
      };
      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
      isRecording = true;
      status = "recording";
    } catch (err) {
      status = "error";
      errorMessage = "Microphone access denied";
    }
  }

  function stopRecording() {
    isRecording = false;
    status = "ready";
    if (audioContext) audioContext.suspend();
  }

  function toggleRecording() {
    if (isRecording) stopRecording();
    else startRecording();
  }

  async function handleStructure() {
    if (provider === "gemini" && !apiKey) {
      showSettings = true;
      return;
    }
    status = "structuring";
    try {
      const redactedText = autoRedact ? redactPII(transcript) : transcript;
      const templatePrompt = TEMPLATES[selectedTemplate].prompt;

      let result: string;
      if (provider === "gemini") {
        result = await structureNote(redactedText, apiKey, templatePrompt);
      } else {
        result = await structureNoteLocal(
          redactedText,
          ollamaModel,
          templatePrompt,
        );
      }

      structuredNote = result;
      status = "ready";

      // Auto-copy
      if (autoCopy) {
        await navigator.clipboard.writeText(result);
      }

      // Save to history
      await saveSession({
        template: selectedTemplate,
        rawTranscript: transcript,
        redactedTranscript: redactedText,
        structuredNote: result,
        provider,
      });
      await refreshHistory();
    } catch (e) {
      errorMessage =
        provider === "gemini"
          ? "Gemini structuring failed"
          : "Ollama connection failed";
      status = "error";
    }
  }

  function newSession() {
    transcript = "";
    structuredNote = "";
    status = "ready";
  }

  onMount(() => initWorker());
  onDestroy(() => {
    if (worker) worker.terminate();
    if (audioContext) audioContext.close();
  });
</script>

<div
  class="flex flex-col items-center justify-center gap-8 w-full max-w-2xl px-6 py-6"
>
  <!-- Top Control Bar -->
  <div
    class="w-full glass-panel rounded-3xl p-5 flex justify-between items-center"
  >
    <div class="flex flex-col">
      <h2
        class="text-[10px] uppercase tracking-[0.4em] text-primary/60 font-bold"
      >
        Status
      </h2>
      <span
        class="text-lg font-mono tracking-widest text-base-content/90 uppercase"
        >{status}</span
      >
    </div>

    <div class="flex items-center gap-2">
      <!-- Stats Badge -->
      <div class="flex flex-col items-end mr-2 text-right">
        <span class="text-[9px] opacity-40 uppercase tracking-widest"
          >Sessions</span
        >
        <span class="text-[11px] font-mono font-bold text-primary"
          >{stats.today} Today / {stats.total} Total</span
        >
      </div>
      <button
        class="btn btn-circle btn-ghost btn-sm"
        onclick={() => (showHistory = !showHistory)}
        aria-label="History"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          /></svg
        >
      </button>
      <button
        class="btn btn-circle btn-ghost btn-sm"
        onclick={() => (showSettings = !showSettings)}
        aria-label="Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          /><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          /></svg
        >
      </button>
    </div>
  </div>

  <!-- History Panel -->
  {#if showHistory}
    <div
      class="glass-panel w-full rounded-3xl p-6 gap-4 flex flex-col max-h-[300px] overflow-y-auto animate-in fade-in zoom-in duration-300"
    >
      <h3 class="text-sm font-bold uppercase tracking-widest opacity-70">
        Recent Sessions
      </h3>
      {#if sessions.length === 0}
        <p class="text-xs opacity-50 text-center py-4">
          No sessions yet. Start recording!
        </p>
      {:else}
        {#each sessions as session}
          <div
            class="flex justify-between items-center p-3 bg-base-100/10 rounded-xl hover:bg-base-100/20 transition-colors"
          >
            <div class="flex flex-col">
              <span class="text-[10px] font-mono opacity-50"
                >{new Date(session.timestamp).toLocaleString()}</span
              >
              <span class="text-xs font-bold"
                >{TEMPLATES[session.template as TemplateId]?.icon}
                {TEMPLATES[session.template as TemplateId]?.name ||
                  session.template}</span
              >
            </div>
            <button
              class="btn btn-xs btn-ghost"
              onclick={() =>
                navigator.clipboard.writeText(session.structuredNote)}
              >COPY</button
            >
          </div>
        {/each}
      {/if}
    </div>
  {/if}

  <!-- Settings Panel -->
  {#if showSettings}
    <div
      class="glass-panel w-full rounded-3xl p-8 gap-6 flex flex-col animate-in fade-in zoom-in duration-300"
    >
      <div class="flex justify-between items-center">
        <h3 class="text-sm font-bold uppercase tracking-widest opacity-70">
          Configuration
        </h3>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <span class="label-text text-xs mb-2 opacity-50">LLM PROVIDER</span>
          <select
            class="select select-bordered select-sm bg-base-200/50"
            bind:value={provider}
          >
            <option value="gemini">Gemini (Atlas)</option>
            <option value="ollama">Ollama (Sovereign)</option>
          </select>
        </div>
        {#if provider === "gemini"}
          <div class="form-control">
            <span class="label-text text-xs mb-2 opacity-50">GEMINI KEY</span>
            <input
              type="password"
              placeholder="sk-..."
              class="input input-bordered input-sm bg-base-200/50"
              bind:value={apiKey}
            />
          </div>
        {:else}
          <div class="form-control">
            <span class="label-text text-xs mb-2 opacity-50">OLLAMA MODEL</span>
            <input
              type="text"
              placeholder="llama3"
              class="input input-bordered input-sm bg-base-200/50"
              bind:value={ollamaModel}
            />
          </div>
        {/if}
      </div>

      <div class="flex gap-6">
        <label class="label cursor-pointer gap-2">
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            bind:checked={autoRedact}
          />
          <span class="label-text text-[10px] opacity-70 uppercase font-bold"
            >Auto-Redact PII</span
          >
        </label>
        <label class="label cursor-pointer gap-2">
          <input
            type="checkbox"
            class="toggle toggle-success toggle-sm"
            bind:checked={autoCopy}
          />
          <span class="label-text text-[10px] opacity-70 uppercase font-bold"
            >Auto-Copy Result</span
          >
        </label>
      </div>

      <button
        class="btn btn-primary btn-block rounded-xl"
        onclick={saveSettings}>SAVE CONFIGURATION</button
      >
    </div>
  {/if}

  <!-- Template Selector -->
  <div class="w-full flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    {#each Object.values(TEMPLATES) as template}
      <button
        class="btn btn-sm grow rounded-2xl border-none transition-all duration-300 {selectedTemplate ===
        template.id
          ? 'btn-primary shadow-lg shadow-primary/20'
          : 'glass-panel opacity-60'}"
        onclick={() => (selectedTemplate = template.id)}
      >
        <span class="mr-1">{template.icon}</span>
        <span class="text-[10px] uppercase font-bold tracking-tighter"
          >{template.name}</span
        >
      </button>
    {/each}
  </div>

  <!-- The Blind Eye (Recorder Button) -->
  <div class="relative py-2">
    <button
      class="relative z-10"
      onclick={toggleRecording}
      disabled={status === "initializing" ||
        status === "error" ||
        status === "structuring"}
      aria-label="Toggle Recording"
    >
      {#if isRecording}
        <div
          class="absolute inset-0 bg-red-500/30 rounded-full animate-pulse-ring"
        ></div>
        <div
          class="absolute inset-0 bg-red-500/20 rounded-full animate-pulse-ring"
          style="animation-delay: 1s"
        ></div>
      {/if}

      <div
        class="relative w-40 h-40 flex items-center justify-center glass-panel rounded-full transition-all duration-700 {status ===
        'initializing'
          ? 'opacity-30'
          : 'hover:scale-105 active:scale-95'} {isRecording
          ? 'border-red-500/50 scale-110'
          : 'hover:border-primary/50'}"
      >
        <div
          class="w-14 h-14 rounded-full transition-all duration-700 {isRecording
            ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
            : 'bg-base-content/10'} {pulseClass}"
        ></div>
      </div>
    </button>
  </div>

  <!-- Transcript & Actions -->
  {#if transcript && !isRecording}
    <div
      class="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700"
    >
      <div class="flex justify-between items-end px-2">
        <div>
          <span
            class="text-[9px] uppercase font-bold tracking-[0.4em] text-primary/60"
            >RAM BUFFERED</span
          >
          <h4 class="text-xs font-mono opacity-80 uppercase tracking-widest">
            Raw Input
          </h4>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-xs rounded-lg" onclick={newSession}
            >NEW</button
          >
          <button
            class="btn btn-primary btn-sm rounded-xl shadow-lg px-6"
            onclick={handleStructure}
            disabled={status === "structuring"}
          >
            {#if status === "structuring"}
              <span class="loading loading-dots loading-xs"></span>
            {:else}
              STRUCTURE
            {/if}
          </button>
        </div>
      </div>
      <div
        class="w-full glass-panel rounded-2xl p-5 min-h-[60px] max-h-[120px] overflow-y-auto border-dashed border opacity-90 border-white/5"
      >
        <p
          class="font-mono text-xs leading-relaxed opacity-60 whitespace-pre-wrap"
        >
          {transcript}
        </p>
      </div>
    </div>
  {/if}

  <!-- Structured Result -->
  {#if structuredNote}
    <div
      class="w-full glass-panel rounded-[2rem] p-6 mt-2 border-t-2 border-primary/20 animate-in fade-in slide-in-from-bottom-10 duration-1000"
    >
      <div
        class="flex justify-between items-center mb-4 border-b border-white/5 pb-3"
      >
        <div class="flex items-center gap-2">
          <span class="text-[14px]">{TEMPLATES[selectedTemplate].icon}</span>
          <h3
            class="text-primary font-black uppercase tracking-[0.2em] text-[10px]"
          >
            {TEMPLATES[selectedTemplate].name}
          </h3>
          {#if autoCopy}
            <span class="badge badge-success badge-xs">COPIED</span>
          {/if}
        </div>
        <button
          class="btn btn-xs btn-outline btn-primary rounded-lg border-opacity-30"
          onclick={() => navigator.clipboard.writeText(structuredNote)}
          >COPY</button
        >
      </div>
      <div
        class="prose prose-sm font-sans max-w-none text-base-content/90 whitespace-pre-line leading-relaxed text-[12px]"
      >
        {structuredNote}
      </div>
    </div>
  {/if}
  {#if errorMessage}
    <div
      class="alert alert-error mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-900/30 border border-red-700/50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01"
        /></svg
      >
      <span class="text-sm font-medium">{errorMessage}</span>
    </div>
  {/if}

  <!-- Footer Warnings -->
  {#if isRecording}
    <div
      class="flex flex-col items-center gap-1 opacity-50 font-mono text-[9px] tracking-widest text-warning"
    >
      <div class="flex items-center gap-2">
        <span class="animate-pulse">●</span> NO DATA LEAVES RAM
      </div>
      {#if autoRedact}
        <div class="text-success opacity-80 font-bold">
          ● PII REDACTION ACTIVE
        </div>
      {/if}
    </div>
  {/if}
</div>
