<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { confetti } from "@tsparticles/confetti";
    import { playSound, triggerHaptic } from "$lib/utils/sounds";

    const dispatch = createEventDispatcher();

    // Props
    export let userLocation: { lat: number; lng: number } | null = null;
    export let currentLens: "cozy" | "adventure" | "tactical" = "adventure";

    // State
    let isOpen = false;
    let cameraActive = false;
    let videoRef: HTMLVideoElement;
    let canvasRef: HTMLCanvasElement;
    let isSubmitting = false;
    let result: any = null;
    let screenShake = false;
    let showBragCard = false;

    // Viral Threasholds
    const THREATS = [
        {
            id: "demon_ant",
            name: "The Crawling Scourge",
            type: "invasive_pest",
            icon: "🔥",
            severity: "CRITICAL",
            credits: 1000,
            xp: 2500,
            lore: "A deep earth tremor precedes the Red Demon's arrival. Smithfield is under watch.",
        },
        {
            id: "earth_scar",
            name: "Lurking Fissure",
            type: "infrastructure_fault",
            icon: "🕳️",
            severity: "HIGH",
            credits: 500,
            xp: 1200,
            lore: "The earth itself bleeds golden light here. A scar that needs a guardian's touch.",
        },
        {
            id: "sentinel_fly",
            name: "Dragon Eye",
            type: "wildlife_sighting",
            icon: "🐉",
            severity: "MEDIUM",
            credits: 250,
            xp: 800,
            lore: "Ancient wings shadow the valley. The Sentinel's gaze is upon you.",
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

    async function instantScan() {
        if (isSubmitting) return;
        isSubmitting = true;

        // 1. Visceral Trigger: Pulse
        playSound("scan");
        triggerHaptic("light");

        // 2. Magical Delay (AI "Thinking")
        await new Promise((r) => setTimeout(r, 1200));

        // 3. The Big Reveal
        const discovery = THREATS[Math.floor(Math.random() * THREATS.length)];
        result = {
            ...discovery,
            id: `SENT-<line_number>-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            locationName: "Edmonton (Sector 7)",
        };

        isSubmitting = false;

        if (result.severity === "CRITICAL" || result.severity === "HIGH") {
            screenShake = true;
            playSound("success_high");
            triggerHaptic("heavy");
            setTimeout(() => (screenShake = false), 500);
        } else {
            playSound("success_low");
            triggerHaptic("light");
        }

        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ["#fbbf24", "#f472b6", "#38bdf8"],
        });

        setTimeout(() => (showBragCard = true), 400);
        dispatch("submit", result);
    }

    function shareToSocial() {
        const text = `I just uncovered ${result.name} in Edmonton! Rank 3 Sentinel now. 🌍 #PlanetaryDefender #ValleyVet`;
        if (navigator.share) {
            navigator.share({
                title: "Valley Vet Discovery",
                text: text,
                url: window.location.href,
            });
        } else {
            alert("Share Card copied! Post to TikTok with #PlanetaryDefender");
        }
    }

    function close() {
        isOpen = false;
        result = null;
        cameraActive = false;
        showBragCard = false;
    }

    function open() {
        isOpen = true;
        startCamera();
    }
</script>

<!-- Simplified "Magic Button" FAB -->
{#if !isOpen}
    <button class="magic-fab" on:click={open} transition:scale>
        <div class="pulse-ring"></div>
        <span class="icon">🔍</span>
        <span class="label">SCAN WORLD</span>
    </button>
{/if}

{#if isOpen}
    <div class="lite-overlay" transition:fade class:shake={screenShake}>
        <div class="lite-modal" in:fly={{ y: 200, duration: 400 }}>
            {#if !result}
                <header class="lite-header">
                    <div class="lens-tag">
                        {currentLens.toUpperCase()} LENS ACTIVE
                    </div>
                    <button class="close-x" on:click={close}>✕</button>
                </header>

                <div class="viewfinder-wrapper">
                    <video
                        bind:this={videoRef}
                        autoplay
                        playsinline
                        class="viewfinder"
                    ></video>
                    <div class="aim-reticle">
                        <div class="corner tl"></div>
                        <div class="corner tr"></div>
                        <div class="corner bl"></div>
                        <div class="corner br"></div>
                    </div>
                </div>

                <button
                    class="scan-trigger"
                    on:click={instantScan}
                    disabled={isSubmitting}
                >
                    {#if isSubmitting}
                        <div class="dna-spinner"></div>
                        <span>IDENTIFYING...</span>
                    {:else}
                        <span>SNAP TO REPORT</span>
                    {/if}
                </button>
            {:else}
                <!-- THE EPIC REVEAL -->
                <div
                    class="reveal-container"
                    in:scale={{ duration: 600, start: 0.5 }}
                >
                    <div class="reward-splash">
                        <span class="plus">+{result.credits}</span>
                        <span class="unit">BIO-CREDITS</span>
                    </div>

                    {#if showBragCard}
                        <div class="brag-card" in:fly={{ y: 40, delay: 200 }}>
                            <div
                                class="card-glow"
                                style="background: {result.severity ===
                                'CRITICAL'
                                    ? '#f472b6'
                                    : '#fbbf24'}"
                            ></div>
                            <header>
                                <div class="rank-badge">SENTINEL RANK 3</div>
                                <h2>{result.icon} {result.name}</h2>
                                <p>{result.locationName}</p>
                            </header>

                            <div class="lore-box">
                                <p>"{result.lore}"</p>
                            </div>

                            <div class="card-footer">
                                <div class="stat">
                                    <span>XP</span><strong>+{result.xp}</strong>
                                </div>
                                <div class="stat">
                                    <span>TRUST</span><strong>+15%</strong>
                                </div>
                            </div>
                        </div>

                        <div class="action-footer" in:fade={{ delay: 600 }}>
                            <button class="share-btn" on:click={shareToSocial}>
                                🚀 SHARE TO TIKTOK
                            </button>
                            <button class="continue-btn" on:click={close}
                                >SCAN ANOTHER</button
                            >
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .magic-fab {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #fbbf24 0%, #f472b6 100%);
        border: 4px solid white;
        padding: 1.2rem 3rem;
        border-radius: 60px;
        color: white;
        display: flex;
        align-items: center;
        gap: 1rem;
        font-weight: 950;
        font-size: 1.4rem;
        box-shadow: 0 15px 40px rgba(244, 114, 182, 0.4);
        cursor: pointer;
        z-index: 2500;
        letter-spacing: 0.05em;
    }

    .pulse-ring {
        position: absolute;
        inset: -10px;
        border: 2px solid #f472b6;
        border-radius: 60px;
        animation: pulse 2s infinite;
        opacity: 0;
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
            transform: scale(1.2);
            opacity: 0;
        }
    }

    .lite-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.92);
        display: flex;
        align-items: flex-end;
        z-index: 3000;
        backdrop-filter: blur(5px);
    }

    .lite-modal {
        width: 100%;
        background: #000;
        border-radius: 40px 40px 0 0;
        padding: 2rem;
        color: white;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .lite-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .lens-tag {
        font-size: 0.7rem;
        font-weight: 900;
        letter-spacing: 0.2em;
        color: #38bdf8;
    }

    .viewfinder-wrapper {
        position: relative;
        aspect-ratio: 4/5;
        background: #111;
        border-radius: 30px;
        overflow: hidden;
        margin-bottom: 2rem;
    }

    .viewfinder {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .aim-reticle {
        position: absolute;
        inset: 60px;
        pointer-events: none;
    }

    .corner {
        position: absolute;
        width: 30px;
        height: 30px;
        border: 4px solid rgba(255, 255, 255, 0.4);
    }
    .tl {
        top: 0;
        left: 0;
        border_right: none;
        border_bottom: none;
    }
    .tr {
        top: 0;
        right: 0;
        border_left: none;
        border_bottom: none;
    }
    .bl {
        bottom: 0;
        left: 0;
        border_top: none;
        border_right: none;
    }
    .br {
        bottom: 0;
        right: 0;
        border_top: none;
        border_left: none;
    }

    .scan-trigger {
        width: 100%;
        padding: 1.5rem;
        background: white;
        color: black;
        border: none;
        border-radius: 20px;
        font-weight: 900;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    /* Result Screen */
    .reveal-container {
        padding: 2rem 0;
        text-align: center;
    }

    .reward-splash {
        margin-bottom: 3rem;
    }

    .plus {
        display: block;
        font-size: 6rem;
        font-weight: 950;
        line-height: 1;
        background: linear-gradient(180deg, #fbbf24, #f59e0b);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .unit {
        font-weight: 900;
        letter-spacing: 0.3em;
        color: #fbbf24;
        font-size: 1rem;
    }

    .brag-card {
        background: #111;
        border-radius: 30px;
        padding: 2rem;
        text-align: left;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 2.5rem;
    }

    .card-glow {
        position: absolute;
        top: -50px;
        right: -50px;
        width: 150px;
        height: 150px;
        filter: blur(60px);
        opacity: 0.4;
    }

    .rank-badge {
        font-size: 0.6rem;
        font-weight: 900;
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.1);
        padding: 0.4rem 0.8rem;
        border-radius: 50px;
        display: inline-block;
        margin-bottom: 1rem;
    }

    h2 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 900;
    }
    p {
        margin: 0.5rem 0 0;
        opacity: 0.5;
        font-size: 0.9rem;
    }

    .lore-box {
        background: rgba(255, 255, 255, 0.05);
        padding: 1rem;
        border-radius: 15px;
        margin: 1.5rem 0;
    }

    .lore-box p {
        font-style: italic;
        opacity: 0.9;
        font-size: 0.85rem;
        line-height: 1.5;
    }

    .card-footer {
        display: flex;
        gap: 2rem;
    }

    .stat {
        display: flex;
        flex-direction: column;
    }
    .stat span {
        font-size: 0.6rem;
        font-weight: 800;
        opacity: 0.4;
    }
    .stat strong {
        font-size: 1.1rem;
        color: #fbbf24;
    }

    .action-footer {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .share-btn {
        background: #fbbf24;
        color: black;
        border: none;
        padding: 1.5rem;
        border-radius: 20px;
        font-weight: 950;
        font-size: 1.1rem;
        cursor: pointer;
    }

    .continue-btn {
        background: transparent;
        color: rgba(255, 255, 255, 0.4);
        border: none;
        font-weight: 700;
        cursor: pointer;
    }

    .shake {
        animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    @keyframes shake {
        10%,
        90% {
            transform: translate3d(-1px, 0, 0);
        }
        20%,
        80% {
            transform: translate3d(2px, 0, 0);
        }
        30%,
        50%,
        70% {
            transform: translate3d(-4px, 0, 0);
        }
        40%,
        60% {
            transform: translate3d(4px, 0, 0);
        }
    }

    .close-x {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        cursor: pointer;
    }
</style>
