<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { player } from "$lib/stores/player";

    // Components
    import HappyValleyCapture from "$lib/components/HappyValleyCapture.svelte";
    import VoxelClinic from "$lib/components/VoxelClinic.svelte";
    import ClinicalVictory from "$lib/components/ClinicalVictory.svelte";
    import LocalLeaderboard from "$lib/components/LocalLeaderboard.svelte";
    import MathmanProjection from "$lib/components/MathmanProjection.svelte";

    // Game State
    type View = "lobby" | "map" | "capture" | "clinic" | "victory" | "mathman";
    let currentView: View = "lobby";

    // Data Persistence for the Demo
    let selectedPet: any = null;
    let victoryDetails: any = null;
    let showLeaderboard = false;

    $: ({ level, xp, happyValleyCredits, preferredLens, displayName } =
        $player);

    const LENS_AVATARS = {
        cozy: "/assets/dallas_avatar.jpg",
        adventure: "/assets/dallas_avatar.jpg",
        tactical: "/assets/dallas_avatar.jpg",
    };

    const EMPIRE_STATS = {
        clinics: 3,
        clients: 3,
        totalRevenue: 282000,
    };

    const ACTIVE_CLINIC = {
        name: "Happy Valley Veterinary Hospital",
        address: "123 Main St, Cairns QLD 4870",
        vets: 4,
        patients: 342,
        monthlyRevenue: 125000,
        satisfaction: 4.8,
        specialty: "General Practice",
    };

    const OUTBREAK_FEED = [
        {
            loc: "Smithfield",
            type: "🔥 Fire Ant Sighting",
            time: "2m ago",
            risk: "HIGH",
        },
        {
            loc: "Edmonton",
            type: "⚡ High Parasite Load",
            time: "15m ago",
            risk: "MED",
        },
        {
            loc: "Redlynch",
            type: "🦠 Hendra Risk High",
            time: "1h ago",
            risk: "CRITICAL",
        },
    ];

    function startCapture() {
        currentView = "capture";
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
            currentView = "lobby";
        }
    }

    function handleClinicVictory(event: any) {
        const pet = event.detail.pet;
        player.completeConsultation(true, 1200, 500);
        victoryDetails = {
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            story: `You successfully treated ${pet.name} using AIVA empathy. Your empire grows!`,
        };
        currentView = "victory";
    }

    function handleVictoryClose() {
        currentView = "lobby";
        victoryDetails = null;
    }

    function backToLobby() {
        currentView = "lobby";
    }

    function formattedCurrency(val: number) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(val);
    }
</script>

<svelte:head>
    <title>Management Dashboard | Happy Valley</title>
</svelte:head>

<div class="game-container {preferredLens}">
    {#if currentView === "lobby"}
        <!-- HIGH-INTENSITY MANAGEMENT DASHBOARD -->
        <div class="lobby-view" in:fade>
            <!-- Empire Header -->
            <header class="empire-header glass-panel">
                <div class="branding">
                    <div class="clinic-icon"></div>
                    <div>
                        <h1 class="text-2xl font-black tracking-tighter">
                            Happy Valley Vet Kingdom
                        </h1>
                        <p class="text-xs font-bold text-white/40">
                            Manage your veterinary empire
                        </p>
                    </div>
                </div>

                <div class="global-stats">
                    <div class="stat-pill blue">
                        <span class="val">{EMPIRE_STATS.clinics}</span>
                        <span class="lab">CLINICS</span>
                    </div>
                    <div class="stat-pill purple">
                        <span class="val">{EMPIRE_STATS.clients}</span>
                        <span class="lab">CLIENTS</span>
                    </div>
                    <div class="stat-pill gold">
                        <span class="val"
                            >${Math.floor(
                                EMPIRE_STATS.totalRevenue / 1000,
                            )}K</span
                        >
                        <span class="lab">REVENUE</span>
                    </div>
                </div>
            </header>

            <main class="dashboard-grid">
                <!-- Left: Clinic Command Center -->
                <section class="command-center glass-panel">
                    <div class="clinic-hero">
                        <div class="clinic-id">
                            <div class="clinic-icon"></div>
                            <div>
                                <h2 class="text-3xl font-black">
                                    {ACTIVE_CLINIC.name}
                                </h2>
                                <p class="text-sm text-white/40">
                                    {ACTIVE_CLINIC.address}
                                </p>
                            </div>
                        </div>
                        <button
                            class="map-btn"
                            on:click={() => (currentView = "map")}
                            >← Back to Map</button
                        >
                    </div>

                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="m-icon icon-vet"></div>
                            <div class="m-content">
                                <span class="m-label">VETERINARIANS</span>
                                <span class="m-value">{ACTIVE_CLINIC.vets}</span
                                >
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="m-icon icon-calendar"></div>
                            <div class="m-content">
                                <span class="m-label">ACTIVE PATIENTS</span>
                                <span class="m-value"
                                    >{ACTIVE_CLINIC.patients}</span
                                >
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="m-icon icon-revenue"></div>
                            <div class="m-content">
                                <span class="m-label">MONTHLY REVENUE</span>
                                <span class="m-value"
                                    >${Math.floor(
                                        ACTIVE_CLINIC.monthlyRevenue / 1000,
                                    )}K</span
                                >
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="m-icon icon-heart"></div>
                            <div class="m-content">
                                <span class="m-label">SATISFACTION</span>
                                <span class="m-value"
                                    >{ACTIVE_CLINIC.satisfaction}/5.0</span
                                >
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="m-icon icon-medkit"></div>
                            <div class="m-content">
                                <span class="m-label">SPECIALTY</span>
                                <span class="m-value"
                                    >{ACTIVE_CLINIC.specialty}</span
                                >
                            </div>
                        </div>
                    </div>

                    <div class="action-footer">
                        <button
                            class="footer-btn schedule"
                            on:click={startCapture}>📅 View Schedule</button
                        >
                        <button class="footer-btn analytics">📊</button>
                        <button class="footer-btn settings">⚙️</button>
                    </div>
                </section>

                <!-- Right: Operations & Outbreaks -->
                <aside class="ops-sidebar">
                    <div class="avatar-card glass-panel">
                        <div class="avatar-wrap">
                            <img
                                src={LENS_AVATARS[preferredLens]}
                                alt="Avatar"
                                class="v-avatar"
                            />
                            <div class="v-glow {preferredLens}"></div>
                        </div>
                        <div class="v-info">
                            <h3 class="font-black">
                                DR. {displayName.toUpperCase()}
                            </h3>
                            <p
                                class="text-[10px] font-bold text-white/40 uppercase tracking-widest"
                            >
                                Master Surgeon • LVL {level}
                            </p>
                        </div>
                    </div>

                    <div class="outbreak-card glass-panel">
                        <h4 class="section-tag">LIVE OPERATIONS</h4>
                        <div class="feed-list">
                            {#each OUTBREAK_FEED as item}
                                <div
                                    class="feed-item {item.risk.toLowerCase()}"
                                >
                                    <div class="risk-dot"></div>
                                    <div class="flex-1">
                                        <div
                                            class="flex justify-between items-center"
                                        >
                                            <span class="text-xs font-black"
                                                >{item.type}</span
                                            >
                                            <span
                                                class="text-[9px] font-bold opacity-40"
                                                >{item.time}</span
                                            >
                                        </div>
                                        <p
                                            class="text-[10px] font-bold opacity-60"
                                        >
                                            {item.loc}
                                        </p>
                                    </div>
                                </div>
                            {/each}
                        </div>
                        <button
                            class="scan-world-btn {preferredLens}"
                            on:click={startCapture}
                        >
                            <div class="btn-inner">
                                <span class="icon">🔍</span>
                                <strong>SCAN WORLD</strong>
                            </div>
                        </button>
                    </div>

                    <div class="quick-links glass-panel">
                        <button
                            class="q-link"
                            on:click={() => (currentView = "mathman")}
                            >📐 Mathman Projection</button
                        >
                        <button
                            class="q-link"
                            on:click={() => (showLeaderboard = true)}
                            >🏆 Leaderboard</button
                        >
                    </div>
                </aside>
            </main>
        </div>
    {:else if currentView === "map"}
        <!-- ENHANCED TACTICAL MAP -->
        <div class="map-view-container" in:fade>
            <header class="map-header glass-panel">
                <button class="back-btn" on:click={backToLobby}
                    >← Return to HQ</button
                >
                <div class="map-title">
                    <h2 class="font-black text-xl tracking-tighter">
                        FNQ SECTOR MAP: 4869-4879
                    </h2>
                    <p class="text-[10px] font-black opacity-40 uppercase">
                        Hyper-Local Biosecurity Grid
                    </p>
                </div>
                <div class="map-stats">
                    <span class="text-red-500 font-black"
                        >12 ACTIVE THREATS</span
                    >
                </div>
            </header>

            <div class="map-canvas-wrap">
                <div
                    class="map-layers"
                    style="background-image: url('/assets/tactical_map.png')"
                >
                    <!-- Markers -->
                    <div class="map-marker hq" style="top: 30%; left: 40%;">
                        <div class="m-pop">HAPPY VALLEY HQ</div>
                        <img
                            src="/assets/icon_clinic.png"
                            class="w-8 h-8 pixelated"
                            alt="Clinic"
                        />
                    </div>
                    <div
                        class="map-marker threat pulse"
                        style="top: 50%; left: 60%;"
                    >
                        <div class="m-pop">FIRE ANT OUTBREAK</div>
                        <img
                            src="/assets/icon_fire_ant_pro.png"
                            class="w-8 h-8 pixelated"
                            alt="Ant"
                        />
                    </div>
                </div>
                <div class="scan-line"></div>
            </div>

            <footer class="map-footer glass-panel">
                <div class="footer-stats">
                    <div class="f-stat">
                        <span class="label">REWARD MULTIPLIER</span><span
                            class="val text-green-400">2.5x</span
                        >
                    </div>
                    <div class="f-stat">
                        <span class="label">ACTIVE SENTINELS</span><span
                            class="val">142</span
                        >
                    </div>
                </div>
                <button
                    class="engage-btn {preferredLens}"
                    on:click={startCapture}>INITIATE SCAN</button
                >
            </footer>
        </div>
    {:else if currentView === "capture"}
        <HappyValleyCapture
            on:discovery={handleDiscovery}
            on:close={backToLobby}
        />
    {:else if currentView === "clinic"}
        <VoxelClinic on:victory={handleClinicVictory} on:close={backToLobby} />
    {:else if currentView === "victory"}
        <ClinicalVictory
            pet={victoryDetails}
            lensMode={preferredLens}
            on:close={handleVictoryClose}
        />
    {:else if currentView === "mathman"}
        <div class="mathman-frame" in:fade>
            <MathmanProjection />
            <div class="mathman-controls">
                <button class="back-btn" on:click={backToLobby}
                    >← Exit Geometric Plane</button
                >
            </div>
        </div>
    {/if}

    <LocalLeaderboard isOpen={showLeaderboard} />
</div>

<style>
    .game-container {
        min-height: calc(100vh - 80px);
        background: #0d1117;
        color: white;
        transition: all 0.5s ease;
        overflow-x: hidden;
        padding-top: 20px;
    }

    .glass-panel {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    /* Lobby View */
    .lobby-view {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 2rem 4rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .empire-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 2.5rem;
        border-radius: 2rem;
    }

    .branding {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .app-icon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-radius: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }

    .global-stats {
        display: flex;
        gap: 1rem;
    }

    .stat-pill {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100px;
        padding: 0.75rem;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.05);
    }

    .stat-pill .val {
        font-size: 1.5rem;
        font-weight: 950;
    }
    .stat-pill .lab {
        font-size: 0.6rem;
        font-weight: 900;
        opacity: 0.4;
        letter-spacing: 0.1em;
    }

    .stat-pill.blue {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
    }
    .stat-pill.purple {
        background: rgba(139, 92, 246, 0.2);
        color: #a78bfa;
    }
    .stat-pill.gold {
        background: rgba(234, 179, 8, 0.2);
        color: #facc15;
    }

    .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 2rem;
    }

    .command-center {
        padding: 3rem;
        border-radius: 3rem;
        display: flex;
        flex-direction: column;
        gap: 3rem;
    }

    .clinic-hero {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .clinic-id {
        display: flex;
        gap: 2rem;
        align-items: center;
    }

    .clinic-icon {
        font-size: 3rem;
    }

    .map-btn {
        background: rgba(255, 255, 255, 0.05);
        padding: 0.6rem 1.2rem;
        border-radius: 0.75rem;
        font-size: 0.8rem;
        font-weight: 800;
        border: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
    }

    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
    }

    .metric-card {
        background: rgba(255, 255, 255, 0.03);
        padding: 1.5rem;
        border-radius: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.25rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .m-icon {
        font-size: 2rem;
    }
    .m-label {
        display: block;
        font-size: 0.6rem;
        font-weight: 900;
        opacity: 0.4;
        margin-bottom: 0.25rem;
    }
    .metric-card {
        background: rgba(0, 0, 0, 0.2);
        padding: 2rem;
        border-radius: 2rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition:
            transform 0.2s,
            background 0.2s;
    }

    .metric-card:hover {
        transform: scale(1.05);
        background: rgba(255, 255, 255, 0.05);
    }

    .m-icon {
        width: 80px;
        height: 80px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        image-rendering: auto; /* High res source */
        border-radius: 1rem;
        background-color: #111827; /* Match icon background for seamless feel */
    }

    .icon-vet {
        background-image: url("/assets/icon_vet.png");
    }
    .icon-calendar {
        background-image: url("/assets/icon_calendar.png");
    }
    .icon-revenue {
        background-image: url("/assets/icon_revenue.png");
    }
    .icon-heart {
        background-image: url("/assets/icon_heart.png");
    }
    .icon-medkit {
        background-image: url("/assets/icon_medkit.png");
    }

    .clinic-icon {
        width: 60px;
        height: 60px;
        background-image: url("/assets/icon_staff_asclepius.png");
        background-size: 70%;
        background-repeat: no-repeat;
        background-position: center;
        background-color: #111827;
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .m-label {
        display: block;
        font-size: 0.65rem;
        font-weight: 900;
        opacity: 0.4;
        margin-bottom: 0.5rem;
        letter-spacing: 0.1em;
    }
    .m-value {
        font-size: 1.5rem;
        font-weight: 950;
    }

    .action-footer {
        display: flex;
        gap: 1.5rem;
        margin-top: auto;
    }

    .footer-btn {
        padding: 1.75rem;
        border-radius: 1.5rem;
        border: none;
        color: white;
        font-weight: 950;
        cursor: pointer;
        transition: all 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .footer-btn.schedule {
        flex: 1;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        font-size: 1.25rem;
        box-shadow: 0 20px 40px rgba(79, 70, 229, 0.3);
    }

    .footer-btn.analytics,
    .footer-btn.settings {
        width: 80px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 1.5rem;
    }

    .footer-btn:hover {
        transform: translateY(-5px);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
    }

    /* Sidebar */
    .ops-sidebar {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .avatar-card {
        padding: 2rem;
        border-radius: 2.5rem;
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    .avatar-wrap {
        position: relative;
        width: 100px;
        height: 100px;
    }

    .pixelated {
        image-rendering: pixelated;
    }

    .v-avatar {
        width: 100%;
        height: 100%;
        object-fit: contain;
        position: relative;
        z-index: 2;
        filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
    }

    .v-glow {
        position: absolute;
        inset: 0;
        filter: blur(30px);
        opacity: 0.4;
        border-radius: 50%;
    }
    .v-glow.cozy {
        background: #10b981;
    }
    .v-glow.adventure {
        background: #f59e0b;
    }
    .v-glow.tactical {
        background: #3b82f6;
    }

    .outbreak-card {
        padding: 2rem;
        border-radius: 3rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .section-tag {
        font-size: 0.65rem;
        font-weight: 950;
        opacity: 0.4;
        letter-spacing: 0.3rem;
        margin-bottom: 0.5rem;
    }

    .feed-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .feed-item {
        background: rgba(0, 0, 0, 0.2);
        padding: 1.25rem;
        border-radius: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        border-left: 4px solid transparent;
        transition: background 0.2s;
    }

    .feed-item:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    .risk-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }
    .feed-item.high {
        border-left-color: #f59e0b;
    }
    .feed-item.high .risk-dot {
        background: #f59e0b;
        box-shadow: 0 0 15px #f59e0b;
    }
    .feed-item.critical {
        border-left-color: #ef4444;
    }
    .feed-item.critical .risk-dot {
        background: #ef4444;
        box-shadow: 0 0 15px #ef4444;
    }
    .feed-item.med {
        border-left-color: #3b82f6;
    }
    .feed-item.med .risk-dot {
        background: #3b82f6;
        box-shadow: 0 0 15px #3b82f6;
    }

    .scan-world-btn {
        margin-top: auto;
        padding: 4px;
        border-radius: 10rem;
        background: linear-gradient(135deg, #f59e0b, #eb4034);
        border: none;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .scan-world-btn:hover {
        transform: scale(1.02);
    }

    .scan-world-btn.tactical {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
    }

    .btn-inner {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10rem;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: white;
    }

    .quick-links {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-radius: 1.5rem;
    }

    .q-link {
        flex: 1;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: white;
        font-weight: 700;
        font-size: 0.8rem;
        border-radius: 1rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .q-link:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    /* Map View */
    .map-view-container {
        height: 100vh;
        background: #000;
        position: fixed;
        inset: 0;
        z-index: 50;
        color: white;
        display: flex;
        flex-direction: column;
    }

    .map-header {
        position: absolute;
        top: 2rem;
        left: 2rem;
        right: 2rem;
        z-index: 10;
        padding: 1.5rem;
        border-radius: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .back-btn {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.75rem;
        font-weight: 700;
        cursor: pointer;
    }

    .map-canvas-wrap {
        flex: 1;
        position: relative;
        overflow: hidden;
    }

    .map-layers {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        position: relative;
    }

    .map-marker {
        position: absolute;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .m-dot {
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 20px #3b82f6;
    }

    .threat .m-dot {
        background: #ef4444;
        box-shadow: 0 0 20px #ef4444;
    }

    .m-pop {
        background: rgba(0, 0, 0, 0.8);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.75rem;
        font-weight: 800;
        white-space: nowrap;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s;
    }

    .map-marker:hover .m-pop {
        opacity: 1;
        transform: translateY(0);
    }

    .pulse {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% {
            transform: translate(-50%, -50%) scale(1);
        }
        50% {
            transform: translate(-50%, -50%) scale(1.1);
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
        }
    }

    .scan-line {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: rgba(59, 130, 246, 0.5);
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        animation: scan 3s linear infinite;
        pointer-events: none;
    }

    @keyframes scan {
        0% {
            top: 0;
        }
        100% {
            top: 100%;
        }
    }

    .map-footer {
        height: 100px;
        padding: 0 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(0, 0, 0, 0.8);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .footer-stats {
        display: flex;
        gap: 3rem;
    }

    .f-stat {
        display: flex;
        flex-direction: column;
    }

    .f-stat .label {
        font-size: 0.65rem;
        font-weight: 800;
        opacity: 0.5;
        letter-spacing: 0.1em;
    }

    .f-stat .val {
        font-size: 1.5rem;
        font-weight: 950;
    }

    .engage-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 1rem 3rem;
        font-size: 1rem;
        font-weight: 900;
        letter-spacing: 0.1em;
        border-radius: 0.75rem;
        cursor: pointer;
        box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
        transition: transform 0.2s;
    }

    .engage-btn:hover {
        transform: scale(1.05);
    }

    /* Mathman */
    .mathman-frame {
        height: calc(100vh - 100px);
        background: #000;
        position: relative;
        border-radius: 3rem;
        overflow: hidden;
    }

    .mathman-controls {
        position: absolute;
        bottom: 2rem;
        left: 2rem;
        right: 2rem;
        display: flex;
        justify-content: center;
        pointer-events: none;
    }

    .mathman-controls button {
        pointer-events: auto;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 1rem 2rem;
        border-radius: 1rem;
        font-weight: 700;
        cursor: pointer;
    }
</style>
