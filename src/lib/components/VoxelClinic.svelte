<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import {
        createRandomPet,
        calculateVoiceImpact,
        type PetState,
    } from "$lib/engine/pet-personality";
    import { playSound, triggerHaptic } from "$lib/utils/sounds";

    const dispatch = createEventDispatcher();

    // State
    let pet: PetState = createRandomPet();
    let volume = 0;
    let sentiment = 0; // -1 to 1
    let isListening = false;
    let consultationTime = 0;
    let feedbackText = "";
    let showVictory = false;

    // Mic analysis simulation
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let dataArray: Uint8Array;

    onMount(() => {
        const timer = setInterval(() => {
            if (isListening) consultationTime++;
        }, 1000);

        return () => clearInterval(timer);
    });

    async function toggleMic() {
        if (!isListening) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
                audioContext = new AudioContext();
                const source = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                source.connect(analyser);
                isListening = true;

                // Simulate periodic sentiment/volume analysis
                const interval = setInterval(() => {
                    if (!isListening) {
                        clearInterval(interval);
                        return;
                    }

                    // Simple peak detection for volume
                    dataArray = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(dataArray);
                    const average =
                        dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                    volume = average / 128; // Normalize

                    // Mock sentiment logic: If volume is steady and moderate, it's "positive"
                    sentiment = volume > 0.6 ? -0.5 : volume > 0.1 ? 0.8 : 0;

                    const impact = calculateVoiceImpact(pet, volume, sentiment);
                    pet.trustLevel = Math.max(
                        0,
                        Math.min(100, pet.trustLevel + impact / 10),
                    );

                    if (impact > 2) feedbackText = "Phew... that helped!";
                    else if (impact < -2)
                        feedbackText =
                            pet.temperament === "anxious"
                                ? "Too loud!"
                                : "Hmph!";
                    else feedbackText = "";
                }, 500);
            } catch (e) {
                alert("Microphone required for AIVA Pet Negotiation.");
            }
        } else {
            isListening = false;
            audioContext?.close();
        }
    }

    function finishConsultation() {
        if (pet.trustLevel > 70) {
            playSound("success_high");
            triggerHaptic("heavy");
            showVictory = true;
        } else {
            alert(`${pet.name} is still a bit wary. Talk to them some more!`);
        }
    }

    function close() {
        if (showVictory) {
            dispatch("victory", { pet });
        } else {
            dispatch("close");
        }
    }
</script>

<div class="clinic-overlay" transition:fade>
    <div class="clinic-room" in:fly={{ y: 50 }}>
        <header>
            <div class="clinic-status">
                <span class="loc">📍 EDMONTON NEIGHBORHOOD CLINIC</span>
                <h2>Morning Rush</h2>
            </div>
            <button class="close-btn" on:click={close}>✕</button>
        </header>

        <div class="patient-stage">
            <div class="pet-visual" in:scale>
                <div class="mood-bubble" class:visible={feedbackText}>
                    {feedbackText}
                </div>
                <!-- Cute emoji representation for now -->
                <div
                    class="pet-avatar"
                    class:anxious={pet.temperament === "anxious"}
                    class:grumpy={pet.temperament === "grumpy"}
                >
                    {#if pet.species === "Dog"}
                        🐕
                    {:else if pet.species === "Cat"}
                        🐈
                    {:else}
                        🐾
                    {/if}
                </div>
                <div class="pet-shadow"></div>
            </div>

            <div class="pet-identity">
                <h3>{pet.name} the {pet.breed}</h3>
                <div class="temp-badge">
                    <span class="icon">🎭</span>
                    <span class="val">{pet.temperament.toUpperCase()}</span>
                </div>
            </div>
        </div>

        <div class="interaction-zone">
            <div class="trust-meter">
                <div class="meter-label">
                    <span>AIVA TRUST METER</span>
                    <strong>{Math.floor(pet.trustLevel)}%</strong>
                </div>
                <div class="meter-track">
                    <div
                        class="meter-fill"
                        style="width: {pet.trustLevel}%"
                        class:critical={pet.trustLevel < 30}
                        class:success={pet.trustLevel > 80}
                    ></div>
                </div>
            </div>

            <div class="voice-controls">
                <button
                    class="mic-btn"
                    class:active={isListening}
                    on:click={toggleMic}
                >
                    <div class="mic-icon">{isListening ? "🎙️" : "🎤"}</div>
                    <span
                        >{isListening
                            ? "AIVA LISTENING..."
                            : "START AIVA NEGOTIATION"}</span
                    >
                    {#if isListening}
                        <div class="audio-waves">
                            <div
                                class="wave"
                                style="height: {Math.random() * 100}%"
                            ></div>
                            <div
                                class="wave"
                                style="height: {Math.random() * 100}%"
                            ></div>
                            <div
                                class="wave"
                                style="height: {Math.random() * 100}%"
                            ></div>
                        </div>
                    {/if}
                </button>
                <p class="hint">Use a soft voice to calm {pet.name}.</p>
            </div>
        </div>

        <footer>
            <button
                class="finish-btn"
                on:click={finishConsultation}
                disabled={pet.trustLevel < 70}
            >
                {pet.trustLevel > 70
                    ? "COMPLETE TREATMENT"
                    : "BUILD TRUST TO FINISH"}
            </button>
        </footer>
    </div>

    {#if showVictory}
        <div class="success-pop" transition:scale>
            <div class="card">
                <h2>CLINIC SUCCESS!</h2>
                <p>
                    {pet.name} is feeling much better thanks to your AIVA empathy.
                </p>
                <div class="rewards">
                    <div class="rew">
                        <span>XP</span><strong>+1,200</strong>
                    </div>
                    <div class="rew">
                        <span>REPUTATION</span><strong>+5</strong>
                    </div>
                </div>
                <button class="ok-btn" on:click={close}>COLLECT REWARDS</button>
            </div>
        </div>
    {/if}
</div>

<style>
    .clinic-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5000;
        backdrop-filter: blur(20px);
        padding: 1rem;
    }

    .clinic-room {
        width: 100%;
        max-width: 500px;
        background: white;
        border-radius: 40px;
        overflow: hidden;
        color: #1e293b;
        display: flex;
        flex-direction: column;
        box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.5);
    }

    header {
        padding: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        background: #f8fafc;
    }

    .loc {
        font-size: 0.65rem;
        font-weight: 800;
        color: #64748b;
        letter-spacing: 0.1em;
    }
    h2 {
        margin: 0.25rem 0 0 0;
        font-size: 1.5rem;
        font-weight: 900;
        color: #0f172a;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #94a3b8;
        cursor: pointer;
    }

    .patient-stage {
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    .pet-visual {
        position: relative;
        width: 200px;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .pet-avatar {
        font-size: 8rem;
        position: relative;
        z-index: 2;
        transition: transform 0.2s;
    }

    .pet-avatar.anxious {
        animation: shimmer 0.2s infinite;
    }
    .pet-avatar.grumpy {
        transform: rotate(-10deg);
    }

    @keyframes shimmer {
        0% {
            transform: translate(1px, 1px);
        }
        50% {
            transform: translate(-1px, 0);
        }
        100% {
            transform: translate(0, -1px);
        }
    }

    .pet-shadow {
        position: absolute;
        bottom: 20px;
        width: 120px;
        height: 20px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 50%;
    }

    .mood-bubble {
        position: absolute;
        top: -20px;
        right: -20px;
        background: #1e293b;
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.2s;
        z-index: 10;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }

    .mood-bubble.visible {
        opacity: 1;
        transform: translateY(0);
    }

    .pet-identity {
        text-align: center;
    }
    h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 800;
    }

    .temp-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: #f1f5f9;
        padding: 0.4rem 0.8rem;
        border-radius: 50px;
        margin-top: 0.5rem;
    }
    .temp-badge .icon {
        font-size: 0.8rem;
    }
    .temp-badge .val {
        font-size: 0.65rem;
        font-weight: 800;
        color: #64748b;
    }

    .interaction-zone {
        padding: 2rem;
        background: #f8fafc;
        border-radius: 40px 40px 0 0;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .trust-meter {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .meter-label {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }
    .meter-label span {
        font-size: 0.7rem;
        font-weight: 800;
        color: #64748b;
    }
    .meter-label strong {
        font-size: 1.2rem;
        font-weight: 900;
    }

    .meter-track {
        height: 12px;
        background: #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
    }
    .meter-fill {
        height: 100%;
        background: #38bdf8;
        transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .meter-fill.success {
        background: #10b981;
    }
    .meter-fill.critical {
        background: #ef4444;
    }

    .voice-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .mic-btn {
        width: 100%;
        background: white;
        border: 2px solid #e2e8f0;
        padding: 1.5rem;
        border-radius: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
    }

    .mic-btn.active {
        border-color: #38bdf8;
        background: #f0f9ff;
    }
    .mic-icon {
        font-size: 2rem;
    }
    .mic-btn span {
        font-size: 0.9rem;
        font-weight: 800;
        color: #0f172a;
    }

    .audio-waves {
        display: flex;
        gap: 4px;
        height: 20px;
        align-items: center;
    }
    .wave {
        width: 4px;
        background: #38bdf8;
        border-radius: 2px;
    }

    .hint {
        font-size: 0.8rem;
        color: #94a3b8;
        font-weight: 500;
    }

    footer {
        padding: 2rem;
    }

    .finish-btn {
        width: 100%;
        padding: 1.5rem;
        background: #0f172a;
        color: white;
        border: none;
        border-radius: 20px;
        font-weight: 800;
        font-size: 1.1rem;
        cursor: pointer;
        transition: opacity 0.2s;
    }
    .finish-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .success-pop {
        position: absolute;
        inset: 0;
        background: rgba(16, 185, 129, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 2rem;
    }

    .success-pop .card {
        background: white;
        padding: 3rem 2rem;
        border-radius: 32px;
        text-align: center;
    }

    .rewards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin: 2rem 0;
    }
    .rew {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .rew span {
        font-size: 0.6rem;
        font-weight: 800;
        color: #64748b;
    }
    .rew strong {
        font-size: 1.5rem;
        color: #10b981;
    }

    .ok-btn {
        width: 100%;
        padding: 1.25rem;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 16px;
        font-weight: 800;
        cursor: pointer;
    }
</style>
