<script lang="ts">
    import { fly, fade } from "svelte/transition";

    // Mock data for neighborhood ranking
    const neighborhood = "Smithfield / Edmonton";
    const rankings = [
        {
            name: "Djari_Sentinel",
            score: 14200,
            avatar: "/assets/pet_dragon_pro.png",
            isUser: false,
            type: "image",
        },
        {
            name: "Ranger_Mia",
            score: 12500,
            avatar: "🦁",
            isUser: false,
            type: "emoji",
        },
        {
            name: "You",
            score: 8400,
            avatar: "/assets/dallas_avatar.jpg",
            isUser: true,
            type: "image",
        },
        {
            name: "BugHunter_26",
            score: 7200,
            avatar: "/assets/icon_fire_ant_pro.png",
            isUser: false,
            type: "image",
        },
        {
            name: "Eco_Warrior",
            score: 5100,
            avatar: "🌿",
            isUser: false,
            type: "emoji",
        },
    ];

    export let isOpen = false;
</script>

{#if isOpen}
    <div class="leaderboard-overlay" transition:fade>
        <div class="leaderboard-modal glass-panel" in:fly={{ y: 50 }}>
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
                    <div class="flex items-center gap-2">
                        <img
                            src="/assets/icon_fire_ant_pro.png"
                            class="w-6 h-6 pixelated"
                            alt="Ant"
                        />
                        <span class="battle-title">SMITHFIELD SCOURGE</span>
                    </div>
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
                        <div class="rank-avatar">
                            {#if rank.type === "image"}
                                <img
                                    src={rank.avatar}
                                    alt={rank.name}
                                    class="w-8 h-8 object-contain rounded-full"
                                />
                            {:else}
                                {rank.avatar}
                            {/if}
                        </div>
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
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000;
        backdrop-filter: blur(10px);
        padding: 1.5rem;
    }

    .glass-panel {
        background: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .leaderboard-modal {
        width: 100%;
        max-width: 400px;
        border-radius: 24px;
        overflow: hidden;
        color: white;
    }

    header {
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.02);
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .header-main {
        padding-right: 2rem;
    }

    .loc-tag {
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.4);
        display: block;
        margin-bottom: 0.25rem;
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 900;
        margin: 0;
        color: white;
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
        color: rgba(255, 255, 255, 0.5);
    }

    .gauge-header strong {
        color: #10b981;
        font-size: 1rem;
    }

    .gauge-track {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
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
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .sub-stat {
        padding: 1.25rem 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }

    .sub-stat:last-child {
        border-right: none;
    }

    .sub-stat .val {
        font-size: 1.1rem;
        font-weight: 950;
        color: white;
    }

    .sub-stat .val.up {
        color: #10b981;
    }

    .sub-stat .lab {
        font-size: 0.55rem;
        font-weight: 800;
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 0.05em;
    }

    .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        font-size: 1.2rem;
        cursor: pointer;
        transition: color 0.2s;
    }
    .close-btn:hover {
        color: white;
    }

    .community-boss-battle {
        padding: 1.5rem;
        background: linear-gradient(
            180deg,
            rgba(245, 158, 11, 0.1) 0%,
            transparent 100%
        );
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
        color: rgba(255, 255, 255, 0.8);
    }

    .battle-progress {
        height: 12px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #f59e0b, #ef4444);
        border-radius: 6px;
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
    }

    .battle-hint {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
    }

    .battle-hint strong {
        color: #fbbf24;
    }

    .list-header {
        font-size: 0.65rem;
        font-weight: 900;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.4);
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
        background: rgba(255, 255, 255, 0.03);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .rank-item.is-user {
        background: rgba(251, 191, 36, 0.1);
        border-color: #fbbf24;
    }

    .rank-num {
        font-weight: 900;
        width: 30px;
        color: rgba(255, 255, 255, 0.3);
    }

    .rank-item.is-user .rank-num {
        color: #fbbf24;
    }

    .rank-avatar {
        font-size: 1.5rem;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .pixelated {
        image-rendering: pixelated;
    }

    .rank-info {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    .name {
        font-weight: 700;
        color: white;
    }
    .points {
        font-size: 0.8rem;
        opacity: 0.5;
        font-family: monospace;
        color: rgba(255, 255, 255, 0.8);
    }

    .cta {
        padding: 1.5rem;
        background: rgba(0, 0, 0, 0.3);
        text-align: center;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .cta strong {
        color: #fbbf24;
    }
</style>
