<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        ValleyVetEngine,
        createDemoScenario,
        MAP_MODES,
        type ZoonoticRiskProfile,
        type MapMode,
        type GameLens,
        type BossBattle,
    } from "$lib/geospatial/valleyvet-engine";
    import QuestCapture from "$lib/components/QuestCapture.svelte";
    import MolecularBridge from "$lib/components/MolecularBridge.svelte";
    import ClinicalVictory from "$lib/components/ClinicalVictory.svelte";
    import MobileCaptureLite from "$lib/components/MobileCaptureLite.svelte";
    import LocalLeaderboard from "$lib/components/LocalLeaderboard.svelte";
    import HappyValleyCapture from "$lib/components/HappyValleyCapture.svelte";
    import VoxelClinic from "$lib/components/VoxelClinic.svelte";
    import SuburbanBossAlert from "$lib/components/SuburbanBossAlert.svelte";
    import StewardshipStory from "$lib/components/StewardshipStory.svelte";
    import type { Story } from "$lib/types";

    // State
    let engine: ValleyVetEngine | null = null;
    let currentMode: "happy_valley" | "northern_shield" = "northern_shield";
    let currentLens: GameLens = "adventure";
    let isLoading = true;
    let error: string | null = null;
    let userLocation: { lat: number; lng: number } | null = null;

    // Viral State
    let showLeaderboard = false;
    let currentXP = 8400;
    let xpLimit = 10000;
    let dailyStreak = 5;

    // Alert state
    let showZoonoticAlert = false;
    let alertProfile: ZoonoticRiskProfile | null = null;

    // Outbreak info state
    let showOutbreakInfo = false;
    let selectedOutbreak: BossBattle | null = null;

    // Suburban Boss Battle State
    let showBossAlert = false;
    let activeBossEvent: BossBattle | null = null;

    // Custodianship Layer (Feature Flag)
    let showStories = false;
    let showStoryModal = false;
    let activeStory: Story | null = null;

    // Molecular Bridge State
    let showMolecularBridge = false;
    let activeDiscoveryForSampling: any = null;

    // Clinical Victory State (Viral Loop)
    let showClinicalVictory = false;
    let activePetForVictory: any = null;

    // Voxel Clinic State (Short Loop)
    let showVoxelClinic = false;
    let activePetForClinic: any = null;

    // API config
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    onMount(async () => {
        // Initialize, even if key is missing (Engine handles mock mode)
        /*
        if (!apiKey) {
            error = "Google Maps API key not configured. Add VITE_GOOGLE_MAPS_API_KEY to .env";
            isLoading = false;
            return;
        }
        */

        try {
            engine = new ValleyVetEngine(apiKey);

            // Set up callbacks
            engine.onZoonoticAlert = (profile) => {
                alertProfile = profile;
                showZoonoticAlert = true;
            };

            engine.onOutbreakClick = (outbreak) => {
                selectedOutbreak = outbreak;
                showOutbreakInfo = true;
            };

            engine.onModeChange = (mode) => {
                console.log(`Mode changed to: ${mode.name}`);
            };

            engine.onBossEventTriggered = (event) => {
                activeBossEvent = event;
                showBossAlert = true;
            };

            // Initialize map
            await engine.initialize("valley-vet-map", currentMode);

            // Load demo scenario
            createDemoScenario(engine);

            // Start the "Suburban Notification Logic" simulation
            startBossBattleSimulation();

            isLoading = false;
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to initialize map";
            isLoading = false;
            // FALLBACK TO DEMO MODE IF MAP FAILS
            console.warn("⚠️ Map failed to load, starting Viral Demo Mode anyway...");
            startBossBattleSimulation();
        }
    });

    onDestroy(() => {
        engine?.destroy();
    });

    function startBossBattleSimulation() {
        console.log("🔄 Starting Community Activity Simulation...");
        // Simulate a growing threat in 4879
        setTimeout(() => {
            // First hint
            console.log(
                "⚠️ Increased Fire Ant reports detected in Smithfield...",
            );
        }, 2000);

        setTimeout(() => {
            // Trigger the Boss Battle Event automatically (The Viral Hook)
            triggerBossTest();
        }, 5000);
    }

    function toggleMode() {
        currentMode =
            currentMode === "happy_valley" ? "northern_shield" : "happy_valley";
        engine?.setMode(currentMode);
    }

    function testZoonoticAlert() {
        engine?.triggerZoonoticAlert("hendra");
    }

    function closeAlert() {
        showZoonoticAlert = false;
        alertProfile = null;
    }

    function closeOutbreakInfo() {
        showOutbreakInfo = false;
        selectedOutbreak = null;
    }

    function triggerBossTest() {
        if (!engine) return;

        // Play alert sound if available (handled by component on mount)

        const testBoss: BossBattle = {
            id: "smithfield_siege_001",
            title: "THE SMITHFIELD SIEGE",
            type: "invasive_invasion",
            threatSpecies: "Red Imported Fire Ant",
            targetPostcode: "4879",
            targetSuburbanReports: 100,
            currentSuburbanReports: 87, // High enough to be critical
            rewards: { xp: 5000, coins: 1000, badge: "Smithfield Guardian" },
            expiresAt: new Date(Date.now() + 86400000),
            lore: {
                announcement:
                    "🚨 URGENT: A massive fire ant super-colony has breached the Edmonton rail corridor. 87 reports in the last hour! Mobilize immediately!",
                victory: "The siege is broken! Smithfield is safe once more.",
            },
        };
        };
        
        if (engine && engine.triggerSuburbanBossEvent) {
            engine.triggerSuburbanBossEvent(testBoss);
        } else {
            // Fallback for Map-less Demo Mode
            console.warn("⚠️ Mocking Boss Trigger (No Engine)");
            activeBossEvent = testBoss;
            showBossAlert = true;
        }
    }

    function handleDiscoverySubmission(discovery: any) {
        console.log("New discovery:", discovery);

        // Instant XP Reward for the viral loop
        currentXP += discovery.xp || 500;
        if (currentXP >= xpLimit) {
            currentXP -= xpLimit;
            xpLimit += 5000; // Level Up threshold
        }

        // Happy Valley Loop: If capturing a "Hero" target, go to Clinic
        if (
            currentLens === "cozy" &&
            (discovery.id?.includes("sentinel") ||
                discovery.name?.includes("Drake"))
        ) {
            activePetForClinic = {
                id: discovery.id,
                name: discovery.name === "Lurking Drake" ? "Dino" : "Barnaby",
                species: discovery.name === "Lurking Drake" ? "Dragon" : "Dog",
                breed:
                    discovery.name === "Lurking Drake"
                        ? "FNQ Drake"
                        : "Highland Terrier",
                temperament: "anxious",
                trustLevel: 30,
                healthStatus: "distressed",
                currentMood: "scared",
            };
            setTimeout(() => {
                showVoxelClinic = true;
            }, 3000);
            return;
        }

        // If it's a critical threat, initiate Molecular Science Bridge
        if (
            discovery.ai_classification?.risk_level === "CRITICAL" ||
            discovery.ai_classification?.risk_level === "HIGH"
        ) {
            activeDiscoveryForSampling = discovery;

            // Short delay to show discovery rewards first
            setTimeout(() => {
                showMolecularBridge = true;
            }, 2000);
        }

        // Custodianship Layer: Check for stories if stewardship is ON
        if (showStories && discovery.name) {
            checkForStewardshipStory(discovery);
        }
    }

    async function checkForStewardshipStory(discovery: any) {
        // Mock story loading logic
        const species = discovery.name.toLowerCase();
        let storyFile = "";

        if (species.includes("fire ant")) storyFile = "fnq_fire_ant";
        if (species.includes("drake") || species.includes("croc"))
            storyFile = "cape_york_croc";

        if (storyFile) {
            try {
                const response = await fetch(
                    `/src/lib/content/stories/${storyFile}.json`,
                );
                if (response.ok) {
                    activeStory = await response.json();
                    setTimeout(() => {
                        showStoryModal = true;
                    }, 4000); // Delay so it doesn't interrupt the capture flow immediately
                }
            } catch (e) {
                console.error("Failed to load story:", e);
            }
        }
    }

    function handleClinicVictory(event: any) {
        showVoxelClinic = false;
        activePetForVictory = {
            name: event.detail.pet.name,
            species: event.detail.pet.species,
            breed: event.detail.pet.breed,
            story: `You successfully treated ${event.detail.pet.name} using the AIVA Empathy suite. Your clinic reputation is growing across Edmonton!`,
        };
        showClinicalVictory = true;
    }

    function handleBridgeClose(event: any) {
        showMolecularBridge = false;
        activeDiscoveryForSampling = null;
        if (event.detail?.certificationPoints) {
            console.log(
                `Earned ${event.detail.certificationPoints} Cert Points!`,
            );

            // Trigger Victory Screen for the Ranger's heroism
            activePetForVictory = {
                name: "The Tropical Sentinel",
                species: "Scientific Specimen",
                breed: "High-Risk Pathogen Sample",
                story: "By securing this forensic sample, you have provided the critical data needed to protect thousands of animals across the region. A job well done, Ranger!",
            };
            setTimeout(() => {
                showClinicalVictory = true;
            }, 800);
        }
    }

    function handleVictoryClose() {
        showClinicalVictory = false;
        activePetForVictory = null;
    }

    function triggerTestVictory() {
        activePetForVictory = {
            name: "Barnaby",
            species: "Dog",
            breed: "Golden Retriever",
            story: "Barnaby was found wandering near the Hendra risk zone. Thanks to your prompt action and the AIVA diagnostic suite, he's been cleared of all threats and is now back with his loving family!",
        };
        showClinicalVictory = true;
    }
</script>

<svelte:head>
    <title>Valley Vet | Geospatial Biosecurity Training</title>
</svelte:head>

<div class="valley-vet-container">
    <!-- Header (Hidden in Cozy Magic Mode) -->
    {#if currentLens !== "cozy"}
        <header class="header" transition:fade>
            <div class="header-left">
                <h1 class="logo">
                    {#if currentLens === "cozy"}
                        🐾 Bug Watch
                    {:else if currentLens === "adventure"}
                        ⚔️ Quest Master
                    {:else}
                        🎯 Sentinel Command
                    {/if}
                </h1>
                <div
                    class="xp-container"
                    on:click={() => (showLeaderboard = true)}
                >
                    <div class="xp-bar">
                        <div
                            class="xp-fill"
                            style="width: {(currentXP / xpLimit) * 100}%"
                        ></div>
                    </div>
                    <div class="xp-stats">
                        <span class="xp-label">
                            {currentXP.toLocaleString()} / {xpLimit.toLocaleString()}
                            XP
                        </span>
                        <span class="streak-badge"
                            >🔥 {dailyStreak} DAY STREAK</span
                        >
                        <span class="rank-tag">RANK 3</span>
                    </div>
                </div>
            </div>

            <div class="header-controls">
                <!-- Lens Switcher -->
                <div class="lens-switcher">
                    <button
                        class="lens-btn"
                        class:active={currentLens === "cozy"}
                        on:click={() => (currentLens = "cozy")}
                        title="Kid-friendly bug spotting"
                    >
                        🐾 Cozy
                    </button>
                    <button
                        class="lens-btn"
                        class:active={currentLens === "adventure"}
                        on:click={() => (currentLens = "adventure")}
                        title="Adventure exploration mode"
                    >
                        ⚔️ Adventure
                    </button>
                    <button
                        class="lens-btn"
                        class:active={currentLens === "tactical"}
                        on:click={() => (currentLens = "tactical")}
                        title="Professional biosecurity mode"
                    >
                        🎯 Tactical
                    </button>
                </div>

                <button
                    class="custodian-toggle"
                    class:active={showStories}
                    on:click={() => (showStories = !showStories)}
                    title="Toggle Custodianship Story Path"
                >
                    {showStories ? "🌿 Stewardship ON" : "🌿 Stewardship OFF"}
                </button>

                <button class="mode-toggle" on:click={toggleMode}>
                    Switch to {currentMode === "happy_valley"
                        ? "Northern Shield"
                        : "Happy Valley"}
                </button>
            </div>
        </header>
    {/if}

    <!-- Map Container -->
    <main class="map-wrapper">
        {#if isLoading}
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <p>Loading geospatial engine...</p>
            </div>
        {:else if error}
            <div class="error-overlay">
                <h2>⚠️ Configuration Error</h2>
                <p>{error}</p>
                <code>VITE_GOOGLE_MAPS_API_KEY=your_key_here</code>
            </div>
        {/if}

        <div id="valley-vet-map" class="map-container"></div>
    </main>

    <!-- Mode Info Panel -->
    <aside
        class="info-panel"
        class:northern-shield={currentMode === "northern_shield"}
    >
        <h3>{MAP_MODES[currentMode].name}</h3>
        <p>{MAP_MODES[currentMode].description}</p>

        {#if currentMode === "northern_shield"}
            <div class="legend">
                <h4>Containment Zones</h4>
                <div class="legend-item">
                    <span class="zone-color" style="background: #ff0000;"
                    ></span>
                    Infected Premises (1km)
                </div>
                <div class="legend-item">
                    <span class="zone-color" style="background: #ff8800;"
                    ></span>
                    Dangerous Contact (3km)
                </div>
                <div class="legend-item">
                    <span class="zone-color" style="background: #ffcc00;"
                    ></span>
                    Restricted Area (10km)
                </div>
                <div class="legend-item">
                    <span class="zone-color" style="background: #ffff88;"
                    ></span>
                    Control Area (50km)
                </div>
            </div>
        {/if}
    </aside>

    <!-- Zoonotic Alert Modal -->
    {#if showZoonoticAlert && alertProfile}
        <div
            class="alert-overlay"
            on:click={closeAlert}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === "Escape" && closeAlert()}
        >
            <div class="alert-modal" on:click|stopPropagation role="dialog">
                <div class="alert-header">
                    <span class="alert-icon">🚨</span>
                    <h2>ZOONOTIC EXPOSURE ALERT</h2>
                </div>

                <div class="alert-body">
                    <div class="disease-name">
                        {alertProfile.disease.toUpperCase()}
                    </div>
                    <div
                        class="risk-level risk-{alertProfile.transmission_risk.toLowerCase()}"
                    >
                        Risk Level: {alertProfile.transmission_risk}
                    </div>

                    <div class="exposure-routes">
                        <strong>Exposure Routes:</strong>
                        {alertProfile.exposure_route.join(", ")}
                    </div>

                    <div class="ppe-required">
                        <h4>PPE Required:</h4>
                        <ul>
                            {#if alertProfile.ppe_required.gloves}<li>
                                    ✓ Gloves
                                </li>{/if}
                            {#if alertProfile.ppe_required.mask}<li>
                                    ✓ Mask: {alertProfile.ppe_required.mask.toUpperCase()}
                                </li>{/if}
                            {#if alertProfile.ppe_required.gown}<li>
                                    ✓ Gown
                                </li>{/if}
                            {#if alertProfile.ppe_required.eye_protection}<li>
                                    ✓ Eye Protection
                                </li>{/if}
                        </ul>
                    </div>

                    <div class="actions-required">
                        <h4>Immediate Actions:</h4>
                        <ol>
                            {#each alertProfile.actions_required as action}
                                <li>{action}</li>
                            {/each}
                        </ol>
                    </div>

                    <div class="quarantine-info">
                        <strong>Quarantine Period:</strong>
                        {alertProfile.personal_protection
                            .quarantine_period_days} days
                    </div>
                </div>

                <div class="alert-footer">
                    <button class="acknowledge-btn" on:click={closeAlert}>
                        I Understand - Take Immediate Action
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Outbreak Info Modal -->
    {#if showOutbreakInfo && selectedOutbreak}
        <div
            class="outbreak-overlay"
            on:click={closeOutbreakInfo}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === "Escape" && closeOutbreakInfo()}
        >
            <div class="outbreak-modal" on:click|stopPropagation role="dialog">
                <h2>{selectedOutbreak.title || "Biosecurity Threat"}</h2>
                <div class="threat-species">
                    {selectedOutbreak.threatSpecies || "Unknown Species"}
                </div>

                <div class="outbreak-stats">
                    <div class="stat">
                        <span class="stat-value"
                            >{selectedOutbreak.currentSuburbanReports}</span
                        >
                        <span class="stat-label">Reports</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value"
                            >{selectedOutbreak.targetSuburbanReports}</span
                        >
                        <span class="stat-label">Target</span>
                    </div>
                </div>

                <div class="lore-text">
                    {selectedOutbreak.lore?.announcement || ""}
                </div>

                <button class="close-btn" on:click={closeOutbreakInfo}
                    >Close</button
                >
            </div>
        </div>
    {/if}

    {#if currentLens === "cozy"}
        <!-- EXCLUSIVE: Happy Valley Magic Capture Mode -->
        {#if showVoxelClinic && activePetForClinic}
            <VoxelClinic
                on:victory={handleClinicVictory}
                on:close={() => (showVoxelClinic = false)}
            />
        {:else}
            <HappyValleyCapture
                on:discovery={(e) => handleDiscoverySubmission(e.detail)}
            />
        {/if}
    {:else}
        <!-- Standard Discovery/Training UI -->
        <MobileCaptureLite
            {userLocation}
            currentLens={currentLens === "tactical" ? "tactical" : "adventure"}
            on:submit={(e) => handleDiscoverySubmission(e.detail)}
        />

        <!-- Social Proof Leaderboard -->
        <LocalLeaderboard isOpen={showLeaderboard} />

        <!-- Molecular Science Bridge Simulation -->
        {#if showMolecularBridge && activeDiscoveryForSampling}
            <MolecularBridge
                discovery={activeDiscoveryForSampling}
                lensMode={currentLens}
                on:close={handleBridgeClose}
            />
        {/if}

        <!-- Clinical Victory (Social Sharing Loop) -->
        {#if showClinicalVictory && activePetForVictory}
            <ClinicalVictory
                pet={activePetForVictory}
                lensMode={currentLens}
                on:close={handleVictoryClose}
            />
        {/if}

        <!-- Debug/Demo Controls -->
        <div class="demo-controls">
            <button on:click={triggerBossTest}>🔥 Trigger Boss</button>
            <button on:click={triggerTestVictory}>🏆 Test Victory</button>
            <button on:click={testZoonoticAlert}>⚠️ Test Alert</button>
        </div>
    {/if}

    <!-- Suburban Boss Notification -->
    {#if showBossAlert && activeBossEvent}
        <SuburbanBossAlert
            event={activeBossEvent}
            on:close={() => (showBossAlert = false)}
            on:join={() => {
                showBossAlert = false;
                currentLens = "adventure"; // Take them to map
                showLeaderboard = true; // Show them the progress
            }}
        />
    {/if}

    <!-- Stewardship (Custodianship Layer) Story -->
    {#if showStoryModal && activeStory}
        <StewardshipStory
            story={activeStory}
            on:close={() => {
                showStoryModal = false;
                activeStory = null;
            }}
        />
    {/if}
</div>

<style>
    .valley-vet-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
    }

    /* Header */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: white;
        z-index: 100;
    }

    .header-left {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .xp-container {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        cursor: pointer;
        width: 150px;
    }

    .xp-bar {
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        overflow: hidden;
    }

    .xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #fbbf24, #f59e0b);
        transition: width 0.3s ease;
    }

    .xp-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.65rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.7);
    }

    .rank-tag {
        color: #fbbf24;
    }

    .streak-badge {
        font-size: 0.65rem;
        font-weight: 800;
        color: white;
        background: linear-gradient(135deg, #f59e0b, #ef4444);
        padding: 0.2rem 0.6rem;
        border-radius: 50px;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
        animation: pulse-sm 2s infinite;
    }

    .custodian-toggle {
        background: transparent;
        color: #34d399;
        border: 2px solid #34d399;
        padding: 0.5rem 1rem;
        border-radius: 50px;
        font-weight: 800;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .custodian-toggle.active {
        background: #34d399;
        color: black;
    }

    @keyframes pulse-sm {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }

    .logo {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
    }

    .subtitle {
        font-size: 0.9rem;
        opacity: 0.7;
    }

    .header-controls {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
    }

    /* Lens Switcher */
    .lens-switcher {
        display: flex;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 4px;
        gap: 4px;
    }

    .lens-btn {
        padding: 0.5rem 0.75rem;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        transition: all 0.2s;
        white-space: nowrap;
    }

    .lens-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    .lens-btn.active {
        background: white;
        color: #1a1a2e;
    }

    .lens-btn.active:nth-child(1) {
        background: #ffeaa7;
        color: #333;
    } /* Cozy - warm yellow */
    .lens-btn.active:nth-child(2) {
        background: #d4a574;
        color: #2d1b0e;
    } /* Adventure - parchment */
    .lens-btn.active:nth-child(3) {
        background: #4a90d9;
        color: white;
    } /* Tactical - blue */

    .mode-toggle {
        padding: 0.5rem 1rem;
        border: 2px solid #4a90d9;
        background: transparent;
        color: #4a90d9;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
    }

    .mode-toggle:hover {
        background: #4a90d9;
        color: white;
    }

    .test-alert-btn {
        padding: 0.5rem 1rem;
        border: 2px solid #e74c3c;
        background: #e74c3c;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
    }

    .test-alert-btn:hover {
        background: #c0392b;
        border-color: #c0392b;
    }

    /* Map */
    .map-wrapper {
        flex: 1;
        position: relative;
    }

    .map-container {
        width: 100%;
        height: 100%;
    }

    .loading-overlay,
    .error-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(26, 26, 46, 0.95);
        color: white;
        z-index: 50;
    }

    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.2);
        border-top-color: #4a90d9;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-overlay code {
        background: rgba(0, 0, 0, 0.5);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        margin-top: 1rem;
    }

    /* Info Panel */
    .info-panel {
        position: absolute;
        bottom: 2rem;
        left: 2rem;
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 280px;
        z-index: 10;
    }

    .info-panel.northern-shield {
        background: #1a1a2e;
        color: white;
    }

    .info-panel h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.2rem;
    }

    .info-panel p {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
        opacity: 0.8;
    }

    .legend h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.85rem;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        margin-bottom: 0.3rem;
    }

    .zone-color {
        width: 16px;
        height: 16px;
        border-radius: 3px;
    }

    /* Alert Modal */
    .alert-overlay {
        position: fixed;
        inset: 0;
        background: rgba(200, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: flashRed 0.3s ease-out;
    }

    @keyframes flashRed {
        0% {
            background: rgba(255, 0, 0, 1);
        }
        100% {
            background: rgba(200, 0, 0, 0.9);
        }
    }

    .alert-modal {
        background: white;
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }

    .alert-header {
        background: #c0392b;
        color: white;
        padding: 1.5rem;
        text-align: center;
        border-radius: 16px 16px 0 0;
    }

    .alert-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 0.5rem;
    }

    .alert-header h2 {
        margin: 0;
        font-size: 1.3rem;
    }

    .alert-body {
        padding: 1.5rem;
        color: #333;
    }

    .disease-name {
        font-size: 2rem;
        font-weight: 700;
        color: #c0392b;
        text-align: center;
        margin-bottom: 1rem;
    }

    .risk-level {
        text-align: center;
        padding: 0.5rem;
        border-radius: 6px;
        font-weight: 600;
        margin-bottom: 1rem;
    }

    .risk-level.risk-critical {
        background: #c0392b;
        color: white;
    }

    .risk-level.risk-high {
        background: #e67e22;
        color: white;
    }

    .risk-level.risk-medium {
        background: #f1c40f;
        color: #333;
    }

    .alert-body h4 {
        margin: 1rem 0 0.5rem 0;
        color: #c0392b;
    }

    .alert-body ul,
    .alert-body ol {
        margin: 0;
        padding-left: 1.5rem;
    }

    .alert-body li {
        margin-bottom: 0.3rem;
    }

    .quarantine-info {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
        text-align: center;
    }

    .alert-footer {
        padding: 1.5rem;
        border-top: 1px solid #eee;
    }

    .acknowledge-btn {
        width: 100%;
        padding: 1rem;
        background: #c0392b;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }

    .acknowledge-btn:hover {
        background: #a93226;
    }

    /* Outbreak Modal */
    .outbreak-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 500;
    }

    .outbreak-modal {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        text-align: center;
    }

    .outbreak-modal h2 {
        margin: 0 0 1.5rem 0;
        color: #c0392b;
    }

    .outbreak-stats {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-bottom: 1.5rem;
    }

    .stat {
        display: flex;
        flex-direction: column;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #333;
    }

    .stat-label {
        font-size: 0.8rem;
        color: #666;
    }

    .movement-status {
        padding: 1rem;
        border-radius: 8px;
        font-weight: 600;
        margin-bottom: 1.5rem;
        background: #d4edda;
        color: #155724;
    }

    .movement-status.ban {
        background: #f8d7da;
        color: #721c24;
    }

    .close-btn {
        padding: 0.75rem 2rem;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
    }

    .close-btn:hover {
        background: #5a6268;
    }
    .demo-controls {
        position: fixed;
        bottom: 2rem;
        left: 2rem;
        display: flex;
        gap: 0.5rem;
        z-index: 100;
    }

    .demo-controls button {
        background: rgba(15, 23, 42, 0.8);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.8rem;
        cursor: pointer;
        backdrop-filter: blur(5px);
    }
</style>
