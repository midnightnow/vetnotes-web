<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import {
		structureToSOAP,
		formatSOAPAsText,
		pushToPIMS,
		type SOAPNote,
	} from "$lib/services/aiva";
	import { structureViaGemini } from "$lib/services/gemini";
	import { redactPII, generateRedactionReport } from "$lib/utils/redactor";

	let isRecording = false;
	let isProcessing = false;
	let transcript = "";
	let rawTranscript = "";
	let status = "Ready for Consult";
	let elapsedTime = 0;
	let keyInsights = 0;
	let isPushing = false;
	let recognition: any = null;
	let interimTranscript = "";
	let isPro = false;
	let showSettings = false;
	let aivaApiKey = "";

	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let timerInterval: NodeJS.Timer | null = null;
	let soapNote: SOAPNote | null = null;

	onMount(async () => {
		// Detect if running on .pro domain
		if (typeof window !== "undefined") {
			isPro = window.location.hostname.includes("vetnotes.pro");
			const storedKey = localStorage.getItem("aiva_api_key");
			if (storedKey) aivaApiKey = storedKey;
		}

		// Initialize Web Speech API
		if (
			"webkitSpeechRecognition" in window ||
			"SpeechRecognition" in window
		) {
			const SpeechRecognition =
				(window as any).SpeechRecognition ||
				(window as any).webkitSpeechRecognition;
			recognition = new SpeechRecognition();
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.lang = "en-US";

			recognition.onresult = (event: any) => {
				let interim = "";
				let final = "";

				for (let i = event.resultIndex; i < event.results.length; i++) {
					const transcript = event.results[i][0].transcript;
					if (event.results[i].isFinal) {
						final += transcript + " ";
					} else {
						interim += transcript;
					}
				}

				if (final) {
					rawTranscript += final;
				}
				interimTranscript = interim;
			};

			recognition.onerror = (event: any) => {
				console.error("Speech recognition error:", event.error);
				if (event.error === "no-speech") {
					status = "No speech detected - please speak clearly";
				} else if (event.error === "not-allowed") {
					status = "Microphone access denied";
				}
			};

			status = "Ready for Consult";
		} else {
			status = "Speech recognition not supported in this browser";
		}
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
	});

	async function toggleRecording() {
		if (!isRecording) {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});

				// Start speech recognition
				if (recognition) {
					rawTranscript = "";
					interimTranscript = "";
					recognition.start();
				}

				// Also record audio for backup
				mediaRecorder = new MediaRecorder(stream, {
					mimeType: "audio/webm",
				});
				audioChunks = [];
				elapsedTime = 0;

				mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						audioChunks.push(event.data);
					}
				};

				mediaRecorder.onstop = async () => {
					if (recognition) {
						recognition.stop();
					}
					await processRecording();
				};

				mediaRecorder.start(1000); // Collect chunks every second
				isRecording = true;
				status = "Listening to consult...";

				// Start timer
				timerInterval = setInterval(() => {
					elapsedTime++;
				}, 1000);
			} catch (err) {
				console.error("Error accessing mic:", err);
				status = "Microphone Access Denied";
			}
		} else {
			if (mediaRecorder) {
				mediaRecorder.stop();
				mediaRecorder.stream
					.getTracks()
					.forEach((track) => track.stop());
			}
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
			isRecording = false;
		}
	}

	async function processRecording() {
		isProcessing = true;
		status = "Processing transcript...";

		try {
			// Use the speech recognition transcript if available
			if (!rawTranscript || rawTranscript.trim().length === 0) {
				status = "No speech detected - please try again";
				isProcessing = false;
				return;
			}

			status = "Redacting PII...";
			const redactedTranscript = redactPII(rawTranscript, {
				aggressive: true,
			});
			const report = generateRedactionReport(
				rawTranscript,
				redactedTranscript,
			);
			console.log("Redaction report:", report);

			status = "Structuring SOAP via AIVA (Cloud)...";

			// Try Gemini first for higher quality, fall back to local rule-based AIVA
			try {
				const geminiSOAP = await structureViaGemini(
					redactedTranscript,
					aivaApiKey,
				);
				soapNote = geminiSOAP;
				status = "Structured via Gemini Cloud";
			} catch (geminiError) {
				console.warn(
					"Gemini failed, falling back to local AIVA:",
					geminiError,
				);
				status = "Structuring SOAP via AIVA (Local)...";
				soapNote = await structureToSOAP(redactedTranscript, false);
			}

			transcript = formatSOAPAsText(soapNote!);

			// Count key insights (simple heuristic)
			keyInsights =
				(soapNote.missedCharges?.length || 0) +
				(transcript.match(/\d+/g)?.length || 0);

			status = "Consult Structured";
		} catch (error) {
			console.error("Processing error:", error);
			status = "Processing Failed - Please retry";
		} finally {
			isProcessing = false;
		}
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(transcript);
		status = "Copied to Clipboard";
		setTimeout(() => (status = "Consult Structured"), 2000);
	}

	async function handlePushToPIMS() {
		if (!soapNote) return;

		isPushing = true;
		status = "Syncing with PIMS...";

		try {
			const result = await pushToPIMS(soapNote, "ezyvet");
			if (result.success) {
				status = "Synced Successfully";
			} else {
				status = "PIMS Sync Failed";
				alert(result.message);
			}
		} catch (error) {
			console.error("PIMS error:", error);
			status = "PIMS Connection Error";
		} finally {
			isPushing = false;
			setTimeout(() => {
				if (
					status === "Synced Successfully" ||
					status === "PIMS Sync Failed"
				) {
					status = "Consult Structured";
				}
			}, 3000);
		}
	}

	function clearWorkspace() {
		transcript = "";
		rawTranscript = "";
		soapNote = null;
		keyInsights = 0;
		elapsedTime = 0;
		status = "Ready for Consult";
	}
</script>

<svelte:head>
	<title>VetNotes.me | Sovereign Voice-to-SOAP</title>
	<meta
		name="description"
		content="Privacy-first veterinary SOAP note generation. Local transcription, zero data retention."
	/>
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-12">
	<!-- Header -->
	<header class="flex justify-between items-center mb-16">
		<div class="flex items-center space-x-3">
			<div
				class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
			>
				<svg
					class="w-6 h-6 text-white"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m8 0h-3m4-8a3 3 0 01-3 3H9a3 3 0 01-3-3V5a3 3 0 116 0v6z"
					></path></svg
				>
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">
					VetNotes<span class="text-blue-400"
						>.{isPro ? "pro" : "me"}</span
					>
				</h1>
				<p
					class="text-xs text-white/40 uppercase tracking-widest font-semibold"
				>
					Sovereign Intelligence
				</p>
			</div>
		</div>

		<div class="flex items-center space-x-6 text-sm">
			<a
				href="https://aiva.help"
				class="text-white/60 hover:text-white transition-colors">AIVA</a
			>
			<a
				href="https://aivet.dev"
				class="text-white/60 hover:text-white transition-colors"
				>AIVET</a
			>
			<a
				href="https://vetnotes.pro"
				class="text-white/60 hover:text-white transition-colors"
				>Macagent Pro</a
			>
			<a
				href="https://vetsorcery.com"
				class="text-white/60 hover:text-white transition-colors"
				>Vetsorcery</a
			>
			<a
				href="https://vetnotes.pro"
				class="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 border border-white/10"
			>
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
					></path>
				</svg>
				<span>Download Macagent</span>
			</a>
			<div class="h-4 w-px bg-white/10"></div>
			<div class="flex items-center space-x-2">
				<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"
				></span>
				<span class="text-white/40 font-mono text-[10px]"
					>CLOUD_ACTIVE</span
				>
			</div>
			<button
				class="text-white/40 hover:text-white transition-colors"
				on:click={() => (showSettings = true)}
				title="Configure AIVA Key"
			>
				<svg
					class="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					></path>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					></path>
				</svg>
			</button>
		</div>
	</header>

	<!-- Settings Modal -->
	{#if showSettings}
		<div
			class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
		>
			<div
				class="bg-gray-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative"
			>
				<button
					class="absolute top-4 right-4 text-white/40 hover:text-white"
					on:click={() => (showSettings = false)}
				>
					<svg
						class="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path></svg
					>
				</button>
				<h2 class="text-xl font-bold mb-4">AIVA Voice Configuration</h2>
				<p class="text-sm text-gray-400 mb-6">
					Enter your <strong>AIVA Voice API Key</strong> to enable
					premium cloud structuring and
					<span class="text-green-400">Revenue Hunter</span>.
				</p>

				<div
					class="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
				>
					<p class="text-xs text-blue-200 mb-2">Don't have a key?</p>
					<a
						href="https://aiva.vet"
						target="_blank"
						class="text-blue-400 hover:text-blue-300 font-bold text-sm flex items-center"
					>
						Start 14-Day Free Trial ($49/mo)
						<svg
							class="w-4 h-4 ml-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							></path></svg
						>
					</a>
				</div>

				<div class="space-y-4">
					<div>
						<label
							class="block text-xs uppercase text-gray-500 font-bold mb-2"
							>API Key</label
						>
						<input
							type="password"
							bind:value={aivaApiKey}
							placeholder="AIzaSy..."
							class="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
						/>
					</div>
				</div>

				<div class="mt-8 flex justify-end">
					<button
						class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
						on:click={() => {
							localStorage.setItem("aiva_api_key", aivaApiKey);
							showSettings = false;
						}}
					>
						Save Configuration
					</button>
				</div>
			</div>
		</div>
	{/if}

	<main class="grid lg:grid-cols-3 gap-8">
		<!-- Sidebar / History -->
		<div class="glass-panel rounded-3xl p-6 h-fit bg-white/[0.02]">
			<h2 class="text-lg font-semibold mb-6 flex items-center">
				<svg
					class="w-5 h-5 mr-2 text-blue-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					></path></svg
				>
				Session Info
			</h2>
			<div class="space-y-4">
				<div
					class="p-4 rounded-2xl bg-white/[0.03] border border-white/5"
				>
					<p class="text-xs text-white/40 uppercase mb-1">
						Engine Status
					</p>
					<p class="text-sm font-medium text-blue-300">
						{status}
					</p>
				</div>
				<div
					class="p-4 rounded-2xl bg-white/[0.03] border border-white/5"
				>
					<p class="text-xs text-white/40 uppercase mb-1">
						Privacy Mode
					</p>
					<p class="text-sm font-medium text-blue-400">
						Zero Retention Active
					</p>
				</div>
				<div
					class="p-4 rounded-2xl bg-white/[0.03] border border-white/5"
				>
					<p class="text-xs text-white/40 uppercase mb-1">
						SOAP Engine
					</p>
					<p class="text-sm font-medium text-white/80">
						AIVA v1.0 (Local Rules)
					</p>
				</div>
				<button
					on:click={clearWorkspace}
					class="w-full py-3 text-sm text-white/60 hover:text-white transition-colors border border-dashed border-white/20 rounded-2xl hover:border-white/40"
				>
					Clear Workspace
				</button>
			</div>
		</div>

		<!-- Central Action Area -->
		<div class="lg:col-span-2 space-y-8">
			<!-- Recording Interface -->
			<div
				class="glass-panel rounded-[2.5rem] p-12 text-center relative overflow-hidden"
			>
				<div
					class="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none"
				></div>

				<p
					class="text-blue-400/80 font-mono text-xs tracking-widest uppercase mb-4"
				>
					{status}
				</p>

				<div class="relative inline-block mb-10">
					{#if isRecording}
						<div
							class="absolute inset-0 animate-pulse-ring rounded-full bg-red-500/20"
						></div>
					{/if}
					{#if isProcessing}
						<div
							class="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500"
						></div>
					{/if}
					<button
						on:click={toggleRecording}
						disabled={isProcessing}
						class="relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 transform {isRecording
							? 'bg-red-500 rotate-90 scale-90 shadow-red-500/40'
							: isProcessing
								? 'bg-gray-600 cursor-not-allowed'
								: 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:scale-105 shadow-blue-500/30'} shadow-[0_0_40px_rgba(0,0,0,0.3)] z-10"
					>
						{#if isRecording}
							<svg
								class="w-10 h-10 text-white fill-current"
								viewBox="0 0 24 24"
								><rect x="6" y="6" width="12" height="12"
								></rect></svg
							>
						{:else if isProcessing}
							<svg
								class="w-10 h-10 text-white animate-pulse"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								></path>
							</svg>
						{:else}
							<svg
								class="w-10 h-10 text-white fill-current"
								viewBox="0 0 24 24"
								><path
									d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
								/><path
									d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
								/></svg
							>
						{/if}
					</button>
				</div>

				<div class="flex justify-center space-x-12">
					<div class="text-center">
						<span class="block text-2xl font-bold font-mono"
							>{formatTime(elapsedTime)}</span
						>
						<span
							class="text-[10px] text-white/40 uppercase tracking-widest"
							>Elapsed</span
						>
					</div>
					<div class="h-10 w-px bg-white/10"></div>
					<div class="text-center">
						<span
							class="block text-2xl font-bold font-mono text-blue-400"
							>{keyInsights}</span
						>
						<span
							class="text-[10px] text-white/40 uppercase tracking-widest"
							>Key Insights</span
						>
					</div>
				</div>
			</div>

			<!-- Output / Transcript Area -->
			<div
				class="glass-panel rounded-[2.5rem] p-8 min-h-[400px] flex flex-col"
			>
				<div class="flex justify-between items-center mb-6">
					<h3 class="text-lg font-semibold text-white/80">
						Structured SO<span class="text-blue-400 text-sm"
							>AIVA</span
						>P Note
					</h3>
					<div class="flex space-x-3">
						<button
							on:click={copyToClipboard}
							disabled={!transcript}
							class="px-4 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<svg
								class="w-4 h-4 mr-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
								></path></svg
							>
							Copy Note
						</button>
						<button
							on:click={handlePushToPIMS}
							disabled={!transcript || isPushing}
							class="px-4 py-2 text-xs font-semibold {isPushing
								? 'bg-blue-800'
								: 'bg-blue-600 hover:bg-blue-500'} rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center"
						>
							{#if isPushing}
								<svg
									class="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Syncing...
							{:else}
								Push to PIMS
							{/if}
						</button>
					</div>
				</div>

				<div
					class="flex-grow bg-black/20 rounded-2xl p-6 border border-white/5 font-mono text-sm leading-relaxed whitespace-pre-wrap text-white/90"
				>
					{#if transcript}
						{transcript}
					{:else}
						<div
							class="h-full flex flex-col items-center justify-center text-white/20 space-y-4"
						>
							<svg
								class="w-12 h-12"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								></path></svg
							>
							<p class="text-center italic">
								Waiting for AIVA analysis...<br /><span
									class="text-[10px] not-italic opacity-50"
									>Press the mic button to start recording.</span
								>
							</p>
						</div>
					{/if}
				</div>

				<!-- Ethics/Sovereignty Footer -->
				<div
					class="mt-6 flex items-center justify-between text-[10px] text-white/30 uppercase tracking-widest font-bold"
				>
					<span>ZERO DATA RETENTION POLICY</span>
					<div class="flex space-x-4">
						<span>PII REDACTION: ACTIVE</span>
						<span>LOCAL PROCESSING: ENABLED/FALLBACK</span>
					</div>
				</div>
			</div>
		</div>
	</main>

	<!-- Project Footer -->
	<footer class="mt-20 text-center">
		<p class="text-white/20 text-sm">
			Powered by <span
				class="text-white/40 font-semibold tracking-tighter"
				>AIVet.dev</span
			>
			&bull; Sovereign Clinician Alliance 2026
		</p>
	</footer>
</div>
