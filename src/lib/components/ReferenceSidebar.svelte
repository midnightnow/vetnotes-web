<script lang="ts">
    import { parseWeightFromText, toKg } from "$lib/utils/weightParser";
    import ReferenceCard from "./ReferenceCard.svelte";

    export let transcript: string = "";

    // State
    let patientWeight: number = 0;
    let species: "canine" | "feline" = "canine";
    let studyMode: boolean = false;
    let isWeightLocked: boolean = false;
    let lastWeightUpdate: number = 0;
    let weightDetectedFrom: { value: number; unit: string } | null = null;
    let shouldNudge: boolean = false;

    // --- EMERGENCY & TOXIN ---
    const REFERENCE_DB = [
        {
            id: "choc_tox",
            triggers: [/chocolate/i, /cocoa/i, /theobromine/i, /brownie/i],
            title: "Chocolate Toxicity",
            type: "alert",
            species: ["canine"],
            content: {
                "Toxic Dose": ">20 mg/kg",
                Signs: "Vomiting, Tachycardia, Seizures",
                Action: "Induce emesis if <2h",
            },
            actionLabel: "Calc Dose",
        },
        {
            id: "lily_tox",
            triggers: [/lily/i, /lilies/i, /daylily/i, /easter lily/i],
            title: "Lily Toxicity (Lilium spp)",
            type: "alert",
            species: ["feline"],
            content: {
                Danger: "ALL parts of plant are toxic",
                Signs: "Acute Kidney Injury (AKI), Anorexia",
                Action: "Aggressive IV Fluids (48h+), Decontamination",
            },
            actionLabel: "Fluid Protocol",
        },
        {
            id: "xylitol_tox",
            triggers: [/xylitol/i, /gum/i, /sugar-free/i, /birch sugar/i],
            title: "Xylitol Toxicity",
            type: "alert",
            species: ["canine"],
            content: {
                Dose: ">0.1g/kg (Hypoglycemia), >0.5g/kg (Liver)",
                Signs: "Collapse, Vomiting, Seizures",
                Action: "Check BG, Dextrose IV, Liver protectants",
            },
            actionLabel: "Check BG",
        },
        {
            id: "cpr_canine",
            triggers: [/cpr/i, /cardiac arrest/i, /code red/i, /flatline/i],
            title: "CPR Protocol (Canine)",
            type: "alert",
            species: ["canine"],
            content: {
                "Chest Comp": "100-120 bpm, 1/3 - 1/2 chest width",
                Breaths: "10 breaths/min (1 every 6 sec)",
                Epinephrine: "0.01 mg/kg IV q3-5min",
            },
            calc: {
                dose: 0.01,
                unit: "mg",
                liquidUnit: "mL",
                concentration: 1.0,
            },
            actionLabel: "Start Timer",
        },
        {
            id: "cpr_feline",
            triggers: [/cpr/i, /cardiac arrest/i, /flatline/i],
            title: "CPR Protocol (Feline)",
            type: "alert",
            species: ["feline"],
            content: {
                Technique: "One-handed circumferential chest compressions",
                Rate: "100-120 bpm",
                Epinephrine: "0.01 mg/kg IV/IO",
            },
            calc: {
                dose: 0.01,
                unit: "mg",
                liquidUnit: "mL",
                concentration: 1.0,
            },
            actionLabel: "Start Timer",
        },
        {
            id: "seizure_emergency",
            triggers: [
                /seizure/i,
                /convulsing/i,
                /status epilepticus/i,
                /fitting/i,
            ],
            title: "Seizure Emergency",
            type: "alert",
            content: {
                Midazolam: "0.2 mg/kg IV/IM/IN",
                Diazepam: "0.5-1.0 mg/kg IV/PR",
            },
            calc: {
                dose: 0.2,
                unit: "mg",
                liquidUnit: "mL",
                concentration: 5.0,
            }, // Midazolam 5mg/ml
            actionLabel: "Log Time",
        },
        {
            id: "propofol_induction",
            triggers: [/propofol/i, /induction/i, /intubate/i],
            title: "Propofol Induction",
            type: "drug",
            content: {
                Dose: "4-6 mg/kg IV to effect (titrate)",
                "With Pre-med": "Reduce to 2-4 mg/kg",
            },
            calc: {
                dose: 4,
                unit: "mg",
                liquidUnit: "mL",
                concentration: 10.0,
            }, // Propofol 10mg/ml
            actionLabel: "Log Mg",
        },
    ];

    let activeCards: any[] = [];
    let debounceTimer: any;

    // Reactive Matcher
    $: {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            processTranscript(transcript);
        }, 300);
    }

    function processTranscript(text: string) {
        if (!text) {
            activeCards = [];
            return;
        }

        const lowerText = text.toLowerCase();

        // 1. Detect Weight (Zero-Latency Hardware Bridge)
        const weightMatch = parseWeightFromText(text);
        if (weightMatch && weightMatch.confidence >= 0.7) {
            if (isWeightLocked) {
                shouldNudge = true;
                setTimeout(() => (shouldNudge = false), 200);
            } else {
                patientWeight = toKg(weightMatch.value, weightMatch.unit);
                lastWeightUpdate = Date.now();
                weightDetectedFrom =
                    weightMatch.unit === "lb"
                        ? { value: weightMatch.value, unit: "lb" }
                        : null;
            }
        }

        // 2. Detect Species
        if (lowerText.includes("cat") || lowerText.includes("feline")) {
            species = "feline";
        } else if (lowerText.includes("dog") || lowerText.includes("canine")) {
            species = "canine";
        }

        // 3. Match Cards
        const matches = REFERENCE_DB.filter((card) => {
            if (card.species && !card.species.includes(species)) return false;
            return card.triggers.some((regex) => regex.test(lowerText));
        });
        activeCards = matches.slice(0, 5);
    }
    function clearWeight() {
        patientWeight = 0;
        isWeightLocked = false;
        weightDetectedFrom = null;
    }
</script>

<div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4 px-2">
        <div class="flex items-center gap-2">
            <div
                class="w-1.5 h-1.5 rounded-full {transcript
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-white/20'}"
            ></div>
            <h3
                class="text-[10px] font-black uppercase tracking-widest text-white/60"
            >
                AIVA Context
            </h3>
        </div>

        <div class="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
            <button
                class="px-2 py-0.5 rounded text-[8px] font-black uppercase {species ===
                'canine'
                    ? 'bg-blue-600'
                    : 'text-white/40'}"
                on:click={() => (species = "canine")}>Canine</button
            >
            <button
                class="px-2 py-0.5 rounded text-[8px] font-black uppercase {species ===
                'feline'
                    ? 'bg-purple-600'
                    : 'text-white/40'}"
                on:click={() => (species = "feline")}>Feline</button
            >
        </div>
    </div>

    <div class="px-2 mb-4 space-y-2">
        <button
            class="w-full flex justify-between items-center px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-tight {studyMode
                ? 'text-purple-400 border-purple-500/30'
                : 'text-white/40'}"
            on:click={() => (studyMode = !studyMode)}
        >
            <span>Study Mode</span>
            <span class={studyMode ? "text-purple-400" : ""}
                >{studyMode ? "ON" : "OFF"}</span
            >
        </button>

        <!-- Weight Input (Hardware Linked) -->
        <div class="relative group {shouldNudge ? 'animate-nudge' : ''}">
            <label
                class="flex items-center bg-black/40 border {isWeightLocked
                    ? 'border-blue-500/50'
                    : 'border-white/10'} rounded-xl px-4 py-2 gap-3 transition-all"
            >
                <div class="flex flex-col flex-1">
                    <span
                        class="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1"
                        >Weight</span
                    >
                    <input
                        type="number"
                        bind:value={patientWeight}
                        step="0.1"
                        on:input={() => {
                            isWeightLocked = true;
                            weightDetectedFrom = null;
                        }}
                        class="bg-transparent border-none text-white font-mono font-bold w-full focus:outline-none text-lg leading-none"
                    />
                </div>

                {#if weightDetectedFrom && !isWeightLocked}
                    <span
                        class="text-[8px] font-bold text-blue-400/60 uppercase whitespace-nowrap"
                        >{weightDetectedFrom.value}{weightDetectedFrom.unit}</span
                    >
                {/if}

                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-white/20">KG</span>
                    <button
                        on:click={() => (isWeightLocked = !isWeightLocked)}
                        on:mousedown={() => {
                            let timer = setTimeout(clearWeight, 500); // Tighter 500ms long press
                            window.addEventListener(
                                "mouseup",
                                () => clearTimeout(timer),
                                { once: true },
                            );
                        }}
                        class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <span class="text-sm"
                            >{isWeightLocked ? "🔒" : "🔓"}</span
                        >
                    </button>
                </div>
            </label>
        </div>
    </div>

    <div class="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {#if activeCards.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 opacity-20 text-center grayscale"
            >
                <span class="text-4xl mb-4">🩺</span>
                <p class="text-[10px] uppercase font-black tracking-widest">
                    Listening...
                </p>
            </div>
        {:else}
            {#each activeCards as card (card.id)}
                <div
                    class="animate-in slide-in-from-right-2 fade-in duration-300"
                >
                    <ReferenceCard
                        title={card.title}
                        type={card.type}
                        content={card.content}
                        actionLabel={card.actionLabel}
                        weight={patientWeight}
                        calc={card.calc || null}
                        {studyMode}
                        onAction={() => console.log("Card action:", card.id)}
                    />
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }
</style>
