<script lang="ts">
    import { onMount } from "svelte";
    import type {
        PointOfDiscovery,
        GameLens,
        RewardTier,
    } from "$lib/geospatial/valleyvet-engine";

    // Props
    export let onSubmit: (discovery: any) => void = () => {};
    export let currentLens: GameLens = "adventure";
    export let userLocation: { lat: number; lng: number } | null = null;

    // State
    let isOpen = false;
    let isSubmitting = false;
    let capturedPhoto: string | null = null;
    let discoveryType: string = "wildlife_sighting";
    let subtype: string = "";
    let description: string = "";
    let result: any = null;
    let error: string | null = null;

    // Type options based on lens
    const typeOptions = {
        cozy: [
            {
                value: "wildlife_sighting",
                label: "🐾 Animal Sighting",
                subtypes: ["bird", "reptile", "mammal", "insect"],
            },
            {
                value: "invasive_pest",
                label: "🐜 Strange Bug",
                subtypes: ["ant", "beetle", "spider", "other"],
            },
        ],
        adventure: [
            {
                value: "wildlife_sighting",
                label: "🐉 Dragon Sighting",
                subtypes: ["crocodile", "snake", "monitor"],
            },
            {
                value: "invasive_pest",
                label: "⚔️ Crawling Scourge",
                subtypes: ["fire_ant", "electric_ant", "cane_toad"],
            },
            {
                value: "infrastructure_fault",
                label: "🕳️ Earth Scar",
                subtypes: ["pothole", "crack", "erosion"],
            },
            {
                value: "biosecurity_concern",
                label: "☠️ Dark Omen",
                subtypes: ["sick_animal", "dead_wildlife", "unusual"],
            },
        ],
        tactical: [
            {
                value: "biosecurity_concern",
                label: "🚨 Biosecurity Threat",
                subtypes: ["hendra_bat", "fmd_suspect", "unknown_disease"],
            },
            {
                value: "invasive_pest",
                label: "🎯 Invasive Species",
                subtypes: ["fire_ant", "electric_ant", "exotic_pest"],
            },
            {
                value: "wildlife_sighting",
                label: "📍 Sentinel Observation",
                subtypes: ["crocodile", "flying_fox", "feral"],
            },
        ],
    };

    $: currentOptions = typeOptions[currentLens] || typeOptions.adventure;
    $: selectedTypeOption = currentOptions.find(
        (t) => t.value === discoveryType,
    );

    // API config
    const apiUrl =
        import.meta.env.VITE_VETNOTES_API_URL || "http://localhost:8000";

    // Camera capture
    let videoRef: HTMLVideoElement;
    let canvasRef: HTMLCanvasElement;
    let stream: MediaStream | null = null;
    let cameraActive = false;

    async function openCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });
            if (videoRef) {
                videoRef.srcObject = stream;
                cameraActive = true;
            }
        } catch (e) {
            console.error("Camera access denied:", e);
            error = "Camera access denied. Please enable camera permissions.";
        }
    }

    function capturePhoto() {
        if (!videoRef || !canvasRef) return;

        const ctx = canvasRef.getContext("2d");
        if (!ctx) return;

        canvasRef.width = videoRef.videoWidth;
        canvasRef.height = videoRef.videoHeight;
        ctx.drawImage(videoRef, 0, 0);

        capturedPhoto = canvasRef.toDataURL("image/jpeg", 0.8);
        stopCamera();
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            stream = null;
        }
        cameraActive = false;
    }

    function retakePhoto() {
        capturedPhoto = null;
        openCamera();
    }

    async function submitDiscovery() {
        if (!userLocation) {
            error = "Location required. Please enable GPS.";
            return;
        }

        isSubmitting = true;
        error = null;

        try {
            const response = await fetch(`${apiUrl}/api/v1/quests/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: discoveryType,
                    subtype: subtype || undefined,
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    photo_uri: capturedPhoto,
                    description,
                    reporter_id: `user_${Date.now()}`,
                }),
            });

            if (!response.ok) throw new Error("Submission failed");

            result = await response.json();
            onSubmit(result);
        } catch (e) {
            error = e instanceof Error ? e.message : "Submission failed";
        } finally {
            isSubmitting = false;
        }
    }

    function close() {
        stopCamera();
        isOpen = false;
        result = null;
        error = null;
        capturedPhoto = null;
    }

    function open() {
        isOpen = true;
        result = null;
        error = null;
    }

    // Get current location
    onMount(() => {
        if (!userLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    userLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    };
                },
                (err) => console.warn("Geolocation error:", err),
            );
        }
    });
</script>

<!-- Floating Action Button -->
{#if !isOpen}
    <button class="fab" on:click={open} title="Report Discovery">
        <span class="fab-icon">📸</span>
        <span class="fab-label">Report</span>
    </button>
{/if}

<!-- Capture Modal -->
{#if isOpen}
    <div class="capture-overlay">
        <div
            class="capture-modal"
            class:lens-cozy={currentLens === "cozy"}
            class:lens-adventure={currentLens === "adventure"}
            class:lens-tactical={currentLens === "tactical"}
        >
            <!-- Header -->
            <header class="capture-header">
                <h2>
                    {#if currentLens === "cozy"}
                        🐾 Bug Watch Report
                    {:else if currentLens === "adventure"}
                        ⚔️ Quest Discovery
                    {:else}
                        🎯 Field Report
                    {/if}
                </h2>
                <button class="close-btn" on:click={close}>✕</button>
            </header>

            <!-- Success State -->
            {#if result}
                <div class="success-screen">
                    <div class="reward-animation">
                        <span class="reward-icon">🏆</span>
                        <h3>Discovery Recorded!</h3>
                    </div>

                    <div class="reward-details">
                        <div class="ai-result">
                            <strong>AI Classification:</strong>
                            <span class="species"
                                >{result.ai_classification?.species ||
                                    "Unknown"}</span
                            >
                            <span class="confidence"
                                >({Math.round(
                                    (result.ai_classification?.confidence ||
                                        0) * 100,
                                )}% confidence)</span
                            >
                            <span
                                class="risk-badge risk-{result.ai_classification?.risk_level?.toLowerCase()}"
                                >{result.ai_classification?.risk_level}</span
                            >
                        </div>

                        <div class="rewards-earned">
                            <div class="reward-item">
                                <span class="reward-value"
                                    >+{result.reward_tier?.xp}</span
                                >
                                <span class="reward-type">XP</span>
                            </div>
                            <div class="reward-item">
                                <span class="reward-value"
                                    >+{result.reward_tier?.coins}</span
                                >
                                <span class="reward-type">Coins</span>
                            </div>
                            {#if result.reward_tier?.badge}
                                <div class="reward-item badge">
                                    <span class="reward-value">🏅</span>
                                    <span class="reward-type"
                                        >{result.reward_tier.badge}</span
                                    >
                                </div>
                            {/if}
                            {#if result.reward_tier?.certification_points}
                                <div class="reward-item cert">
                                    <span class="reward-value"
                                        >+{result.reward_tier
                                            .certification_points}</span
                                    >
                                    <span class="reward-type">Cert Pts</span>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <button class="submit-btn" on:click={close}>Done</button>
                </div>
            {:else}
                <!-- Capture/Form State -->
                <div class="capture-body">
                    <!-- Camera Section -->
                    <div class="camera-section">
                        {#if cameraActive}
                            <video
                                bind:this={videoRef}
                                autoplay
                                playsinline
                                class="camera-preview"
                            ></video>
                            <button class="capture-btn" on:click={capturePhoto}
                                >📷 Capture</button
                            >
                        {:else if capturedPhoto}
                            <img
                                src={capturedPhoto}
                                alt="Captured"
                                class="captured-preview"
                            />
                            <button class="retake-btn" on:click={retakePhoto}
                                >🔄 Retake</button
                            >
                        {:else}
                            <div class="camera-placeholder">
                                <button
                                    class="start-camera-btn"
                                    on:click={openCamera}
                                >
                                    📸 Open Camera
                                </button>
                                <p>or skip photo</p>
                            </div>
                        {/if}
                        <canvas bind:this={canvasRef} style="display: none;"
                        ></canvas>
                    </div>

                    <!-- Form Section -->
                    <div class="form-section">
                        <label class="form-label">
                            <span>What did you find?</span>
                            <select
                                bind:value={discoveryType}
                                class="form-select"
                            >
                                {#each currentOptions as opt}
                                    <option value={opt.value}
                                        >{opt.label}</option
                                    >
                                {/each}
                            </select>
                        </label>

                        {#if selectedTypeOption?.subtypes}
                            <label class="form-label">
                                <span>Type</span>
                                <select
                                    bind:value={subtype}
                                    class="form-select"
                                >
                                    <option value="">Select...</option>
                                    {#each selectedTypeOption.subtypes as sub}
                                        <option value={sub}>{sub}</option>
                                    {/each}
                                </select>
                            </label>
                        {/if}

                        <label class="form-label">
                            <span>Notes (optional)</span>
                            <textarea
                                bind:value={description}
                                class="form-textarea"
                                placeholder="Any additional details..."
                            ></textarea>
                        </label>

                        <!-- Location -->
                        <div class="location-info">
                            {#if userLocation}
                                <span class="location-badge"
                                    >📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(
                                        4,
                                    )}</span
                                >
                            {:else}
                                <span class="location-warning"
                                    >⚠️ Getting location...</span
                                >
                            {/if}
                        </div>

                        {#if error}
                            <div class="error-message">{error}</div>
                        {/if}
                    </div>
                </div>

                <!-- Footer -->
                <footer class="capture-footer">
                    <button class="cancel-btn" on:click={close}>Cancel</button>
                    <button
                        class="submit-btn"
                        on:click={submitDiscovery}
                        disabled={isSubmitting || !userLocation}
                    >
                        {#if isSubmitting}
                            Submitting...
                        {:else}
                            Submit Discovery
                        {/if}
                    </button>
                </footer>
            {/if}
        </div>
    </div>
{/if}

<style>
    /* Floating Action Button */
    .fab {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 1.5rem;
        background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
        color: white;
        border: none;
        border-radius: 50px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(74, 144, 217, 0.4);
        z-index: 100;
        transition: all 0.2s;
    }

    .fab:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(74, 144, 217, 0.5);
    }

    .fab-icon {
        font-size: 1.5rem;
    }

    /* Overlay */
    .capture-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }

    /* Modal */
    .capture-modal {
        background: white;
        border-radius: 20px;
        width: 100%;
        max-width: 450px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    /* Lens themes */
    .capture-modal.lens-cozy {
        background: linear-gradient(180deg, #fff5e6 0%, #ffffff 30%);
    }

    .capture-modal.lens-adventure {
        background: linear-gradient(180deg, #f5ebe0 0%, #ffffff 30%);
    }

    .capture-modal.lens-tactical {
        background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
        color: white;
    }

    .lens-tactical .form-select,
    .lens-tactical .form-textarea {
        background: #2d3a4a;
        border-color: #4a5a6a;
        color: white;
    }

    /* Header */
    .capture-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .capture-header h2 {
        margin: 0;
        font-size: 1.25rem;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0.6;
    }

    .close-btn:hover {
        opacity: 1;
    }

    /* Body */
    .capture-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
    }

    /* Camera */
    .camera-section {
        margin-bottom: 1.5rem;
        border-radius: 12px;
        overflow: hidden;
        background: #f0f0f0;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .camera-preview,
    .captured-preview {
        width: 100%;
        max-height: 250px;
        object-fit: cover;
    }

    .camera-placeholder {
        text-align: center;
        padding: 2rem;
    }

    .camera-placeholder p {
        margin-top: 0.5rem;
        color: #999;
        font-size: 0.9rem;
    }

    .start-camera-btn {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        background: #4a90d9;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    }

    .capture-btn,
    .retake-btn {
        width: 100%;
        padding: 0.75rem;
        background: #4a90d9;
        color: white;
        border: none;
        font-weight: 600;
        cursor: pointer;
    }

    .retake-btn {
        background: #666;
    }

    /* Form */
    .form-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-label span {
        font-weight: 600;
        font-size: 0.9rem;
    }

    .form-select,
    .form-textarea {
        padding: 0.75rem;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
    }

    .form-textarea {
        min-height: 80px;
        resize: vertical;
    }

    .location-info {
        padding: 0.5rem;
        text-align: center;
    }

    .location-badge {
        color: #4a90d9;
        font-size: 0.85rem;
    }

    .location-warning {
        color: #e67e22;
        font-size: 0.85rem;
    }

    .error-message {
        background: #fee;
        color: #c00;
        padding: 0.75rem;
        border-radius: 8px;
        text-align: center;
    }

    /* Footer */
    .capture-footer {
        display: flex;
        gap: 1rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .cancel-btn,
    .submit-btn {
        flex: 1;
        padding: 1rem;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .cancel-btn {
        background: #e0e0e0;
        color: #333;
    }

    .submit-btn {
        background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
        color: white;
    }

    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Success Screen */
    .success-screen {
        padding: 2rem;
        text-align: center;
    }

    .reward-animation {
        margin-bottom: 1.5rem;
    }

    .reward-icon {
        font-size: 4rem;
        display: block;
        animation: bounce 0.5s ease;
    }

    @keyframes bounce {
        0%,
        100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.2);
        }
    }

    .reward-animation h3 {
        margin: 1rem 0 0 0;
        font-size: 1.5rem;
        color: #27ae60;
    }

    .reward-details {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .ai-result {
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e0e0e0;
    }

    .species {
        display: block;
        font-size: 1.1rem;
        font-style: italic;
        margin: 0.5rem 0;
    }

    .confidence {
        font-size: 0.85rem;
        color: #666;
    }

    .risk-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-left: 0.5rem;
    }

    .risk-badge.risk-critical {
        background: #e74c3c;
        color: white;
    }
    .risk-badge.risk-high {
        background: #e67e22;
        color: white;
    }
    .risk-badge.risk-medium {
        background: #f1c40f;
        color: #333;
    }
    .risk-badge.risk-low {
        background: #27ae60;
        color: white;
    }

    .rewards-earned {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
    }

    .reward-item {
        text-align: center;
    }

    .reward-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #4a90d9;
    }

    .reward-item.badge .reward-value,
    .reward-item.cert .reward-value {
        font-size: 1.25rem;
    }

    .reward-type {
        font-size: 0.75rem;
        color: #666;
        text-transform: uppercase;
    }

    .lens-tactical .reward-details {
        background: #2d3a4a;
    }

    .lens-tactical .ai-result {
        border-color: #4a5a6a;
    }

    .lens-tactical .species,
    .lens-tactical .reward-type {
        color: #aaa;
    }
</style>
