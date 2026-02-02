<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { RequestQueue } from "$lib/utils/RequestQueue";
    import { ParticlePool, type Particle } from "$lib/utils/ParticlePool";

    export let width = 1000;
    export let height = 700;

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let frame: number;

    const SYMBOLS = ["Δ", "Σ", "π", "e", "φ", "∞", "0", "1", "A", "B", "C"];
    const SACRED_WORDS = [
        "BLUE",
        "FLAME",
        "LIGHT",
        "LIFE",
        "ART",
        "DEPTH",
        "PATH",
        "DELTA",
        "PRISON",
        "PAIN",
        "LOVE",
        "VOID",
        "ECHO",
        "WAVE",
        "PULSE",
        "TIME",
        "MIND",
        "SOUL",
        "GOLD",
        "IRON",
        "SALT",
    ];

    const TRIGRAMS = {
        HEAD: "☰", // Heaven
        TORSO: "☷", // Earth
        R_ARM: "☱", // Lake
        L_ARM: "☲", // Fire
        STAFF: "☴", // Wind
    };

    // Configuration
    const MAX_PARTICLES = parseInt(import.meta.env.VITE_MAX_PARTICLES || "500");
    const DISTORTION_DECAY_RATE = parseFloat(
        import.meta.env.VITE_DISTORTION_DECAY_RATE || "0.01",
    );

    // Managers
    const requestQueue = new RequestQueue();
    const particlePool = new ParticlePool(MAX_PARTICLES);

    interface Settlement {
        amount: string;
        tax: string;
        status: string;
    }

    // State
    let mathmanX = -200;
    let time = 0;
    let lastFrameTime = 0;
    let deltaTime = 0;
    let monkeyCount = 1;
    let sonnetLine = "";

    // Million Monkey Simulation State
    let entropyLevel = 0;
    let matchesFound = 0;

    // Real Economic State (from Python)
    let treasuryReserve = "0.00";
    let inflationRate = 0;
    let distortionLevel = 0;
    let lastSettlement: Settlement | null = null;

    // Sacred Sequences to monitor
    const SACRED_SEQUENCES = [
        "To be or not to be",
        "The void stares back",
        "Geometry weeps",
        "Infinite monkeys typing",
        "Golden ratio soul",
        "Spindle weaves time",
    ];

    onMount(() => {
        ctx = canvas.getContext("2d")!;
        resize();
        window.addEventListener("resize", resize);
        lastFrameTime = performance.now();
        animate();
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", resize);
            particlePool.clear();
        };
    });

    async function triggerEconomy(isSacred: boolean = false) {
        try {
            // Use RequestQueue for deduplication, retry logic, and caching
            const data = await requestQueue.enqueue(isSacred);

            // Update treasury data
            if (data.treasury) {
                treasuryReserve = data.treasury.reserve;
            }

            // Update economic metrics
            if (data.economy) {
                inflationRate = parseFloat(data.economy.inflation_rate);
                // Inflation directly influences visual instability
                distortionLevel = Math.max(distortionLevel, inflationRate * 5);
            }

            // Visual feedback for settlement using ParticlePool
            if (data.settlement) {
                lastSettlement = data.settlement;

                particlePool.acquire({
                    x: width / 2,
                    y: height / 2,
                    vx: 0,
                    vy: -2,
                    text:
                        `+$${data.settlement.tax} TAX` +
                        (isSacred ? " [SACRED]" : ""),
                    life: 2.0,
                    size: isSacred ? 42 : 24,
                    color: isSacred ? "#fbbf24" : "#fff",
                    type: "word",
                    active: true,
                });
            }

            // Sacred sequence effects
            if (isSacred) {
                distortionLevel += 2.0;
            }
        } catch (e) {
            const isTimeout = e instanceof Error && e.name === "AbortError";
            const errorMsg = e instanceof Error ? e.message : "Unknown error";

            console.error("Economy simulation failed:", errorMsg);

            // Show user-facing error using ParticlePool
            particlePool.acquire({
                x: width / 2,
                y: height / 2,
                vx: 0,
                vy: -1,
                text: isTimeout ? "⏱️ TIMEOUT" : "⚠️ SETTLEMENT FAILED",
                life: 3.0,
                size: 32,
                color: "#ef4444",
                type: "word",
                active: true,
            });

            // Add distortion spike to visualize system stress
            distortionLevel += 1.0;
        }
    }

    function resize() {
        if (!canvas) return;
        const container = canvas.parentElement;
        if (container) {
            width = container.clientWidth;
            height = container.clientHeight || 700;
            canvas.width = width;
            canvas.height = height;
        }
    }

    function solveProjection(x: number, y: number, z: number) {
        // 45 degree horizon projection with subtle perspective
        const isoX = x - z;
        const isoY = y + (x + z) * 0.5;
        const scale = 800 / (800 + z * 0.2); // Slower falloff
        return {
            x: width / 2 + isoX * scale,
            y: height / 2 + isoY * scale,
        };
    }

    function drawDemiurge(
        t: number,
        isReflection: boolean = false,
        alpha: number = 1.0,
    ) {
        const basePos = { x: 200, y: 0, z: 100 };
        const reflectionFactor = isReflection ? -1 : 1;

        ctx.save();
        ctx.globalAlpha = alpha;

        const colorBase = isReflection ? "100, 150, 255" : "255, 255, 255";
        ctx.fillStyle = `rgba(${colorBase}, ${isReflection ? 0.4 : 1.0})`;

        // --- SKELETAL RIGGING WITH TRIGRAMS ---

        // Active Distortion Effect (Reflection only - The 'Shadow' Plane)
        let wobbleBase = 0;
        if (isReflection) {
            // Darkside Intensification: Warp based on distortionLevel squared
            const warpFactor = distortionLevel * distortionLevel * 5;
            wobbleBase = Math.sin(t * 10) * warpFactor;

            // Chromatic aberration and blur for high distortion
            if (distortionLevel > 0.5) {
                ctx.shadowBlur = distortionLevel * 20;
                ctx.shadowColor = `rgba(${distortionLevel > 1.5 ? "239, 68, 68" : "59, 130, 246"}, 0.8)`;
                ctx.shadowOffsetX = Math.sin(t * 20) * distortionLevel * 5;
            }
        }

        // Head (Heaven)
        const headPos = solveProjection(
            basePos.x + Math.sin(t * 2) * 5 + wobbleBase,
            -160 * reflectionFactor,
            basePos.z,
        );
        ctx.font = "bold 32px 'Space Grotesk'";
        ctx.fillText(TRIGRAMS.HEAD, headPos.x - 12, headPos.y);

        // Torso (Earth) - The Anchor
        for (let i = 0; i < 6; i++) {
            const yOffset = -120 + i * 15;
            const distortionOffset = isReflection
                ? Math.sin(t * 15 + i) * distortionLevel * 5
                : 0;
            const p = solveProjection(
                basePos.x + Math.cos(t * 3 + i) * 5 + distortionOffset,
                yOffset * reflectionFactor,
                basePos.z,
            );
            ctx.font = "bold 16px monospace";
            const char = "DEMIURGE"[i % 8];
            ctx.fillText(char, p.x, p.y);
        }

        // Dynamic Limbs (Fire/Lake)
        const leftHand = solveProjection(
            basePos.x - 40 + wobbleBase,
            (-100 + Math.sin(t * 4) * 20) * reflectionFactor,
            basePos.z - 20,
        );
        ctx.fillText(TRIGRAMS.L_ARM, leftHand.x, leftHand.y);

        const rightHand = solveProjection(
            basePos.x + 40 + wobbleBase,
            (-100 + Math.cos(t * 4) * 20) * reflectionFactor,
            basePos.z + 20,
        );
        ctx.fillText(TRIGRAMS.R_ARM, rightHand.x, rightHand.y);
        // ... staff prod code continues ...

        // --- THE STAFF PROD ---
        const prodY = -80 + Math.sin(t * 12) * 20;
        const staffTop = solveProjection(
            basePos.x + 40,
            prodY * reflectionFactor,
            basePos.z + 20,
        );
        const origin = solveProjection(0, 0, 0);

        // Staff Beam
        const grad = ctx.createLinearGradient(
            staffTop.x,
            staffTop.y,
            origin.x,
            origin.y,
        );
        grad.addColorStop(
            0,
            isReflection ? `rgba(${colorBase}, 0.2)` : "#fbbf24",
        );
        grad.addColorStop(1, "transparent");

        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.random() > 0.9 ? 4 : 2; // Flicker effect
        ctx.beginPath();
        ctx.moveTo(staffTop.x, staffTop.y);
        ctx.lineTo(origin.x, origin.y);
        ctx.stroke();

        // Trigger Creation Event on Prod Contact
        if (!isReflection && Math.sin(t * 12) > 0.95) {
            triggerCreation(origin.x, origin.y);
            entropyLevel += 0.1;
            monkeyCount = Math.floor(monkeyCount * 1.05) + 1; // Exponential monkey growth
        }

        ctx.restore();
    }

    function drawSpindle(t: number) {
        const origin = solveProjection(0, 0, 0);
        ctx.save();
        ctx.translate(origin.x, origin.y);
        ctx.rotate(t * 2);

        // Spindle Whorl
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 360; i += 10) {
            const rad = (i * Math.PI) / 180;
            // Warp geometry based on distortionLevel
            const warp = Math.sin(i * 4 + t * 5) * distortionLevel * 10;
            const r = 20 + Math.sin(i * 8 + t) * 5 + warp;
            const x = Math.cos(rad) * r;
            const y = Math.sin(rad) * r;
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Axis
        ctx.beginPath();
        ctx.moveTo(0, -40 - distortionLevel * 30);
        ctx.lineTo(0, 40 + distortionLevel * 30);
        ctx.strokeStyle = distortionLevel > 2.0 ? "#ef4444" : "#fbbf24";
        ctx.lineWidth = 2 + distortionLevel * 4;
        ctx.stroke();

        ctx.restore();
    }

    function triggerCreation(x: number, y: number) {
        // Check particle pool utilization instead of array length
        const stats = particlePool.getStats();
        if (stats.utilization > 95) return; // Near max capacity

        entropyLevel += 0.1;

        // Trigger Real Economy based on Entropy Thresholds
        if (Math.floor(entropyLevel * 10) % 25 === 0) {
            triggerEconomy();
        }

        monkeyCount = Math.floor(monkeyCount * 1.05) + 1;

        // Note: Distortion decay now handled in animate() with time-based physics

        // Generate a burst of linguistic entropy
        for (let i = 0; i < 3; i++) {
            const word =
                SACRED_WORDS[Math.floor(Math.random() * SACRED_WORDS.length)];
            const isSymbol = Math.random() > 0.7;

            particlePool.acquire({
                x,
                y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 1.5) * 12,
                text: isSymbol
                    ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
                    : word,
                life: 1.2,
                size: 10 + Math.random() * 20,
                color: isSymbol ? "#60a5fa" : "#fff",
                type: isSymbol ? "symbol" : "word",
                active: true,
            });
        }

        // Update "Sonnet" line randomly
        if (Math.random() > 0.8) {
            const newLine = getRandomLine();
            sonnetLine = newLine;

            // Sacred Sequence Detection
            if (SACRED_SEQUENCES.some((seq) => newLine.includes(seq))) {
                triggerEconomy(true); // Trigger Sacred Settlement
            }
        }
    }

    function getRandomLine() {
        const fragments = [
            ...SACRED_SEQUENCES,
            "The void stares back",
            "Geometry weeps",
            "Zero creates all",
            "Infinite monkeys typing",
            "Golden ratio soul",
            "Demiurge dreams",
            "Spindle weaves time",
        ];
        return fragments[Math.floor(Math.random() * fragments.length)] + "...";
    }

    function drawNumbersCone(t: number) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px monospace";

        const coneOrigin = { x: -200, y: -300, z: -100 };
        const rows = 15;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < r; c++) {
                const x = coneOrigin.x + (c - r / 2) * 20;
                const y = coneOrigin.y + r * 20;
                const p = solveProjection(x, y, coneOrigin.z);
                const num = Math.random() > 0.5 ? "1" : "0";
                ctx.fillText(num, p.x, p.y + Math.sin(t + c) * 5);
            }
        }
        ctx.restore();
    }

    function animate() {
        // Calculate delta time for frame-rate independence
        const now = performance.now();
        deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1); // Cap at 100ms to prevent huge jumps
        lastFrameTime = now;
        time += deltaTime;

        ctx.clearRect(0, 0, width, height);

        // Background Glow
        const bgGrad = ctx.createRadialGradient(
            width / 2,
            height / 2,
            0,
            width / 2,
            height / 2,
            width,
        );
        bgGrad.addColorStop(0, "#020617");
        bgGrad.addColorStop(1, "#000");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Draw Grid
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.lineWidth = 1;
        for (let i = -15; i <= 15; i++) {
            const p1 = solveProjection(i * 50, 0, -500);
            const p2 = solveProjection(i * 50, 0, 500);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            const p3 = solveProjection(-500, 0, i * 50);
            const p4 = solveProjection(500, 0, i * 50);
            ctx.beginPath();
            ctx.moveTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.stroke();
        }

        // Numbers Cone (Upper Left)
        drawNumbersCone(time);

        // The Zero Point A -> Bloom Effect
        const origin = solveProjection(0, 0, 0);
        const bloomSize = 30 + Math.sin(time * 5) * 5;
        const originGlow = ctx.createRadialGradient(
            origin.x,
            origin.y,
            0,
            origin.x,
            origin.y,
            bloomSize,
        );
        originGlow.addColorStop(0, "#fff");
        originGlow.addColorStop(0.3, "rgba(59, 130, 246, 0.5)");
        originGlow.addColorStop(1, "transparent");
        ctx.fillStyle = originGlow;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, bloomSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px 'Space Grotesk'";
        ctx.fillText("A", origin.x - 5, origin.y + 5);

        // Draw Spindle
        drawSpindle(time);

        // Mathman (Running Monkey)
        mathmanX += 5 * deltaTime * 60; // Normalize to 60fps
        if (mathmanX > 600) mathmanX = -600;
        const mmPos = solveProjection(mathmanX, 0, 100);
        ctx.globalAlpha = 1;
        ctx.font = "32px serif";
        ctx.fillText("🐒", mmPos.x - 16, mmPos.y);
        ctx.font = "bold 10px 'Space Grotesk'";
        ctx.fillStyle = "#3b82f6";
        ctx.fillText("MONKEY No." + monkeyCount, mmPos.x - 20, mmPos.y + 15);

        // Demiurge
        drawDemiurge(time, true, 0.3); // Reflection
        drawDemiurge(time, false, 1.0); // Active

        // Update particles with time-based physics
        particlePool.update(deltaTime, 0.25);

        // Render active particles
        const activeParticles = particlePool.getActive();
        activeParticles.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.font = `bold ${p.size}px 'Space Grotesk'`;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = p.life * 10;
            ctx.shadowColor = p.color;
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        });

        // Time-based distortion decay (exponential)
        distortionLevel = Math.max(
            0,
            distortionLevel * Math.exp(-deltaTime * DISTORTION_DECAY_RATE),
        );

        // Dynamic Overlay Text (Simulating Sonnet Generation)
        if (sonnetLine) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.font = "italic 24px serif";
            ctx.textAlign = "center";
            ctx.fillText(sonnetLine, width / 2, height - 100);
            ctx.textAlign = "left";
        }

        frame = requestAnimationFrame(animate);
    }
</script>

<div class="mathman-container">
    <canvas bind:this={canvas}></canvas>
    <div class="overlay">
        <h3>MILLION MONKEY ENGINE</h3>
        <div class="stats-box">
            <div class="stat-row">
                <span class="label">ENTROPY</span>
                <span class="value">{(entropyLevel * 100).toFixed(0)}%</span>
            </div>
            <div class="stat-row">
                <span class="label">TYPISTS</span>
                <span class="value">{monkeyCount.toLocaleString()}</span>
            </div>
            <div class="stat-row highlight">
                <span class="label">TREASURY (REAL)</span>
                <span class="value">{treasuryReserve}</span>
            </div>
            <div class="stat-row">
                <span class="label">INFLATION</span>
                <span class="value">{(inflationRate * 100).toFixed(2)}%</span>
            </div>
            <div class="stat-row">
                <span class="label">DISTORTION</span>
                <span class="value">{(distortionLevel * 100).toFixed(0)}%</span>
            </div>
            {#if lastSettlement}
                <div class="settlement-pulse">
                    SETTLED: {lastSettlement.amount} HCL
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .mathman-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 600px;
        background: #020617;
        border-radius: 3rem;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow:
            inset 0 0 50px rgba(0, 0, 0, 0.8),
            0 20px 40px rgba(0, 0, 0, 0.4);
    }

    .stats-box {
        display: flex;
        gap: 2rem;
        margin-top: 1rem;
        align-items: center;
    }

    .stat-row {
        display: flex;
        flex-direction: column;
    }

    .stat-row.highlight .value {
        color: #fbbf24;
        text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
    }

    .settlement-pulse {
        font-family: monospace;
        font-size: 0.8rem;
        color: #fbbf24;
        animation: flash 1s ease-out;
        padding: 4px 8px;
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: 4px;
    }

    @keyframes flash {
        0% {
            background: rgba(251, 191, 36, 0.5);
            transform: scale(1.1);
        }
        100% {
            background: transparent;
            transform: scale(1);
        }
    }

    canvas {
        display: block;

        width: 100%;
        height: 100%;
    }

    .overlay {
        position: absolute;
        top: 3rem;
        left: 3rem;
        pointer-events: none;
        z-index: 10;
    }

    h3 {
        margin: 0;
        font-size: 2rem;
        font-weight: 950;
        letter-spacing: 0.2em;
        color: #fbbf24;
        text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
    }

    p {
        margin: 0.5rem 0 0 0;
        font-size: 0.9rem;
        font-weight: 800;
        color: rgba(255, 255, 255, 0.3);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
</style>
