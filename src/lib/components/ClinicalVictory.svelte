<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { confetti } from "@tsparticles/confetti";

    const dispatch = createEventDispatcher();

    export let pet: {
        name: string;
        species: string;
        breed: string;
        story: string;
        image?: string;
    };
    export let lensMode: "cozy" | "adventure" | "tactical" = "cozy";

    let isSaving = false;

    onMount(() => {
        // Trigger celebratory confetti
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#38bdf8", "#818cf8", "#f472b6", "#fbbf24"],
        });
    });

    async function downloadPoster() {
        isSaving = true;
        setTimeout(() => {
            isSaving = false;
            alert(
                "Clinical Success Story saved to your gallery! Follow the hashtag #VetKingdom to share on TikTok.",
            );
        }, 1200);
    }

    function close() {
        dispatch("close");
    }
</script>

<div class="victory-overlay" transition:fade>
    <div
        class="victory-card glass-panel"
        in:scale={{ duration: 500, start: 0.8 }}
    >
        <div class="card-inner">
            <!-- Decorative Background Patterns -->
            <div class="bg-decoration"></div>

            <header class="victory-header">
                <div class="badge">VETERINARY HERO</div>
                <h1>Success! {pet.name} is Healthy.</h1>
                <p class="subtitle">
                    Case #VK-{Math.floor(Math.random() * 90000 + 10000)} • Resolution:
                    100%
                </p>
            </header>

            <div class="photo-frame">
                <div class="photo-border">
                    {#if pet.image}
                        <img
                            src={pet.image}
                            alt={pet.name}
                            class="pet-photo pixelated"
                        />
                    {:else if pet.species === "Dog"}
                        <img
                            src="/assets/pet_dog_pro.png"
                            alt="Dog"
                            class="pet-photo pixelated"
                        />
                    {:else if pet.species === "Dragon"}
                        <img
                            src="/assets/pet_dragon_pro.png"
                            alt="Dragon"
                            class="pet-photo pixelated"
                        />
                    {:else if pet.species === "Bird"}
                        <img
                            src="/assets/pet_bird_pro.png"
                            alt="Bird"
                            class="pet-photo pixelated"
                        />
                    {:else}
                        <div class="pet-placeholder">
                            <span class="icon">🐾</span>
                            <span class="label">{pet.breed}</span>
                        </div>
                    {/if}
                    <div class="photo-overlay">
                        <span class="watermark"
                            >Vet Kingdom Official Clinic</span
                        >
                    </div>
                </div>
            </div>

            <div class="story-section">
                <h3>The Story of {pet.name}</h3>
                <p>"{pet.story}"</p>
            </div>

            <div class="stats-grid">
                <div class="stat-box">
                    <span class="val"
                        >🛡️ {Math.floor(Math.random() * 20 + 80)}%</span
                    >
                    <span class="lab">Trust Meter</span>
                </div>
                <div class="stat-box">
                    <div class="flex items-center gap-2 justify-center">
                        <img
                            src="/assets/icon_heart.png"
                            class="w-6 h-6"
                            alt="Heart"
                        />
                        <span class="val">Happy</span>
                    </div>
                    <span class="lab">Final Mood</span>
                </div>
                <div class="stat-box">
                    <span class="val">⭐ 5.0</span>
                    <span class="lab">Owner Review</span>
                </div>
            </div>

            <footer class="victory-footer">
                <button class="share-btn" on:click={downloadPoster}>
                    {#if isSaving}
                        <span class="spinner"></span> Generating...
                    {:else}
                        📸 Save Success Story
                    {/if}
                </button>
                <button class="close-btn" on:click={close}
                    >Return to Clinic</button
                >
            </footer>
        </div>
    </div>
</div>

<style>
    .victory-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
        backdrop-filter: blur(15px);
        padding: 1rem;
    }

    .victory-card {
        width: 100%;
        max-width: 500px;
        background: #1e293b;
        border-radius: 32px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.8);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .card-inner {
        padding: 2.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
        z-index: 1;
    }

    .bg-decoration {
        position: absolute;
        inset: 0;
        background: radial-gradient(
                circle at top right,
                rgba(244, 114, 182, 0.1),
                transparent
            ),
            radial-gradient(
                circle at bottom left,
                rgba(56, 189, 248, 0.1),
                transparent
            );
        pointer-events: none;
    }

    .victory-header {
        margin-bottom: 2rem;
    }

    .badge {
        display: inline-block;
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        padding: 0.5rem 1rem;
        border-radius: 50px;
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        margin-bottom: 1rem;
        text-transform: uppercase;
        border: 1px solid rgba(56, 189, 248, 0.2);
    }

    h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 800;
        line-height: 1.2;
        color: white;
    }

    .subtitle {
        margin: 0.5rem 0 0;
        font-size: 0.85rem;
        opacity: 0.6;
        font-family: monospace;
        color: rgba(255, 255, 255, 0.6);
    }

    .photo-frame {
        width: 100%;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 24px;
        margin-bottom: 2rem;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .photo-border {
        position: relative;
        aspect-ratio: 4/3;
        background: #0f172a;
        border-radius: 16px;
        overflow: hidden;
    }

    .pet-photo {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: radial-gradient(circle, #1e293b 0%, #0f172a 100%);
    }

    .pixelated {
        image-rendering: pixelated;
    }

    .pet-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1e293b, #0f172a);
        color: #64748b;
    }

    .photo-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 1rem;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
        text-align: right;
    }

    .watermark {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .story-section {
        margin-bottom: 2rem;
    }

    .story-section h3 {
        font-size: 0.9rem;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
        opacity: 0.6;
        color: #94a3b8;
    }

    .story-section p {
        font-size: 1.1rem;
        font-style: italic;
        line-height: 1.6;
        margin: 0;
        color: white;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        width: 100%;
        margin-bottom: 2.5rem;
    }

    .stat-box {
        background: rgba(255, 255, 255, 0.03);
        padding: 1rem 0.5rem;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .stat-box .val {
        font-weight: 800;
        font-size: 1.1rem;
        color: #38bdf8;
    }

    .stat-box .lab {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        opacity: 0.5;
        color: rgba(255, 255, 255, 0.6);
    }

    .victory-footer {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .share-btn {
        width: 100%;
        padding: 1.25rem;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;
        border-radius: 16px;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        transition:
            transform 0.2s,
            box-shadow 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .share-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
    }

    .close-btn {
        width: 100%;
        padding: 1rem;
        background: transparent;
        color: rgba(255, 255, 255, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    .close-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: white;
    }

    .spinner {
        width: 1rem;
        height: 1rem;
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
