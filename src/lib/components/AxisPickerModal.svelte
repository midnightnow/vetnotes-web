<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { AxisType } from "../services/ShorthandEngine";

    export let type: AxisType;
    export let isOpen = false;

    const dispatch = createEventDispatcher();

    let data: Record<string, string> = {};

    function handleSave() {
        dispatch("save", data);
        reset();
    }

    function handleCancel() {
        dispatch("cancel");
        reset();
    }

    function reset() {
        data = {};
        isOpen = false;
    }

    // Axis definitions for UI rendering
    const axisConfigs: Record<string, { label: string; options: string[] }[]> =
        {
            lesion_description: [
                {
                    label: "Morphology",
                    options: [
                        "Macule",
                        "Papule",
                        "Pustule",
                        "Nodule",
                        "Patch",
                        "Plaque",
                        "Vesicle",
                        "Bulla",
                    ],
                },
                {
                    label: "Configuration",
                    options: [
                        "Linear",
                        "Annular",
                        "Discoid",
                        "Target",
                        "Serpiginous",
                        "Grouped",
                    ],
                },
                {
                    label: "Distribution",
                    options: [
                        "Symmetrical",
                        "Generalized",
                        "Focal",
                        "Multifocal",
                        "Patchy",
                    ],
                },
                {
                    label: "Evolution",
                    options: [
                        "Primary",
                        "Secondary (Crust)",
                        "Secondary (Scale)",
                        "Secondary (Alopecia)",
                    ],
                },
            ],
            pathology: [
                {
                    label: "Method",
                    options: [
                        "FNA",
                        "Punch Biopsy",
                        "Incisional",
                        "Excisional",
                        "Tru-cut",
                    ],
                },
                {
                    label: "Fixative",
                    options: ["10% NBF", "Formalin", "Michels Solution"],
                },
                {
                    label: "Site",
                    options: [
                        "Skin",
                        "Internal Mass",
                        "Lymph Node",
                        "Visceral Organ",
                    ],
                },
            ],
            toxicology: [
                {
                    label: "Route",
                    options: ["Ingestion", "Topical", "Inhalation", "Ocular"],
                },
                {
                    label: "Evidence",
                    options: [
                        "Visual Confirmed",
                        "Suspected",
                        "Clinical Signs Only",
                    ],
                },
                {
                    label: "Status",
                    options: ["Stable", "Critical", "Decontamination Complete"],
                },
            ],
            billing: [
                {
                    label: "Category",
                    options: [
                        "Consultation",
                        "Diagnostic",
                        "Medication",
                        "Procedure",
                        "Lab Work",
                    ],
                },
                {
                    label: "Stock",
                    options: ["In-Stock", "Dispensed", "Ordered"],
                },
                {
                    label: "Code",
                    options: ["CONS-1", "DIAG-XR", "PROC-SURG", "MED-GEN"],
                },
            ],
        };

    $: currentConfig = axisConfigs[type] || [];
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
        <div
            class="bg-[#1A1A1A] border-2 border-[#2D2D2D] rounded-[2rem] shadow-2xl p-10 w-full max-w-xl animate-in fade-in zoom-in duration-200"
        >
            <div class="flex items-center gap-4 mb-8">
                <div
                    class="w-12 h-12 bg-[#2D2D2D] rounded-lg border-2 border-[#4A4A4A] flex items-center justify-center shadow-inner overflow-hidden"
                >
                    {#if type === "billing"}
                        <svg
                            class="w-7 h-7 text-amber-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    {:else if type === "pathology"}
                        <svg
                            class="w-7 h-7 text-rose-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.618.309a6 6 0 01-3.86.517l-2.387-.477a2 2 0 00-1.022.547l-1.16 1.16a2 2 0 000 2.828l1.16 1.16a2 2 0 002.828 0l1.16-1.16a2 2 0 000-2.828l-1.16-1.16zm-4.787-7.697a4 4 0 11-5.656 5.656 4 4 0 015.656-5.656z"
                            />
                        </svg>
                    {:else if type === "toxicology"}
                        <svg
                            class="w-7 h-7 text-emerald-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.618.309a6 6 0 01-3.86.517l-2.387-.477a2 2 0 00-1.022.547l-1.16 1.16a2 2 0 000 2.828l1.16 1.16a2 2 0 002.828 0l1.16-1.16a2 2 0 000-2.828l-1.16-1.16z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12l2 2 4-4"
                            />
                        </svg>
                    {:else}
                        <svg
                            class="w-7 h-7 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    {/if}
                </div>
                <div>
                    <h3 class="text-xl font-bold text-white/90">
                        {type.replace("_", " ").toUpperCase()}
                    </h3>
                    <p
                        class="text-[10px] text-white/40 font-mono tracking-widest uppercase"
                    >
                        Structured Data Axis
                    </p>
                </div>
            </div>

            <div
                class="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar"
            >
                {#each currentConfig as field}
                    <div class="space-y-4">
                        <label
                            class="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]"
                            >{field.label}</label
                        >
                        <div class="flex flex-wrap gap-2">
                            {#each field.options as option}
                                <button
                                    class="px-4 py-2 text-xs rounded-xl border transition-all {data[
                                        field.label.toLowerCase()
                                    ] === option
                                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                        : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.05]'}"
                                    on:click={() =>
                                        (data[field.label.toLowerCase()] =
                                            option)}
                                >
                                    {option}
                                </button>
                            {/each}
                        </div>
                    </div>
                {/each}

                <div class="space-y-4 pt-4 border-t border-white/5">
                    <label
                        class="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]"
                        >Clinical Observations</label
                    >
                    <textarea
                        bind:value={data["notes"]}
                        class="w-full bg-black/20 border-2 border-white/5 rounded-[1.5rem] p-6 text-white text-sm focus:outline-none focus:border-blue-500/50 outline-none h-32 resize-none placeholder-white/10"
                        placeholder="Type any additional context here..."
                    ></textarea>
                </div>
            </div>

            <div class="mt-10 flex justify-end items-center gap-6">
                <button
                    on:click={handleCancel}
                    class="text-xs font-bold text-white/20 hover:text-white/60 uppercase tracking-widest transition-colors"
                >
                    Discard Changes
                </button>
                <button
                    on:click={handleSave}
                    class="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/40 transition-all active:scale-95 text-sm"
                >
                    Anchor Axis
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 10px;
    }
</style>
