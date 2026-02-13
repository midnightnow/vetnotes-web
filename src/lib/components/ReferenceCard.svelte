<script lang="ts">
    export let title: string;
    export let type: "drug" | "protocol" | "alert" | "info" = "info";
    export let content: Record<string, string> | string; // Key-value pairs or raw text
    export let actionLabel: string = "";
    export let onAction: () => void = () => {};

    // Calculator Props
    export let weight: number = 0;
    export let calc: {
        dose: number;
        unit: string;
        concentration?: number;
        liquidUnit?: string;
    } | null = null;
    export let studyMode: boolean = false;

    // Local State
    let revealed: boolean = false;
    let copySuccess: boolean = false;

    // Reset revealed state if title or weight changes
    $: {
        if (title || weight) {
            revealed = false;
        }
    }

    // Calculation Logic
    $: totalDose = weight > 0 && calc ? weight * calc.dose : 0;
    $: totalVolume =
        totalDose > 0 && calc?.concentration
            ? totalDose / calc.concentration
            : 0;

    $: resultString =
        totalVolume > 0
            ? `${totalVolume.toFixed(2)} ${calc?.liquidUnit || "mL"} (${totalDose.toFixed(1)} ${calc?.unit})`
            : totalDose > 0
              ? `${totalDose.toFixed(1)} ${calc?.unit}`
              : "";

    function copyResult() {
        if (!resultString) return;

        let clinicalString = `> ${title}: ${resultString}`;
        if (calc) {
            clinicalString += ` (${calc.dose}${calc.unit}/kg)`;
        }
        clinicalString += ` administered. No adverse events noted.`;

        navigator.clipboard.writeText(clinicalString);

        copySuccess = true;
        setTimeout(() => {
            copySuccess = false;
        }, 2000);
    }

    const typeConfig = {
        drug: {
            icon: "💊",
            color: "border-blue-500/50 bg-blue-500/10",
            textColor: "text-blue-300",
        },
        protocol: {
            icon: "📋",
            color: "border-green-500/50 bg-green-500/10",
            textColor: "text-green-300",
        },
        alert: {
            icon: "🚨",
            color: "border-red-500/50 bg-red-500/10",
            textColor: "text-red-300",
        },
        info: {
            icon: "ℹ️",
            color: "border-white/10 bg-white/5",
            textColor: "text-white/60",
        },
    };

    $: config = typeConfig[type];
</script>

<div
    class="glass-panel w-full p-4 rounded-2xl border {config.color} mb-3 transition-all hover:scale-[1.02]"
>
    <div class="flex justify-between items-start mb-2">
        <div class="flex items-center gap-2">
            <span class="text-xl">{config.icon}</span>
            <h4 class="font-bold text-sm uppercase tracking-wider text-white">
                {title}
            </h4>
        </div>
        <div class="flex gap-2">
            {#if resultString}
                <button
                    on:click={copyResult}
                    class="text-[10px] font-bold uppercase transition-all px-3 py-1 rounded-lg {copySuccess
                        ? 'bg-green-500 text-white'
                        : 'text-white/80 border border-white/20 hover:bg-white/10'}"
                    title="Copy Result"
                >
                    {copySuccess ? "✓ Copied" : "Copy"}
                </button>
            {/if}
            {#if actionLabel}
                <button
                    on:click={onAction}
                    class="text-[10px] font-bold uppercase {config.textColor} border border-current px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                    {actionLabel}
                </button>
            {/if}
        </div>
    </div>

    <div class="text-xs space-y-1">
        {#if typeof content === "string"}
            <p class="opacity-80 leading-relaxed whitespace-pre-line">
                {content}
            </p>
        {:else}
            <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {#each Object.entries(content) as [key, value]}
                    <span
                        class="opacity-50 font-mono uppercase text-[10px] text-right"
                        >{key}:</span
                    >
                    <span class="font-medium text-white/90">{value}</span>
                {/each}
            </div>
        {/if}
    </div>

    {#if calc && weight > 0}
        <div class="mt-3 pt-2 border-t border-white/10">
            <div class="flex justify-between items-center text-xs">
                <span class="uppercase font-bold opacity-60"
                    >Result ({weight}kg)</span
                >

                {#if studyMode && !revealed}
                    <button
                        class="bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                        on:click={() => (revealed = true)}
                    >
                        Reveal Answer
                    </button>
                {:else}
                    <span
                        class="font-mono text-lg font-bold {config.textColor} {studyMode
                            ? 'animate-in zoom-in-95 fade-in duration-300'
                            : ''}">{resultString}</span
                    >
                {/if}
            </div>

            {#if !studyMode || revealed}
                {#if calc.concentration}
                    <p
                        class="text-[9px] text-right opacity-40 font-mono {studyMode
                            ? 'animate-in fade-in slide-in-from-top-1 duration-500'
                            : ''}"
                    >
                        {calc.dose}{calc.unit}/kg @ {calc.concentration}{calc.unit}/{calc.liquidUnit ||
                            "mL"}
                    </p>
                {/if}
            {/if}
        </div>
    {/if}
</div>

<style>
    .glass-panel {
        backdrop-filter: blur(12px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
</style>
