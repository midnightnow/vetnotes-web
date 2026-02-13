<script lang="ts">
	import { onMount, onDestroy, afterUpdate } from "svelte";
	import {
		structureToSOAP,
		formatSOAPAsText,
		type SOAPNote,
	} from "$lib/services/aiva";
	import { structureViaGemini } from "$lib/services/gemini";
	import { redactPII, generateRedactionReport } from "$lib/utils/redactor";
	import { SOAP_TEMPLATES } from "$lib/data/templates";
	import {
		ShorthandEngine,
		type AxisType,
	} from "$lib/services/ShorthandEngine";
	import AxisPickerModal from "$lib/components/AxisPickerModal.svelte";
	import { ClinicalEncryptionService } from "$lib/security/ClinicalEncryptionService";
	import {
		KeyEscrowService,
		DEFAULT_CLINIC_ID,
	} from "$lib/security/KeyEscrowService";
	import {
		CORE_SYNC_CHANNEL,
		volatileBillingTray,
	} from "$lib/stores/VolatileStore";
	import { instrumentationParams } from "$lib/services/InstrumentationHook";
	import { detectNotifiableConditions } from "$lib/services/biosecurity";
	import type { NotifiableCondition } from "$lib/data/notifiable";
	import { generateRegulatoryHTML } from "$lib/services/RegulatorySubmission";
	import { player } from "$lib/stores/player";
	import {
		TrustedSignature,
		type ClinicalPayload,
	} from "$lib/services/TrustedSignature";
	import ReferenceSidebar from "$lib/components/ReferenceSidebar.svelte";

	let evidenceSeal = "";
	let evidenceHash = "";

	$: ({ level, xp, happyValleyCredits, preferredLens, displayName } =
		$player);

	// Sovereign Sync Types
	interface CoreSyncMessage {
		type: string;
		origin: "VETSORCERY" | "AIVET" | "VETNOTES";
		payload: any;
		timestamp: number;
	}

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
	let isPro = true;
	let showSettings = false;
	let aivaApiKey = "";

	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let timerInterval: any = null;
	let soapNote: SOAPNote | null = null;

	// Sovereign State
	let selectedTemplate = "wellness_exam"; // Default
	let syncChannel: BroadcastChannel | null = null;
	let isCoreLinked = false;

	// Shorthand & Research State
	let isEditorMode = true; // Allow manual editing by default
	let activeAxisType: AxisType | null = null;
	let showAxisPicker = false;
	let editorCursorPos = 0;
	let activeTriggerRange = { start: 0, end: 0 };

	// Subscribe to Vitals
	let vitals: any = null;
	instrumentationParams.subscribe((v) => (vitals = v));

	// Subscribe to Billing
	let billingItems: any[] = [];
	volatileBillingTray.subscribe((items) => (billingItems = items));

	// Biosecurity Alerts
	let activeAlerts: NotifiableCondition[] = [];
	$: activeAlerts = detectNotifiableConditions(transcript || rawTranscript);

	function handleRegulatoryExport(condition: NotifiableCondition) {
		const html = generateRegulatoryHTML(
			condition,
			transcript || rawTranscript,
			{
				tox: transcript?.match(/\*tox:\s*([^*]+)/i)?.[1]?.trim(),
				path: transcript?.match(/\*path:\s*([^*]+)/i)?.[1]?.trim(),
				vital: transcript?.match(/\*vital:\s*([^*]+)/i)?.[1]?.trim(),
			},
		);
		const win = window.open("", "_blank");
		if (win) {
			win.document.write(html);
			win.document.close();
		}
	}

	$: integrityScore = calculateIntegrityScore(
		transcript || rawTranscript,
		selectedTemplate,
	);

	// Auto-start simulation for high-stakes/research modes if no real feed
	$: if (
		[
			"research_study",
			"gardening_consult",
			"plant_biosecurity",
			"invasive_species",
			"envenomation",
		].includes(selectedTemplate)
	) {
		instrumentationParams.startSimulation();
	} else {
		instrumentationParams.stopSimulation();
	}

	function calculateIntegrityScore(
		text: string,
		templateKey: string,
	): number {
		const highIntegrityModes = [
			"research_study",
			"gardening_consult",
			"plant_biosecurity",
			"invasive_species",
			"envenomation",
		];
		if (!highIntegrityModes.includes(templateKey)) return 100; // Not applicable for standard clinical notes
		if (!text) return 0;

		let score = 20; // Base score for content
		if (text.includes("[LESION DESCRIPTION - MULTI-AXIS]")) score += 30;
		if (text.includes("[PATHOLOGY MODULE]")) score += 20;
		if (text.includes("HR:") || text.includes("*vital:")) score += 10;
		if (text.length > 200) score += 20;

		return Math.min(100, score);
	}

	function handleCaptureVitals() {
		if (!vitals) return;
		const vitalString = `\n[VITALS] HR:${vitals.heartRate} bpm | SpO2:${vitals.spo2}% | RR:${vitals.respRate} | T:${vitals.temp}C (${vitals.source})\n`;

		// Append to editor
		if (isEditorMode) {
			rawTranscript += vitalString;
			transcript = rawTranscript;
		} else {
			// If in transcript mode, we still append to raw for consistency
			rawTranscript += vitalString;
		}
	}

	onMount(async () => {
		instrumentationParams.connect();
		volatileBillingTray.restore();
		// Detect if running on .pro domain
		if (typeof window !== "undefined") {
			isPro = window.location.hostname.includes("vetnotes.pro");
			const storedKey = localStorage.getItem("aiva_api_key");
			if (storedKey) aivaApiKey = storedKey;

			// CONNECT TO SOVEREIGN ENGINE (Bridge to Port 3000/3001)
			try {
				syncChannel = new BroadcastChannel(CORE_SYNC_CHANNEL);
				syncChannel.onmessage = (event) => {
					const msg = event.data as CoreSyncMessage;
					if (msg.origin !== "VETNOTES") {
						console.log(
							`[Core Sync] Received from ${msg.origin}:`,
							msg.type,
						);
						if (
							msg.type === "SESSION_PING" ||
							msg.type === "PATIENT_CONTEXT_UPDATE"
						) {
							isCoreLinked = true;
							status = "Linked to Core Engine";
						}
					}
				};
				// Announce presence to backend
				syncChannel.postMessage({
					type: "SESSION_PING",
					origin: "VETNOTES",
					payload: { status: "ready" },
					timestamp: Date.now(),
				});
			} catch (e) {
				console.warn("BroadcastChannel not supported or blocked");
			}
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
		if (timerInterval) clearInterval(timerInterval as any);
		if (syncChannel) syncChannel.close();
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

				// FALLBACK: SIMULATION MODE (For Demo/No-Mic Environments)
				console.warn("Activating Simulation Mode due to mic error");
				isRecording = true;
				status = "Simulating Clinical Stream (Demo)";
				elapsedTime = 0;

				// Simulate periodic text injection
				const dummyTextValue =
					" Patient presents for lethargy and vomiting... owner reports 2 day duration... examining abdomen... tensing on palpation... ";
				let simulationIndex = 0;

				// 1. Core Clock (1Hz)
				timerInterval = setInterval(() => {
					elapsedTime++;
				}, 1000);

				// 2. Typing Simulator (Fast)
				const typingInterval = setInterval(() => {
					if (simulationIndex < dummyTextValue.length) {
						// Add small randomization for realism
						if (Math.random() > 0.1) {
							rawTranscript += dummyTextValue[simulationIndex];
							simulationIndex++;
						}
					} else {
						simulationIndex = 0; // Loop context
						rawTranscript += " [Stream Refreshed] ";
					}
				}, 50);

				// Cleanup helper to clear both
				const originalClear = clearInterval;
				// @ts-ignore
				window._clearSim = () => {
					clearInterval(timerInterval);
					clearInterval(typingInterval);
				};
			}
		} else {
			if (mediaRecorder) {
				mediaRecorder.stop();
				mediaRecorder.stream
					.getTracks()
					.forEach((track) => track.stop());
			}
			if (timerInterval) {
				clearInterval(timerInterval as any);
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

			// SECURE AT REST: Encrypt the raw transcript using Noctua Sentinel signatures
			status = "Encrypting Clinical Data (Sentinel)...";
			const clinicId = isPro ? "CLINIC_PRO_DEFAULT" : DEFAULT_CLINIC_ID;
			const encryptedTranscript =
				await ClinicalEncryptionService.encryptWithVault(
					rawTranscript,
					clinicId,
				);
			console.log(
				"🔒 Clinical Data Sealed:",
				encryptedTranscript.signature,
			);

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
				status = "Structuring SOAP via AIVA...";
				soapNote = await structureToSOAP(redactedTranscript, false);
			}

			transcript = formatSOAPAsText(soapNote!);

			// Count key insights (simple heuristic)
			keyInsights =
				(soapNote?.missedCharges?.length || 0) +
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

		// Forensic Integrity Gate: Block if high-stakes and score < 100
		const highIntegrityModes = [
			"research_study",
			"gardening_consult",
			"plant_biosecurity",
			"invasive_species",
			"envenomation",
		];

		if (
			highIntegrityModes.includes(selectedTemplate) &&
			integrityScore < 100
		) {
			status = "EVIDENCE LOCK ACTIVE";
			alert(
				"Incomplete Forensic Data: Clinical Integrity Score must be 100% to lock evidence and sync. Please enrich with *tox:, *path:, or *vital:",
			);
			return;
		}

		isPushing = true;
		status = "Generating Evidence Seal...";

		try {
			// Generate Sovereign Signature
			const payload: ClinicalPayload = {
				caseId: `VET-${Date.now()}`,
				transcript: transcript || rawTranscript,
				axes: {
					tox: transcript?.match(/\*tox:\s*([^*]+)/i)?.[1]?.trim(),
					path: transcript?.match(/\*path:\s*([^*]+)/i)?.[1]?.trim(),
					vital: transcript
						?.match(/\*vital:\s*([^*]+)/i)?.[1]
						?.trim(),
				},
				revenue: (soapNote.missedCharges || []).length * 150 + 145, // Demo revenue calculation
				timestamp: Date.now(),
			};

			const { hash, seal } = TrustedSignature.lockEvidence(payload);
			evidenceHash = hash;
			evidenceSeal = seal;

			status = "Syncing with PIMS...";
			const result = await pushToPIMS(soapNote, "ezyvet");

			if (result.success) {
				status = "Synced Successfully";

				// Post-sync: Notify the Sovereign Alliance channel
				if (syncChannel) {
					syncChannel.postMessage({
						type: "EVIDENCE_COMMITTED",
						origin: "VETNOTES",
						payload: { hash, seal, caseId: payload.caseId },
						timestamp: Date.now(),
					});
				}
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
		volatileBillingTray.clear();
	}

	function handleEditorInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		const val = target.value;
		const cursor = target.selectionStart;

		// Simple scan for last typed trigger
		// Look back 15 chars for a *trigger: pattern
		const lookback = val.substring(Math.max(0, cursor - 15), cursor);
		const matches = ShorthandEngine.scan(lookback);

		if (matches.length > 0) {
			const match = matches[matches.length - 1];
			// Only trigger if we just typed the colon
			if (lookback.endsWith(match.trigger)) {
				activeAxisType = match.axis as AxisType;
				// Calculate absolute positions
				activeTriggerRange = {
					start: cursor - match.trigger.length,
					end: cursor,
				};
				showAxisPicker = true;
			}
		}

		// Sync rawTranscript for integrity check
		rawTranscript = val;
	}

	function handleAxisSave(event: CustomEvent<Record<string, string>>) {
		if (!activeAxisType) return;
		const payload = event.detail;
		const expansion = ShorthandEngine.expand(activeAxisType, payload);

		if (activeAxisType === "billing") {
			volatileBillingTray.addItem({
				sku: payload.code || "CONS-1",
				description: payload.category || "Consultation",
				quantity: 1,
				unitPrice: 0,
				category: payload.category || "General",
				originNote: expansion,
			});
		}

		// Inject expansion into text
		const pre = rawTranscript.substring(0, activeTriggerRange.start);
		const post = rawTranscript.substring(activeTriggerRange.end);

		rawTranscript = pre + expansion + post;
		// If we are in transcript mode, update that too if needed, but here we assume rawTranscript is the editor model
		transcript = rawTranscript;

		showAxisPicker = false;
		activeAxisType = null;
	}

	afterUpdate(() => {
		// Auto-scroll stream boxes
		const rawBox = document.getElementById("raw-stream-box");
		const soapBox = document.getElementById("soap-stream-box");
		if (rawBox) rawBox.scrollTop = rawBox.scrollHeight;
		if (soapBox) soapBox.scrollTop = soapBox.scrollHeight;
	});
</script>

<svelte:head>
	<title>VetNotes.me</title>
	<meta
		name="description"
		content="Privacy-first veterinary SOAP note generation. On-device privacy, zero data retention."
	/>
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-12">
	<header
		class="flex justify-between items-center mb-12 border-b border-white/5 pb-6"
	>
		<div class="flex items-center space-x-4">
			<div class="w-12 h-12 clinic-icon shadow-inner"></div>
			<div>
				<h1 class="text-xl font-bold tracking-tight text-white/90">
					[Vetnotes<span class="text-blue-400">.pro</span>]
				</h1>
				<p
					class="text-[10px] text-white/40 font-mono tracking-widest uppercase"
				>
					Clinical Workflow Workspace
				</p>
			</div>
		</div>

		<div class="flex items-center space-x-4">
			<div
				class="hidden md:flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/10"
			>
				<span
					class="w-2 h-2 rounded-full {isCoreLinked
						? 'bg-green-500 animate-pulse'
						: 'bg-orange-500'}"
				></span>
				<span
					class="text-[9px] font-bold text-white/60 uppercase tracking-tighter"
				>
					{isCoreLinked ? "Cloud Connected" : "Local Mode"}
				</span>
			</div>
			<ProButton
				type="ghost"
				size="sm"
				on:click={() => (showSettings = true)}
			>
				Settings
			</ProButton>
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

	<main class="grid lg:grid-cols-4 gap-8">
		<!-- Left Sidebar: Session Guard -->
		<aside class="space-y-6">
			<div class="glass-panel rounded-[2rem] p-6 space-y-6">
				<div>
					<p
						class="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-4"
					>
						Cloud Status
					</p>
					<div class="flex items-center space-x-3">
						<div class="relative flex items-center justify-center">
							<span
								class="w-2.5 h-2.5 rounded-full {isCoreLinked
									? 'bg-green-400'
									: 'bg-white/10'}"
							></span>
							{#if isCoreLinked}
								<div
									class="absolute inset-0 bg-green-400/20 blur-sm rounded-full animate-pulse"
								></div>
							{/if}
						</div>
						<p
							class="text-xs font-bold {isCoreLinked
								? 'text-white'
								: 'text-white/20'}"
						>
							{isCoreLinked ? "AIVA_CORE_STABLE" : "CORE_OFFLINE"}
						</p>
					</div>
				</div>

				<div
					class="pt-8 border-t border-white/5 flex flex-col items-center"
				>
					<div class="relative w-28 h-28 mb-4">
						<svg class="w-full h-full transform -rotate-90">
							<circle
								cx="56"
								cy="56"
								r="50"
								stroke="currentColor"
								stroke-width="10"
								fill="transparent"
								class="text-white/5"
							/>
							<circle
								cx="56"
								cy="56"
								r="50"
								stroke="currentColor"
								stroke-width="10"
								fill="transparent"
								class="text-blue-500 transition-all duration-700 ease-out"
								stroke-dasharray="314.159"
								stroke-dashoffset={314.159 -
									(314.159 * integrityScore) / 100}
								stroke-linecap="round"
							/>
						</svg>
						<div
							class="absolute inset-0 flex flex-col items-center justify-center"
						>
							<span
								class="text-2xl font-bold text-white leading-none"
								>{integrityScore}%</span
							>
							<span
								class="text-[8px] text-white/40 uppercase font-bold tracking-[0.2em] mt-1"
								>Integrity</span
							>
						</div>
					</div>
					<p
						class="text-[9px] text-white/30 uppercase tracking-widest font-mono"
					>
						{integrityScore > 80
							? "HIGH_TRUST_SIGNAL"
							: "AUGMENTED_SKEPTICISM"}
					</p>
				</div>

				<!-- Billing Vault -->
				<div class="pt-6 border-t border-white/5">
					<div class="flex justify-between items-center mb-4">
						<p
							class="text-[10px] text-white/40 uppercase tracking-widest font-bold"
						>
							Billing Vault
						</p>
						<span class="text-blue-400 font-mono text-xs"
							>{billingItems.length}</span
						>
					</div>
					<div
						class="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2"
					>
						{#each billingItems as item}
							<div
								class="flex justify-between items-center bg-black/30 p-2 rounded-lg text-[10px] border border-white/5 group"
							>
								<div class="flex items-center gap-3 min-w-0">
									<img
										src="/assets/icon_gold_coin.png"
										alt="coin"
										class="w-4 h-4 object-contain opacity-80"
									/>
									<div class="flex-grow min-w-0">
										<div class="flex items-center gap-2">
											<span
												class="text-blue-300 font-mono font-bold uppercase truncate"
												>{item.sku}</span
											>
											<span
												class="text-[9px] text-white/30"
												>x{item.quantity}</span
											>
										</div>
									</div>
								</div>
								<button
									on:click={() =>
										volatileBillingTray.removeItem(item.id)}
									class="opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-all"
								>
									<svg
										class="w-3 h-3"
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
							</div>
						{:else}
							<p
								class="text-[9px] text-white/20 italic text-center py-4"
							>
								No charges detected yet.
							</p>
						{/each}
					</div>
				</div>

				{#if evidenceSeal}
					<div
						class="glass-panel p-4 rounded-2xl border border-blue-500/50 bg-blue-500/10 animate-in fade-in zoom-in duration-500 mt-4"
					>
						<div class="flex items-center space-x-2 mb-3">
							<div
								class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"
							></div>
							<h3
								class="text-[10px] font-black text-blue-300 uppercase tracking-tighter"
							>
								Sovereign Evidence Seal
							</h3>
						</div>

						<div class="space-y-3">
							<div>
								<span
									class="block text-[8px] text-white/30 uppercase font-bold mb-1"
									>SHA-256 Vault Hash</span
								>
								<div
									class="bg-black/40 p-2 rounded border border-white/5 font-mono text-[8px] text-blue-200/50 break-all select-all"
								>
									{evidenceHash}
								</div>
							</div>

							<div>
								<span
									class="block text-[8px] text-white/30 uppercase font-bold mb-1"
									>Cryptographic Seal</span
								>
								<div
									class="bg-black/40 p-2 rounded border border-white/5 font-mono text-[8px] text-green-400/70 break-all select-all"
								>
									{evidenceSeal}
								</div>
							</div>

							<div
								class="flex justify-between items-center py-2 border-t border-white/5 mt-2"
							>
								<span class="text-[9px] text-blue-400 font-bold"
									>SOVEREIGN_LOCKED</span
								>
								<div
									class="px-2 py-0.5 rounded bg-blue-400/20 border border-blue-400/30 text-[8px] text-blue-300 font-mono"
								>
									v4.2.0-SECURE
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</aside>

		<!-- Main Workspace -->
		<section class="lg:col-span-3 space-y-8">
			<!-- Clinical Intelligence Dashboard -->
			<div
				class="glass-panel rounded-[2.5rem] p-8 min-h-[400px] flex flex-col"
			>
				<div class="flex justify-between items-center mb-8">
					<div class="flex items-center gap-4">
						<div
							class="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center"
						>
							<svg
								class="w-6 h-6 text-blue-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-xl font-bold text-white/90">
								Clinical Intelligence
							</h3>
							<p
								class="text-xs text-white/40 uppercase tracking-widest"
							>
								AI-Powered Analysis
							</p>
						</div>
					</div>
					<div class="flex space-x-3">
						<button
							on:click={copyToClipboard}
							disabled={!transcript}
							class="px-4 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center disabled:opacity-50"
						>
							Copy Note
						</button>
						<button
							on:click={handlePushToPIMS}
							disabled={!transcript || isPushing}
							class="px-4 py-2 text-xs font-semibold {isPushing
								? 'bg-blue-800'
								: 'bg-blue-600 hover:bg-blue-500'} rounded-xl transition-all shadow-lg"
						>
							{isPushing ? "Pushing..." : "Sync to PIMS"}
						</button>
					</div>
				</div>

				<div class="grid md:grid-cols-3 gap-8 flex-grow">
					<!-- Statistics & Scoring -->
					<div class="space-y-6">
						<div
							class="bg-black/20 rounded-2xl p-6 border border-white/5"
						>
							<div
								class="flex items-center gap-3 mb-4 text-blue-400"
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
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
								<span class="text-[10px] uppercase font-black"
									>Live Performance</span
								>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="text-center">
									<span
										class="block text-2xl font-bold font-mono text-white"
										>{formatTime(elapsedTime)}</span
									>
									<span
										class="text-[10px] text-white/40 uppercase tracking-widest"
										>Elapsed</span
									>
								</div>
								<div class="text-center">
									<span
										class="block text-2xl font-bold font-mono text-blue-400"
										>{keyInsights}</span
									>
									<span
										class="text-[10px] text-white/40 uppercase tracking-widest"
										>Insights</span
									>
								</div>
							</div>
						</div>

						<!-- Tool Belt for Clinical Templates -->
						<div class="pt-4">
							<p
								class="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-4"
							>
								Tool Belt
							</p>
							<div class="grid grid-cols-2 gap-3">
								{#each Object.entries(SOAP_TEMPLATES).slice(0, 4) as [key, template]}
									<button
										on:click={() =>
											(selectedTemplate = key)}
										class="tool-btn {selectedTemplate ===
										key
											? 'active'
											: ''}"
									>
										<div
											class="tool-icon {key.includes(
												'wellness',
											)
												? 'icon-clinic'
												: key.includes('sick')
													? 'icon-heart'
													: key.includes(
																'vaccination',
														  )
														? 'icon-kit'
														: key.includes('dental')
															? 'icon-kit'
															: 'icon-heart'}"
										></div>
										<span class="label text-[8px]"
											>{template.name.split(" ")[0]}</span
										>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Processing Area / Output -->
					<div class="md:col-span-2 flex flex-col space-y-4">
						<div
							class="flex justify-between items-center text-[10px] text-white/40 uppercase font-black tracking-widest"
						>
							<span>AIVA Output Stream</span>
							<span class="text-green-400/80"
								>Local Redaction Active</span
							>
						</div>
						<div
							id="soap-stream-box"
							class="paper-texture rounded-3xl p-8 min-h-[300px] overflow-y-auto custom-scrollbar flex-grow transition-all duration-500 {isProcessing
								? 'opacity-50'
								: ''}"
						>
							{#if transcript}
								<div
									class="prose prose-sm max-w-none whitespace-pre-wrap"
								>
									{transcript}
								</div>
							{:else if isProcessing}
								<div
									class="flex flex-col items-center justify-center h-full space-y-4"
								>
									<div
										class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
									></div>
									<p class="text-xs italic opacity-40">
										Analyzing clinical context...
									</p>
								</div>
							{:else}
								<div
									class="flex flex-col items-center justify-center h-full opacity-20 text-center px-12"
								>
									<svg
										class="w-12 h-12 mb-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
										/>
									</svg>
									<p class="text-sm font-medium">
										Capture audio to begin analysis
									</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Interaction Area -->
			<div class="grid md:grid-cols-2 gap-8">
				<!-- Raw Record / Mic -->
				<div
					class="glass-panel rounded-[2rem] p-8 flex flex-col items-center justify-center text-center space-y-6"
				>
					<button
						on:click={toggleRecording}
						class="group relative w-28 h-28 flex items-center justify-center transition-all duration-300"
					>
						{#if isRecording}
							<svg
								class="absolute inset-0 w-full h-full transform -rotate-90"
							>
								<circle
									cx="56"
									cy="56"
									r="52"
									stroke="currentColor"
									stroke-width="4"
									fill="transparent"
									class="text-red-500/10"
								/>
								<circle
									cx="56"
									cy="56"
									r="52"
									stroke="currentColor"
									stroke-width="4"
									fill="transparent"
									class="text-red-500 animate-[spin_3s_linear_infinite]"
									stroke-dasharray="326.7"
									stroke-dashoffset="245"
									stroke-linecap="round"
								/>
							</svg>
						{/if}
						<div
							class="absolute inset-2 rounded-full {isRecording
								? 'bg-red-500 animate-pulse'
								: 'bg-blue-500/20'}"
						></div>
						<div
							class="relative w-16 h-16 rounded-full border-4 {isRecording
								? 'border-white/20 bg-red-600'
								: 'border-blue-500 bg-[#2D2D2D]'} flex items-center justify-center shadow-2xl transition-all duration-500"
						>
							{#if isRecording}
								<div class="w-4 h-4 bg-white rounded-sm"></div>
							{:else}
								<svg
									class="w-8 h-8 text-blue-400"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
									/>
								</svg>
							{/if}
						</div>
					</button>
					<div>
						<h4 class="text-lg font-bold">
							{isRecording ? "Listening" : "Start Session"}
						</h4>
						<p class="text-xs text-white/40">
							{isRecording
								? "AIVA is capturing context..."
								: "Push to start recording"}
						</p>
					</div>
				</div>

				<!-- Visual Feedback / Raw Context -->
				<div class="glass-panel rounded-[2rem] p-6 bg-black/40">
					<div class="flex justify-between items-center mb-4">
						<span
							class="text-[10px] font-black text-white/20 uppercase tracking-widest"
							>Raw Acoustic Buffer</span
						>
						{#if isRecording}
							<div class="flex gap-1">
								<div
									class="w-1 h-3 bg-blue-500/50 animate-bounce"
								></div>
								<div
									class="w-1 h-4 bg-blue-500 animate-bounce"
									style="animation-delay: 0.1s"
								></div>
								<div
									class="w-1 h-3 bg-blue-500/50 animate-bounce"
									style="animation-delay: 0.2s"
								></div>
							</div>
						{/if}
					</div>
					<div
						id="raw-stream-box"
						class="h-[120px] overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed text-blue-400/60"
					>
						{rawTranscript || "Waiting for signal..."}
						{#if interimTranscript}
							<span class="opacity-30">{interimTranscript}</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Clinical Workspace -->
			<div
				class="glass-panel rounded-[2.5rem] overflow-hidden flex flex-col min-h-[400px]"
			>
				<div
					class="bg-white/5 px-8 py-4 flex justify-between items-center border-b border-white/5"
				>
					<div class="flex items-center gap-2">
						<div class="w-2 h-2 rounded-full bg-blue-500"></div>
						<span
							class="text-xs font-bold text-white/60 tracking-widest uppercase"
							>Clinical Workspace</span
						>
					</div>
					<div class="flex gap-4">
						<button
							on:click={clearWorkspace}
							class="text-[10px] font-black text-white/20 hover:text-white/60 transition-colors uppercase"
							>Clear</button
						>
						<button
							on:click={copyToClipboard}
							class="text-[10px] font-black text-blue-400/60 hover:text-blue-400 transition-colors uppercase tracking-widest"
							>Copy to Clipboard</button
						>
					</div>
				</div>
				<div class="flex flex-row h-full">
					<textarea
						bind:value={rawTranscript}
						on:input={handleEditorInput}
						class="flex-grow bg-transparent p-10 font-mono text-sm leading-relaxed text-white/80 focus:outline-none resize-none custom-scrollbar"
						placeholder="The clinical story begins here. Type natively or let AIVA structure your consult..."
					></textarea>
					<!-- Smart Reference Sidebar (Integrated) -->
					<div
						class="w-64 border-l border-white/5 p-4 bg-black/20 hidden lg:block"
					>
						<ReferenceSidebar
							transcript={transcript || rawTranscript}
						/>
					</div>
				</div>
			</div>
		</section>
	</main>

	<!-- Project Footer -->
	<footer class="mt-20 mb-12 text-center">
		<p class="text-white/20 text-xs uppercase tracking-[0.2em] font-bold">
			Powered by [Vetnotes.pro]
		</p>
		<p class="mt-2 text-white/10 text-[10px] uppercase tracking-widest">
			Built by <a
				href="https://influential.digital"
				class="hover:text-blue-400 transition-colors"
				>Influential.Digital</a
			>
		</p>
	</footer>
	<AxisPickerModal
		type={activeAxisType || "pathology"}
		isOpen={showAxisPicker}
		on:save={handleAxisSave}
		on:cancel={() => {
			showAxisPicker = false;
			activeAxisType = null;
		}}
	/>
</div>

<style>
	.glass-panel {
		background: rgba(255, 255, 255, 0.02);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.05);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
	}

	/* Paper Texture for SOAP Note */
	.paper-texture {
		background-color: #f8f5f0;
		background-image: radial-gradient(#dcd9d4 0.5px, transparent 0.5px),
			radial-gradient(#dcd9d4 0.5px, #f8f5f0 0.5px);
		background-size: 20px 20px;
		background-position:
			0 0,
			10px 10px;
		color: #2c3e50 !important;
		box-shadow:
			inset 0 0 40px rgba(0, 0, 0, 0.05),
			0 10px 20px rgba(0, 0, 0, 0.2);
		border: none !important;
		position: relative;
	}

	.paper-texture * {
		color: #2c3e50 !important;
	}

	.paper-texture::before {
		content: "";
		position: absolute;
		top: 0;
		right: 0;
		border-width: 0 20px 20px 0;
		border-style: solid;
		border-color: #e5e0d8 #1a1f26;
		display: block;
		width: 0;
	}

	/* Warmer Hearth Status */
	.hearth-glow {
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
		background: radial-gradient(circle, #22c55e 0%, transparent 70%);
	}

	/* Tool Belt Icons */
	.tool-icon {
		width: 32px;
		height: 32px;
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
		image-rendering: auto;
		display: inline-block;
		vertical-align: middle;
	}

	/* Toolbelt mappings */
	.icon-clinic {
		background-image: url("/assets/icon_clinic.png");
	}
	.icon-client {
		background-image: url("/assets/icon_vet.png");
	}
	.icon-money {
		background-image: url("/assets/icon_gold_coin.png");
	}
	.icon-heart {
		background-image: url("/assets/icon_heart.png");
	}
	.icon-kit {
		background-image: url("/assets/icon_medkit.png");
	}
	.icon-calendar {
		background-image: url("/assets/icon_calendar.png");
	}

	.clinic-icon {
		width: 48px;
		height: 48px;
		background-image: url("/assets/icon_clinic.png");
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
		background-color: #111827;
		border-radius: 1rem;
		border: 2px solid #2d2d2d;
	}

	.tool-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.4);
		transition: all 0.2s;
		min-width: 80px;
	}

	.tool-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: white;
		transform: translateY(-2px);
	}

	.tool-btn.active {
		background: rgba(59, 130, 246, 0.15);
		border-color: rgba(59, 130, 246, 0.5) !important;
		color: #60a5fa;
		box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
	}

	.tool-btn .label {
		font-size: 9px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Custom Scrollbar */
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
