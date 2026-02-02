<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { player } from "$lib/stores/player";

    // Components
    import HappyValleyCapture from "$lib/components/HappyValleyCapture.svelte";
    import VoxelClinic from "$lib/components/VoxelClinic.svelte";
    import ClinicalVictory from "$lib/components/ClinicalVictory.svelte";
    import LocalLeaderboard from "$lib/components/LocalLeaderboard.svelte";
    import SuburbanBossAlert from "$lib/components/SuburbanBossAlert.svelte";

    // Engine/Types (Simulation Mode)
    interface BossBattle {
        id: string;
        title: string;
        type: "invasive_invasion" | "disease_outbreak" | "climate_catastrophe";
        threatSpecies: string;
        targetPostcode: string;
        targetSuburbanReports: number;
        currentSuburbanReports: number;
        rewards: { xp: number; coins: number; badge: string };
        lore: { announcement: string; victory: string };
        expiresAt: Date;
    }

    // State
    let currentMode: "happy_valley" | "northern_shield" = "northern_shield";
    let currentView: "map" | "capture" | "clinic" | "victory" = "map";
    let showBossAlert = false;
    let activeBossEvent: BossBattle | null = null;
    let showLeaderboard = false;
    let selectedPet: any = null;
    let victoryDetails: any = null;

    $: ({ level, xp, preferredLens, displayName, currentStreak } = $player);

    const POSTCODE_STATS = {
        name: "Smithfield / Edmonton",
        readiness: 84,
        totalReports: 4280,
        growth: 12,
        rank: 2,
    };

    const SENTINELS = [
        { name: "Djari_Sentinel", xp: 14200, avatar: "🦎" },
        { name: "Ranger_Mia", xp: 12500, avatar: "🐯" },
        { name: "You", xp: 8400, avatar: "⚡", current: true },
        { name: "BugHunter_26", xp: 7200, avatar: "🐜" },
        { name: "Eco_Warrior", xp: 5100, avatar: "🌿" },
    ];

    onMount(() => {
        // Trigger a simulated boss alert after 5 seconds
        setTimeout(() => {
            triggerBossEvent();
        }, 5000);
    });

    function triggerBossEvent() {
        activeBossEvent = {
            id: "smithfield_siege_001",
            title: "THE SMITHFIELD SIEGE",
            type: "invasive_invasion",
            threatSpecies: "Red Imported Fire Ant",
            targetPostcode: "4879",
            targetSuburbanReports: 100,
            currentSuburbanReports: 87,
            rewards: { xp: 5000, coins: 1000, badge: "Defender" },
            lore: {
                announcement:
                    "🚨 URGENT: A massive fire ant super-colony has breached the Edmonton rail corridor. 87 reports in the last hour! Mobilize immediately!",
                victory:
                    "The colony has been neutralized! The rail corridor is safe once more.",
            },
            expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        } as unknown as BossBattle; // Temporary cast to bypass strict check if interface update is delayed
        showBossAlert = true;
    }

    function toggleMode() {
        currentMode =
            currentMode === "happy_valley" ? "northern_shield" : "happy_valley";
    }

    function handleDiscovery(event: any) {
        const discovery = event.detail;
        player.addCredits(discovery.credits);
        player.addXP(200);

        if (
            discovery.name.includes("Drake") ||
            discovery.name.includes("Ant")
        ) {
            selectedPet = {
                name: discovery.name.includes("Drake") ? "Dino" : "Barnaby",
                species: discovery.name.includes("Drake") ? "Dragon" : "Dog",
                breed: discovery.name.includes("Drake")
                    ? "FNQ Drake"
                    : "Fire Kelpie",
                temperament: discovery.name.includes("Drake")
                    ? "grumpy"
                    : "anxious",
                trustLevel: 30,
            };
            setTimeout(() => {
                currentView = "clinic";
            }, 1000);
        } else {
            currentView = "map";
        }
    }

    function handleClinicVictory(event: any) {
        const pet = event.detail.pet;
        player.completeConsultation(true, 1200, 500);
        victoryDetails = {
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            story: `You successfully treated ${pet.name} using AIVA empathy. Your sentinel rank has increased!`,
        };
        currentView = "victory";
    }

    function backToMap() {
        currentView = "map";
        selectedPet = null;
        victoryDetails = null;
    }
</script>

<svelte:head>
    <title>Quest Master | VetKingdom</title>
</svelte:head>

<div class="valley-vet-root {preferredLens}">
    <!-- Top HUD: Minimal & Premium -->
    <header class="page-hud glass-panel">
        <div class="hud-left">
            <h1 class="font-black text-2xl tracking-tighter">
                {preferredLens === "tactical"
                    ? "🎯 SENTINEL COMMAND"
                    : "⚔️ QUEST MASTER"}
            </h1>
            <div class="xp-mini-bar">
                <div class="bar-bg">
                    <div
                        class="bar-fill"
                        style="width: {(xp % 1000) / 10}%"
                    ></div>
                </div>
                <span
                    class="text-[10px] font-bold text-white/40 uppercase tracking-widest"
                >
                    {xp.toLocaleString()} / {(Math.floor(xp / 1000) + 1) * 1000}
                    XP
                </span>
            </div>
        </div>

        <div class="hud-center hidden md:flex gap-4">
            <div class="streak-pill">
                <span class="pulse-icon">🔥</span>
                <span>{currentStreak} DAY STREAK</span>
            </div>
            <div class="rank-pill">
                <span>RANK {Math.floor(level / 5) + 1}</span>
            </div>
        </div>

        <div class="hud-right flex gap-2">
            <button class="mode-btn {currentMode}" on:click={toggleMode}>
                {currentMode === "northern_shield"
                    ? "🛡️ Northern Shield"
                    : "🏥 Happy Valley"}
            </button>
            <button
                class="leaderboard-btn"
                on:click={() => (showLeaderboard = true)}>🏆</button
            >
        </div>
    </header>

    <main class="main-content">
        {#if currentView === "map"}
            <div class="map-layout" in:fade>
                <!-- Left: Postcode Dashboard -->
                <div class="side-panel">
                    <div class="dashboard-card glass-panel">
                        <p
                            class="text-[10px] font-black text-white/40 uppercase mb-2"
                        >
                            📍 {POSTCODE_STATS.name}
                        </p>
                        <h2 class="text-xl font-black mb-4">
                            Postcode Readiness
                        </h2>

                        <div class="readiness-meter mb-6">
                            <div
                                class="flex justify-between text-[10px] font-black mb-2"
                            >
                                <span>DEFENSE STATUS</span>
                                <span class="text-green-400"
                                    >{POSTCODE_STATS.readiness}%</span
                                >
                            </div>
                            <div class="meter-bg">
                                <div
                                    class="meter-fill"
                                    style="width: {POSTCODE_STATS.readiness}%"
                                ></div>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-2 mb-6">
                            <div class="stat-sq">
                                <strong
                                    >{POSTCODE_STATS.totalReports.toLocaleString()}</strong
                                >
                                <span>TOTAL REPORTS</span>
                            </div>
                            <div class="stat-sq">
                                <strong class="text-green-400"
                                    >+{POSTCODE_STATS.growth}%</strong
                                >
                                <span>SECTOR GROWTH</span>
                            </div>
                            <div class="stat-sq">
                                <strong>#{POSTCODE_STATS.rank}</strong>
                                <span>CAIRNS RANK</span>
                            </div>
                        </div>

                        <div
                            class="scourge-box border border-orange-500/30 bg-orange-500/5 rounded-xl p-4"
                        >
                            <div
                                class="flex justify-between text-[10px] font-bold mb-2"
                            >
                                <span class="text-orange-400"
                                    >⚔️ SMITHFIELD SCOURGE</span
                                >
                                <span>42 / 100 REPORTS</span>
                            </div>
                            <div
                                class="mini-bar bg-white/10 h-1.5 rounded-full overflow-hidden"
                            >
                                <div
                                    class="h-full bg-orange-500"
                                    style="width: 42%"
                                ></div>
                            </div>
                            <p class="text-[10px] text-white/40 mt-2">
                                Unlock the <span class="text-yellow-400"
                                    >"Ant Exterminator"</span
                                > badge for the whole suburb!
                            </p>
                        </div>
                    </div>

                    <div class="sentinel-card glass-panel mt-4">
                        <h3
                            class="text-[10px] font-black text-white/40 uppercase mb-4"
                        >
                            Top Sentinels
                        </h3>
                        <div class="sentinel-list">
                            {#each SENTINELS as s, i}
                                <div
                                    class="sentinel-item"
                                    class:current={s.current}
                                >
                                    <span class="rank">#{i + 1}</span>
                                    <span class="avatar">{s.avatar}</span>
                                    <span class="name">{s.name}</span>
                                    <span class="xp"
                                        >{s.xp.toLocaleString()} XP</span
                                    >
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>

                <!-- Center: Tactical Map -->
                <div class="map-view-hero">
                    <div class="tactical-map-container glass-panel">
                        <!-- Mock Map Background -->
                        <div
                            class="map-asset"
                            style="background-image: url('/assets/tactical_map.png')"
                        ></div>
                        <div class="map-scanner overlay"></div>
                        <div class="map-markers">
                            <!-- Tactical Markers -->
                            <div
                                class="t-marker alert"
                                style="top: 40%; left: 45%;"
                            >
                                <div class="t-label">OUTBREAK DETECTED</div>
                                <div class="t-icon">🔥</div>
                            </div>
                            <div
                                class="t-marker active"
                                style="top: 30%; left: 35%;"
                            >
                                <div class="t-label">HQ</div>
                                <div class="t-icon">🏥</div>
                            </div>
                        </div>

                        <div class="map-hud-overlay">
                            <div class="mode-info">
                                <h3>Northern Shield</h3>
                                <p>Professional biosecurity training mode</p>
                            </div>

                            <div class="legend-box glass-panel p-4">
                                <h4 class="text-[10px] font-black mb-3">
                                    CONTAINMENT ZONES
                                </h4>
                                <ul class="space-y-2 text-[10px] font-bold">
                                    <li class="flex items-center gap-2">
                                        <span
                                            class="w-2 h-2 rounded-full bg-red-600"
                                        ></span> Infected Premises (1km)
                                    </li>
                                    <li class="flex items-center gap-2">
                                        <span
                                            class="w-2 h-2 rounded-full bg-orange-500"
                                        ></span> Dangerous Contact (3km)
                                    </li>
                                    <li class="flex items-center gap-2">
                                        <span
                                            class="w-2 h-2 rounded-full bg-yellow-400"
                                        ></span> Restricted Area (10km)
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <button
                            class="big-scan-btn"
                            on:click={() => (currentView = "capture")}
                        >
                            <div class="btn-glow"></div>
                            <span class="icon">🔍</span>
                            <span>SCAN WORLD</span>
                        </button>
                    </div>
                </div>
            </div>
        {:else if currentView === "capture"}
            <HappyValleyCapture
                on:discovery={handleDiscovery}
                on:close={backToMap}
            />
        {:else if currentView === "clinic"}
            <VoxelClinic
                on:victory={handleClinicVictory}
                on:close={backToMap}
            />
        {:else if currentView === "victory"}
            <ClinicalVictory
                pet={victoryDetails}
                lensMode={preferredLens}
                on:close={backToMap}
            />
        {/if}
    </main>

    {#if showBossAlert && activeBossEvent}
        <SuburbanBossAlert
            event={activeBossEvent}
            on:close={() => (showBossAlert = false)}
            on:join={() => {
                showBossAlert = false;
                currentView = "capture";
            }}
        />
    {/if}

    <LocalLeaderboard isOpen={showLeaderboard} />
</div>

<style>
    .valley-vet-root {
        min-height: calc(100vh - 80px);
        background: #020617;
        color: white;
        display: flex;
        flex-direction: column;
        padding-top: 80px; /* Space for Nav */
    }

    .page-hud {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        margin: 1rem 2rem;
        border-radius: 1.5rem;
        z-index: 40;
    }

    .xp-mini-bar {
        width: 180px;
        margin-top: 0.5rem;
    }

    .bar-bg {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        margin-bottom: 2px;
        overflow: hidden;
    }
    .bar-fill {
        height: 100%;
        background: #3b82f6;
    }

    .streak-pill {
        background: linear-gradient(135deg, #f59e0b, #ef4444);
        padding: 0.4rem 1rem;
        border-radius: 2rem;
        font-size: 0.7rem;
        font-weight: 900;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .rank-pill {
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.4rem 1rem;
        border-radius: 2rem;
        font-size: 0.7rem;
        font-weight: 900;
    }

    .mode-btn {
        padding: 0.4rem 1rem;
        border-radius: 2rem;
        font-size: 0.7rem;
        font-weight: 900;
        transition: all 0.2s;
    }
    .mode-btn.northern_shield {
        background: #dc2626;
    }
    .mode-btn.happy_valley {
        background: #059669;
    }

    .main-content {
        flex: 1;
        padding: 0 2rem 2rem;
    }

    .map-layout {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 1.5rem;
        height: 100%;
    }

    .side-panel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .dashboard-card,
    .sentinel-card {
        padding: 1.5rem;
        border-radius: 2rem;
    }

    .stat-sq {
        background: rgba(255, 255, 255, 0.03);
        padding: 0.75rem;
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .stat-sq strong {
        font-size: 1.1rem;
        font-weight: 900;
    }
    .stat-sq span {
        font-size: 0.5rem;
        font-weight: 800;
        color: rgba(255, 255, 255, 0.3);
    }

    .meter-bg {
        height: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        overflow: hidden;
    }
    .meter-fill {
        height: 100%;
        background: #22c55e;
        box-shadow: 0 0 10px #22c55e;
    }

    .sentinel-item {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding: 0.75rem;
        border-radius: 1rem;
        font-size: 0.8rem;
        font-weight: 700;
        transition: all 0.2s;
    }
    .sentinel-item.current {
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .sentinel-item .rank {
        width: 24px;
        color: rgba(255, 255, 255, 0.3);
    }
    .sentinel-item .xp {
        margin-left: auto;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .map-view-hero {
        position: relative;
    }

    .tactical-map-container {
        height: 100%;
        border-radius: 3rem;
        position: relative;
        overflow: hidden;
        background: #000;
    }

    .map-asset {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0.6;
        filter: hue-rotate(200deg) brightness(0.8);
    }

    .map-scanner {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to bottom,
            transparent,
            rgba(59, 130, 246, 0.1),
            transparent
        );
        height: 20%;
        animation: scan-move 4s linear infinite;
    }

    @keyframes scan-move {
        0% {
            top: -20%;
        }
        100% {
            top: 120%;
        }
    }

    .t-marker {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .t-label {
        background: rgba(0, 0, 0, 0.8);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.5rem;
        font-weight: 950;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .t-icon {
        font-size: 1.5rem;
    }
    .t-marker.alert .t-label {
        color: #f87171;
        border-color: #f87171;
    }
    .t-marker.alert .t-icon {
        animation: marker-alert 1s infinite alternate;
    }

    @keyframes marker-alert {
        from {
            transform: scale(1);
        }
        to {
            transform: scale(1.2);
        }
    }

    .map-hud-overlay {
        position: absolute;
        top: 2rem;
        left: 2rem;
        right: 2rem;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
    }
    .map-hud-overlay > * {
        pointer-events: auto;
    }

    .mode-info h3 {
        font-size: 1.5rem;
        font-weight: 950;
    }
    .mode-info p {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.4);
        font-weight: 700;
    }

    .big-scan-btn {
        position: absolute;
        bottom: 3rem;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        color: black;
        padding: 1.5rem 4rem;
        border-radius: 10rem;
        border: none;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        font-weight: 950;
        font-size: 1.5rem;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .big-scan-btn:hover {
        transform: translateX(-50%) translateY(-5px);
    }
    .big-scan-btn:active {
        transform: translateX(-50%) scale(0.95);
    }

    .btn-glow {
        position: absolute;
        inset: -10px;
        border-radius: 10rem;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        filter: blur(20px);
        opacity: 0.5;
        z-index: -1;
        animation: glow-pulse 2s infinite;
    }

    @keyframes glow-pulse {
        0% {
            opacity: 0.3;
        }
        50% {
            opacity: 0.6;
        }
        100% {
            opacity: 0.3;
        }
    }
</style>
