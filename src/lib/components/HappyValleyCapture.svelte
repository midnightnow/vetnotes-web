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
            icon: "🔥",
            credits: 500,
            suburb: "Smithfield",
            rarity: "LEGENDARY",
        },
        {
            name: "Lurking Drake (Croc)",
            icon: "🐉",
            credits: 300,
            suburb: "Smithfield",
            rarity: "RARE",
        },
        {
            name: "The Earth Scar",
            icon: "💎",
            credits: 250,
            suburb: "Smithfield",
            rarity: "UNCOMMON",
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

        {#if !result}
            <div class="overlay-magic" in:fade>
                <div class="reticle"></div>
                <div class="hint-text">POINT AT ANYTHING UNUSUAL</div>
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
                    <span>IDENTIFYING...</span>
                {:else}
                    <span class="icon">✨</span>
                    <span>TAP TO PROTECT COUNTRY</span>
                {/if}
            </button>
        {:else}
            <div
                class="reward-overlay"
                in:scale={{ duration: 400, start: 0.5 }}
            >
                <div class="big-confetti">🎉</div>
                <div class="reward-content">
                    <span class="rarity">{result.rarity} DISCOVERY</span>
                    <h2>{result.name} {result.icon}</h2>
                    <div class="credits">+{result.credits} BIO-CREDITS</div>
                    <p class="tagline">You just protected {result.suburb}!</p>
                </div>

                <div class="action-grid">
                    <button class="share-btn" on:click={handleShare}
                        >📸 SHARE TO TIKTOK</button
                    >
                    <button class="reset-btn" on:click={reset}
                        >FIND ANOTHER!</button
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
        border: 2px solid rgba(255, 255, 255, 0.3);
        border_radius: 40px;
        position: relative;
    }

    .reticle::after {
        content: "";
        position: absolute;
        inset: -10px;
        border: 2px solid #fbbf24;
        border_radius: 50px;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 0;
        }
        50% {
            opacity: 0.5;
        }
        100% {
            transform: scale(1.1);
            opacity: 0;
        }
    }

    .hint-text {
        margin-top: 2rem;
        background: rgba(0, 0, 0, 0.6);
        padding: 0.5rem 1.5rem;
        border-radius: 50px;
        font-weight: 800;
        font-size: 0.8rem;
        letter-spacing: 0.1em;
        backdrop-filter: blur(10px);
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
        background: linear-gradient(135deg, #fbbf24 0%, #f472b6 100%);
        border: 4px solid white;
        padding: 1.5rem 3rem;
        border-radius: 60px;
        color: white;
        font-weight: 950;
        font-size: 1.25rem;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: transform 0.2s;
        text-transform: uppercase;
    }

    .magic-button:active {
        transform: scale(0.9);
    }

    .reward-overlay {
        background: #111;
        width: 100%;
        max-width: 400px;
        border-radius: 40px;
        padding: 3rem 2rem;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 50px 100px rgba(0, 0, 0, 0.8);
    }

    .big-confetti {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .rarity {
        font-size: 0.7rem;
        font-weight: 900;
        letter-spacing: 0.2em;
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.1);
        padding: 0.4rem 1rem;
        border-radius: 50px;
        display: inline-block;
        margin-bottom: 1rem;
    }

    h2 {
        font-size: 2rem;
        font-weight: 950;
        margin: 0;
        color: white;
    }

    .credits {
        font-size: 2.5rem;
        font-weight: 950;
        margin: 1.5rem 0;
        background: linear-gradient(to bottom, #fbbf24, #f59e0b);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .tagline {
        opacity: 0.6;
        font-size: 0.9rem;
        margin-bottom: 2.5rem;
        color: white;
    }

    .action-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .share-btn {
        background: #fbbf24;
        color: black;
        border: none;
        padding: 1.25rem;
        border-radius: 20px;
        font-weight: 950;
        font-size: 1.1rem;
        cursor: pointer;
    }

    .reset-btn {
        background: transparent;
        color: #666;
        border: none;
        font-weight: 800;
        padding: 1rem;
        cursor: pointer;
    }

    .dna-spin {
        width: 24px;
        height: 24px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid white;
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
