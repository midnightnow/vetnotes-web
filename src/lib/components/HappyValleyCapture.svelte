<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { confetti } from "@tsparticles/confetti";
    import { playSound, triggerHaptic } from "$lib/utils/sounds";
    import { generateBragCard, shareToTikTok } from "$lib/utils/brag";

    const dispatch = createEventDispatcher();

    // State
    let videoRef: HTMLVideoElement;
    let isScanning = false;
    let result: any = null;
    let cameraActive = false;

    // Hardcoded "Magic" Threats for the 10-second hook
    const MAGIC_FINDS = [
        {
            name: "Red Imported Fire Ant",
            image: "/assets/icon_fire_ant_pro.png",
            credits: 500,
            suburb: "Smithfield",
            rarity: "LEGENDARY",
            description: "Invasive super-colony scout detected.",
        },
        {
            name: "Lurking Drake (Croc)",
            image: "/assets/pet_dragon_pro.png",
            credits: 300,
            suburb: "Smithfield",
            rarity: "RARE",
            description: "Apex predator entering residential zone.",
        },
        {
            name: "The Earth Scar",
            image: "/assets/icon_gem_pro.png",
            credits: 250,
            suburb: "Smithfield",
            rarity: "UNCOMMON",
            description: "Geological anomaly emitting faint radiation.",
        },
    ];

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });
            if (videoRef) {
                videoRef.srcObject = stream;
                cameraActive = true;
            }
        } catch (e) {
            console.error("Camera fail:", e);
        }
    }

    async function triggerWonder() {
        if (isScanning) return;
        isScanning = true;
        playSound("scan");
        triggerHaptic("light");

        // The "Magic" delay (AI processing)
        await new Promise((r) => setTimeout(r, 1500));

        // Random epic find
        result = MAGIC_FINDS[Math.floor(Math.random() * MAGIC_FINDS.length)];

        isScanning = false;
        playSound("success_high");
        triggerHaptic("heavy");

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#fbbf24", "#f472b6", "#38bdf8"],
        });

        dispatch("discovery", result);
    }

    async function handleShare() {
        const uri = await generateBragCard({
            species: result.name,
            credits: result.credits,
            suburb: result.suburb,
            rank: "Sentinel Rank 1",
            template: "Space-to-Backyard-Zoom",
            lore: `The ${result.name} has been sighted in ${result.suburb}. The shield holds.`,
        });
        await shareToTikTok(uri, {
            species: result.name,
            credits: result.credits,
            suburb: result.suburb,
            rank: "Sentinel Rank 1",
            template: "Space-to-Backyard-Zoom",
            lore: `The ${result.name} has been sighted in ${result.suburb}. The shield holds.`,
        });
    }

    function reset() {
        result = null;
        isScanning = false;
    }

    onMount(() => {
        startCamera();
    });
</script>

<div class="happy-valley-capture" transition:fade>
    <!-- Viewfinder -->
    <div class="camera-wrapper">
        <video bind:this={videoRef} autoplay playsinline class="viewfinder"
        ></video>
        <div class="vignette"></div>
        <div class="scan-lines"></div>

        {#if !result}
            <div class="overlay-magic" in:fade>
                <div class="reticle">
                    <div class="corner tl"></div>
                    <div class="corner tr"></div>
                    <div class="corner bl"></div>
                    <div class="corner br"></div>
                    <div class="center-dot"></div>
                </div>
                <div class="hud-top">
                    <div class="hud-badge">REC ●</div>
                    <div class="hud-badge">SENTINEL MODE</div>
                </div>
                <div class="hint-text">SCANNING FOR BIO-THREATS</div>
            </div>
        {/if}
    </div>

    <!-- UI Overlay -->
    <div class="ui-layer">
        {#if !result}
            <button
                class="magic-button"
                on:click={triggerWonder}
                disabled={isScanning}
            >
                {#if isScanning}
                    <div class="dna-spin"></div>
                    <span>ANALYZING...</span>
                {:else}
                    <img
                        src="/assets/icon_magic_pro.png"
                        class="w-8 h-8 pixelated"
                        alt="Magic"
                    />
                    <span>IDENTIFY TARGET</span>
                {/if}
            </button>
        {:else}
            <div
                class="reward-overlay glass-panel"
                in:scale={{ duration: 400, start: 0.5 }}
            >
                <div class="reward-content">
                    <span class="rarity {result.rarity.toLowerCase()}"
                        >{result.rarity} DISCOVERY</span
                    >
                    <div class="reward-image-container">
                        <div class="glow-bg"></div>
                        <img
                            src={result.image}
                            alt={result.name}
                            class="reward-image pixelated"
                        />
                    </div>
                    <h2>{result.name}</h2>
                    <p class="desc">{result.description}</p>
                    <div class="credits">+{result.credits} BIO-CREDITS</div>
                    <p class="tagline">You just protected {result.suburb}!</p>
                </div>

                <div class="action-grid">
                    <button class="share-btn" on:click={handleShare}
                        >📸 SHARE REPORT</button
                    >
                    <button class="reset-btn" on:click={reset}
                        >CONTINUE PATROL</button
                    >
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .happy-valley-capture {
        position: fixed;
        inset: 0;
        background: black;
        z-index: 1000;
        display: flex;
        flex-direction: column;
    }

    .camera-wrapper {
        position: relative;
        flex: 1;
        overflow: hidden;
    }

    .viewfinder {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            circle,
            transparent 50%,
            rgba(0, 0, 0, 0.8)
        );
        pointer-events: none;
    }

    .scan-lines {
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.1),
            rgba(0, 0, 0, 0.1) 1px,
            transparent 1px,
            transparent 2px
        );
        pointer-events: none;
        opacity: 0.5;
    }

    .overlay-magic {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }

    .reticle {
        width: 250px;
        height: 250px;
        position: relative;
        animation: breathe 3s infinite ease-in-out;
    }

    @keyframes breathe {
        0%,
        100% {
            transform: scale(1);
            opacity: 0.8;
        }
        50% {
            transform: scale(1.05);
            opacity: 0.5;
        }
    }

    .corner {
        position: absolute;
        width: 20px;
        height: 20px;
        border: 2px solid #38bdf8;
    }
    .tl {
        top: 0;
        left: 0;
        border-right: 0;
        border-bottom: 0;
    }
    .tr {
        top: 0;
        right: 0;
        border-left: 0;
        border-bottom: 0;
    }
    .bl {
        bottom: 0;
        left: 0;
        border-right: 0;
        border-top: 0;
    }
    .br {
        bottom: 0;
        right: 0;
        border-left: 0;
        border-top: 0;
    }

    .center-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 4px;
        height: 4px;
        background: #ef4444;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 4px #ef4444;
    }

    .hud-top {
        position: absolute;
        top: 2rem;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        padding: 0 2rem;
    }

    .hud-badge {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.7rem;
        font-weight: 800;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        letter-spacing: 0.1em;
        backdrop-filter: blur(4px);
    }

    .hint-text {
        margin-top: 2rem;
        background: rgba(15, 23, 42, 0.8);
        color: #38bdf8;
        padding: 0.5rem 1.5rem;
        border-radius: 4px;
        font-weight: 800;
        font-size: 0.8rem;
        letter-spacing: 0.1em;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(56, 189, 248, 0.3);
        text-transform: uppercase;
    }

    .ui-layer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 3rem 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 10;
        pointer-events: none;
    }

    .ui-layer > * {
        pointer-events: auto;
    }

    .magic-button {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 1rem 2rem;
        border-radius: 60px;
        color: white;
        font-weight: 800;
        font-size: 1.1rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: transform 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .magic-button:active {
        transform: scale(0.95);
    }

    .reward-overlay {
        background: rgba(15, 23, 42, 0.95);
        width: 100%;
        max-width: 400px;
        border-radius: 32px;
        padding: 2.5rem;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 50px 100px rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(20px);
    }

    .reward-image-container {
        position: relative;
        width: 120px;
        height: 120px;
        margin: 1rem auto;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .glow-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            circle,
            rgba(56, 189, 248, 0.4) 0%,
            transparent 70%
        );
        filter: blur(20px);
    }

    .reward-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        position: relative;
        z-index: 2;
    }

    .pixelated {
        image-rendering: pixelated;
    }

    .rarity {
        font-size: 0.65rem;
        font-weight: 900;
        letter-spacing: 0.2em;
        padding: 0.4rem 1rem;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
    }

    .rarity.legendary {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .rarity.rare {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .rarity.uncommon {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.3);
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 900;
        margin: 0;
        color: white;
    }

    .desc {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
        margin-top: 0.5rem;
    }

    .credits {
        font-size: 2rem;
        font-weight: 800;
        margin: 1.5rem 0;
        color: #38bdf8;
        text-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
    }

    .tagline {
        opacity: 0.4;
        font-size: 0.75rem;
        margin-bottom: 2rem;
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .action-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .share-btn {
        background: #38bdf8;
        color: #0f172a;
        border: none;
        padding: 1.25rem;
        border-radius: 16px;
        font-weight: 800;
        font-size: 0.9rem;
        cursor: pointer;
        letter-spacing: 0.05em;
    }

    .reset-btn {
        background: transparent;
        color: rgba(255, 255, 255, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: 700;
        padding: 1rem;
        border-radius: 16px;
        cursor: pointer;
        font-size: 0.8rem;
    }
    .reset-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: white;
    }

    .dna-spin {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
