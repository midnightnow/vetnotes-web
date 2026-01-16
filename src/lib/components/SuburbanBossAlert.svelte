<script lang="ts">
    import { fly, fade, scale } from "svelte/transition";
    import { createEventDispatcher, onMount } from "svelte";
    import type { BossBattle } from "$lib/geospatial/valleyvet-engine";
    import { playSound, triggerHaptic } from "$lib/utils/sounds";

    export let event: BossBattle;
    const dispatch = createEventDispatcher();

    onMount(() => {
        playSound("scan"); // High-intensity start sound
        triggerHaptic("heavy");
    });

    function joinTheFight() {
        triggerHaptic("light");
        dispatch("join");
    }
</script>

<div class="boss-alert-overlay" transition:fade>
    <div
        class="boss-card"
        in:fly={{ y: 100, duration: 800 }}
        out:scale={{ duration: 400 }}
    >
        <div class="badge">⚠️ SUBURBAN BOSS BATTLE</div>

        <header>
            <h1>{event.title}</h1>
            <p class="postcode">
                📍 POSTCODE {event.targetPostcode} - STATUS: CRITICAL
            </p>
        </header>

        <div class="threat-info">
            <span class="threat-label">TARGET THREAT:</span>
            <span class="threat-value">{event.threatSpecies}</span>
        </div>

        <div class="progress-container">
            <div class="progress-stats">
                <span
                    >{event.currentSuburbanReports} / {event.targetSuburbanReports}
                    REPORTS FOUND</span
                >
            </div>
            <div class="progress-track">
                <div
                    class="progress-fill"
                    style="width: {(event.currentSuburbanReports /
                        event.targetSuburbanReports) *
                        100}%"
                ></div>
            </div>
        </div>

        <div class="lore-box">
            <p>{event.lore.announcement}</p>
        </div>

        <div class="rewards-preview">
            <span class="reward-title">TEAM VICTORY REWARD:</span>
            <div class="reward-badges">
                <div class="reward-pill">+{event.rewards.xp} XP</div>
                <div class="reward-pill">+{event.rewards.coins} CREDITS</div>
                <div class="reward-pill">🛡️ DEFENDER BADGE</div>
            </div>
        </div>

        <div class="actions">
            <button class="join-btn" on:click={joinTheFight}
                >JOIN THE SHIELD</button
            >
            <button class="dismiss-btn" on:click={() => dispatch("close")}
                >DISMISS</button
            >
        </div>
    </div>
</div>

<style>
    .boss-alert-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5000;
        backdrop-filter: blur(20px);
        padding: 2rem;
    }

    .boss-card {
        background: #111;
        width: 100%;
        max-width: 450px;
        border-radius: 32px;
        border: 2px solid #ef4444;
        padding: 2.5rem;
        color: white;
        text-align: center;
        box-shadow: 0 0 50px rgba(239, 68, 68, 0.4);
    }

    .badge {
        display: inline-block;
        background: #ef4444;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 50px;
        font-weight: 900;
        font-size: 0.7rem;
        letter-spacing: 0.2em;
        margin-bottom: 1.5rem;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.05);
            opacity: 0.8;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    h1 {
        font-size: 2rem;
        font-weight: 950;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: -0.02em;
    }

    .postcode {
        color: #ef4444;
        font-weight: 800;
        font-size: 0.75rem;
        margin-top: 0.5rem;
        letter-spacing: 0.05em;
    }

    .threat-info {
        margin: 2rem 0;
        background: rgba(239, 68, 68, 0.1);
        padding: 1.5rem;
        border-radius: 20px;
        border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .threat-label {
        display: block;
        font-size: 0.65rem;
        font-weight: 800;
        color: #999;
        margin-bottom: 0.5rem;
    }

    .threat-value {
        font-size: 1.5rem;
        font-weight: 900;
        color: #ef4444;
    }

    .progress-track {
        height: 12px;
        background: #222;
        border-radius: 6px;
        overflow: hidden;
        margin-top: 0.75rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ef4444, #f87171);
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
    }

    .progress-stats {
        font-size: 0.7rem;
        font-weight: 800;
        color: #666;
    }

    .lore-box {
        margin: 2rem 0;
        font-style: italic;
        color: #ccc;
        font-size: 0.95rem;
        line-height: 1.6;
    }

    .rewards-preview {
        border-top: 1px solid #333;
        padding-top: 2rem;
        margin-top: 2rem;
    }

    .reward-title {
        display: block;
        font-size: 0.65rem;
        font-weight: 900;
        color: #999;
        margin-bottom: 1rem;
    }

    .reward-badges {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .reward-pill {
        background: #222;
        padding: 0.5rem 1rem;
        border-radius: 50px;
        font-size: 0.75rem;
        font-weight: 800;
        color: #fbbf24;
        border: 1px solid #333;
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 2.5rem;
    }

    .join-btn {
        background: white;
        color: black;
        border: none;
        padding: 1.25rem;
        border-radius: 20px;
        font-weight: 950;
        font-size: 1.1rem;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .join-btn:active {
        transform: scale(0.95);
    }

    .dismiss-btn {
        background: transparent;
        color: #666;
        border: none;
        font-weight: 700;
        cursor: pointer;
        padding: 0.5rem;
    }
</style>
