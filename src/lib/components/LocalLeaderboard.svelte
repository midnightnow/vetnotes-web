<script lang="ts">
    import { fly, fade } from "svelte/transition";

    // Mock data for neighborhood ranking
    const neighborhood = "Smithfield / Edmonton";
    const rankings = [
        { name: "Djari_Sentinel", score: 14200, avatar: "🐉", isUser: false },
        { name: "Ranger_Mia", score: 12500, avatar: "🦁", isUser: false },
        { name: "You", score: 8400, avatar: "⚡", isUser: true },
        { name: "BugHunter_26", score: 7200, avatar: "🐜", isUser: false },
        { name: "Eco_Warrior", score: 5100, avatar: "🌿", isUser: false },
    ];

    export let isOpen = false;
</script>

{#if isOpen}
    <div class="leaderboard-overlay" transition:fade>
        <div class="leaderboard-modal" in:fly={{ y: 50 }}>
            <header>
                <div class="header-main">
                    <span class="loc-tag">📍 {neighborhood}</span>
                    <h2>Region Dashboard</h2>
                </div>
                <div class="readiness-gauge">
                    <div class="gauge-header">
                        <span>POSTCODE READINESS</span>
                        <strong>84%</strong>
                    </div>
                    <div class="gauge-track">
                        <div class="gauge-fill" style="width: 84%"></div>
                    </div>
                </div>
                <button class="close-btn" on:click={() => (isOpen = false)}
                    >✕</button
                >
            </header>

            <div class="suburban-stats">
                <div class="sub-stat">
                    <span class="val">4,280</span>
                    <span class="lab">TOTAL REPORTS</span>
                </div>
                <div class="sub-stat">
                    <span class="val up">+12%</span>
                    <span class="lab">SECTOR GROWTH</span>
                </div>
                <div class="sub-stat">
                    <span class="val">#2</span>
                    <span class="lab">CAIRNS RANK</span>
                </div>
            </div>

            <div class="community-boss-battle">
                <div class="battle-header">
                    <span class="battle-title">⚔️ SMITHFIELD SCOURGE</span>
                    <span class="battle-target">42 / 100 REPORTS</span>
                </div>
                <div class="battle-progress">
                    <div class="progress-fill" style="width: 42%"></div>
                </div>
                <p class="battle-hint">
                    Unlock the <strong>"Ant Exterminator"</strong> badge for the
                    whole suburb!
                </p>
            </div>

            <div class="rank-list">
                <header class="list-header">TOP SENTINELS</header>
                {#each rankings as rank, i}
                    <div
                        class="rank-item"
                        class:is-user={rank.isUser}
                        in:fly={{ x: -20, delay: i * 50 }}
                    >
                        <div class="rank-num">#{i + 1}</div>
                        <div class="rank-avatar">{rank.avatar}</div>
                        <div class="rank-info">
                            <span class="name">{rank.name}</span>
                            <span class="points"
                                >{rank.score.toLocaleString()} XP</span
                            >
                        </div>
                    </div>
                {/each}
            </div>

            <div class="cta">
                <p>
                    Find <strong>5 more</strong> fire ant mounds to beat Ranger_Mia!
                </p>
            </div>
        </div>
    </div>
{/if}

<style>
    .leaderboard-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000;
        backdrop-filter: blur(10px);
        padding: 1.5rem;
    }

    .leaderboard-modal {
        background: #111;
        width: 100%;
        max-width: 400px;
        border-radius: 24px;
        border: 1px solid #333;
        overflow: hidden;
        color: white;
    }

    header {
        padding: 1.5rem;
        background: #1a1a1a;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .header-main {
        padding-right: 2rem;
    }

    .readiness-gauge {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .gauge-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        color: #999;
    }

    .gauge-header strong {
        color: #10b981;
        font-size: 1rem;
    }

    .gauge-track {
        height: 6px;
        background: #333;
        border-radius: 10px;
        overflow: hidden;
    }

    .gauge-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #34d399);
        box-shadow: 0 0 10px rgba(52, 211, 153, 0.3);
    }

    .suburban-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        background: #161616;
        border-bottom: 1px solid #333;
    }

    .sub-stat {
        padding: 1.25rem 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        border-right: 1px solid #222;
    }

    .sub-stat:last-child {
        border-right: none;
    }

    .sub-stat .val {
        font-size: 1.1rem;
        font-weight: 950;
    }

    .sub-stat .val.up {
        color: #10b981;
    }

    .sub-stat .lab {
        font-size: 0.55rem;
        font-weight: 800;
        color: #666;
        letter-spacing: 0.05em;
    }

    .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
    }

    .community-boss-battle {
        padding: 1.5rem;
        background: linear-gradient(
            180deg,
            rgba(245, 158, 11, 0.1) 0%,
            transparent 100%
        );
        border-bottom: 1px solid #333;
    }

    .battle-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .battle-title {
        font-weight: 950;
        font-size: 0.8rem;
        letter-spacing: 0.05em;
        color: #fbbf24;
    }

    .battle-target {
        font-size: 0.7rem;
        font-weight: 800;
        opacity: 0.7;
    }

    .battle-progress {
        height: 12px;
        background: #222;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 0.75rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #f59e0b, #ef4444);
        border-radius: 6px;
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
    }

    .battle-hint {
        font-size: 0.75rem;
        color: #999;
        margin: 0;
    }

    .battle-hint strong {
        color: #fbbf24;
    }

    .list-header {
        font-size: 0.65rem;
        font-weight: 900;
        letter-spacing: 0.1em;
        color: #666;
        padding: 0 0.5rem 0.5rem 0.5rem;
    }

    .rank-list {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .rank-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: #1e1e1e;
        border-radius: 16px;
        border: 1px solid transparent;
    }

    .rank-item.is-user {
        background: rgba(251, 191, 36, 0.1);
        border-color: #fbbf24;
    }

    .rank-num {
        font-weight: 900;
        width: 30px;
        color: #666;
    }

    .rank-item.is-user .rank-num {
        color: #fbbf24;
    }

    .rank-avatar {
        font-size: 1.5rem;
    }

    .rank-info {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    .name {
        font-weight: 700;
    }
    .points {
        font-size: 0.8rem;
        opacity: 0.5;
        font-family: monospace;
    }

    .cta {
        padding: 1.5rem;
        background: #1a1a1a;
        text-align: center;
        font-size: 0.85rem;
        color: #999;
    }

    .cta strong {
        color: #fbbf24;
    }
</style>
