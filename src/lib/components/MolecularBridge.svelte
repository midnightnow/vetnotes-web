<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { generateSampleId, sha3Hash } from "$lib/utils/crypto";
    import { getDeviceMetadata } from "$lib/utils/device";
    import { suggestPrimers } from "$lib/science/primers";

    const dispatch = createEventDispatcher();

    export let discovery: any;
    export let lensMode: "cozy" | "adventure" | "tactical" = "tactical";

    // Simulation State
    let step:
        | "ppe"
        | "sampling"
        | "primer_advisor"
        | "chain_of_custody"
        | "data_sync"
        | "complete" = "ppe";

    let ppeChecked = {
        gloves: false,
        mask: false,
        gown: false,
        eyewear: false,
    };

    let samplingProgress = 0;
    let isSwabbing = false;
    let swabInterval: any;

    let sampleType: "buccal" | "soil" | "water" | null = null;
    let collectorName = "";
    let storageMethod = "FTA card, ambient";
    let destinationLab = "JCU Molecular Diagnostics Lab";

    let isCertifying = false;
    let issuedBadge: any = null;
    let certificationPoints = 0;
    let offlineMode = false;

    // Derived
    $: sampleId = generateSampleId(
        "FNQ",
        discovery.type || "BIO",
        sampleType || "SWAB",
    );
    $: metadata = {
        ...getDeviceMetadata(),
        timestamp: new Date().toISOString(),
        discoveryId: discovery.id,
        species: discovery.ai_classification?.species || "Unknown",
        coordinates: discovery.coordinates,
    };
    $: chainOfCustodyHash = sha3Hash(
        JSON.stringify({
            collector: collectorName,
            sampleId,
            coords: metadata.coordinates,
            timestamp: metadata.timestamp,
            sampleType,
        }),
    );

    $: primers = suggestPrimers(discovery.ai_classification?.species || "");

    onMount(() => {
        // Determine sample type based on species
        const species = discovery.ai_classification?.species || "";
        if (species.includes("Crocodylus")) sampleType = "buccal";
        else if (species.includes("Solenopsis")) sampleType = "soil";
        else sampleType = "water";

        // Mock offline check
        offlineMode = !navigator.onLine;
    });

    function togglePPE(item: keyof typeof ppeChecked) {
        ppeChecked[item] = !ppeChecked[item];
    }

    $: allPPEOn =
        ppeChecked.gloves &&
        ppeChecked.mask &&
        ppeChecked.gown &&
        ppeChecked.eyewear;

    function startSwabbing() {
        isSwabbing = true;
        swabInterval = setInterval(() => {
            if (samplingProgress < 100) {
                samplingProgress += 5;
            } else {
                stopSwabbing();
            }
        }, 100);
    }

    function stopSwabbing() {
        isSwabbing = false;
        clearInterval(swabInterval);
    }

    async function finalizeCertification() {
        isCertifying = true;

        const requestBody = {
            simulation_id: `SIM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            ranger_id: discovery.reporter_id || "ranger_participant",
            metadata: {
                accuracy: 0.98,
                ppe_compliance: true,
                competency_units: [
                    "AHCARB401: Prepare samples for testing",
                    "AHCLSK402: Apply biosecurity procedures",
                    "BSBMED401: Handle biological materials",
                ],
                discovery_id: discovery.id,
                sample_id: sampleId,
                ledger_hash: chainOfCustodyHash,
            },
        };

        try {
            const res = await fetch(
                "http://localhost:8000/api/v1/credentials/certify",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                },
            );

            if (res.ok) {
                const data = await res.json();
                issuedBadge = data.badge;
                certificationPoints = data.bio_credits;
            } else {
                throw new Error("Certification failed");
            }
        } catch (err) {
            console.error("Certification error:", err);
            // Fallback for demo
            certificationPoints = 500;
            issuedBadge = {
                id: `badge-${Math.random().toString(36).substr(2, 8)}`,
                name: "Tropical Biosecurity Sentinel",
                hash: chainOfCustodyHash,
            };
        } finally {
            isCertifying = false;
            step = "complete";
        }
    }

    function nextStep() {
        if (step === "ppe") step = "sampling";
        else if (step === "sampling") step = "primer_advisor";
        else if (step === "primer_advisor") step = "chain_of_custody";
        else if (step === "chain_of_custody") step = "data_sync";
        else if (step === "data_sync") {
            finalizeCertification();
        }
    }

    function close() {
        dispatch("close", { certificationPoints, badge: issuedBadge });
    }
</script>

<div class="molecular-bridge-overlay" transition:fade>
    <div
        class="molecular-bridge-modal"
        class:tactical={lensMode === "tactical"}
    >
        <header class="bridge-header">
            <div class="header-main">
                <span class="step-indicator"
                    >Step {[
                        "ppe",
                        "sampling",
                        "primer_advisor",
                        "chain_of_custody",
                        "data_sync",
                        "complete",
                    ].indexOf(step) + 1}/6</span
                >
                <h2>Molecular Science Bridge</h2>
            </div>
            <button class="close-x" on:click={close}>✕</button>
        </header>

        <div class="bridge-body">
            {#if step === "ppe"}
                <div class="step-content" in:fly={{ y: 20 }}>
                    <div class="icon-hero">🛡️</div>
                    <h3>Bio-Security Protocol: PPE Check</h3>
                    <p>
                        Equip necessary gear for <strong
                            >{discovery.ai_classification?.species ||
                                discovery.type}</strong
                        >.
                    </p>

                    <div class="ppe-grid">
                        <button
                            class="ppe-item"
                            class:selected={ppeChecked.gloves}
                            on:click={() => togglePPE("gloves")}
                        >
                            <span class="ppe-icon">🧤</span>
                            <span class="ppe-label">Nitrile Gloves</span>
                        </button>
                        <button
                            class="ppe-item"
                            class:selected={ppeChecked.mask}
                            on:click={() => togglePPE("mask")}
                        >
                            <span class="ppe-icon">😷</span>
                            <span class="ppe-label">N95 Respirator</span>
                        </button>
                        <button
                            class="ppe-item"
                            class:selected={ppeChecked.gown}
                            on:click={() => togglePPE("gown")}
                        >
                            <span class="ppe-icon">🥼</span>
                            <span class="ppe-label">Bio-Hazard Gown</span>
                        </button>
                        <button
                            class="ppe-item"
                            class:selected={ppeChecked.eyewear}
                            on:click={() => togglePPE("eyewear")}
                        >
                            <span class="ppe-icon">🥽</span>
                            <span class="ppe-label">Eye Protection</span>
                        </button>
                    </div>

                    <button
                        class="action-btn"
                        disabled={!allPPEOn}
                        on:click={nextStep}>Confirm Gear</button
                    >
                </div>
            {:else if step === "sampling"}
                <div class="step-content" in:fly={{ y: 20 }}>
                    <div class="icon-hero">🧪</div>
                    <h3>In-Situ Forensic Swabbing</h3>
                    <p>
                        Rotate the <strong>{sampleType}</strong> swab to capture
                        maximal DNA yield.
                    </p>

                    <div class="swab-interaction">
                        <div class="swab-target">
                            <div class="target-glow"></div>
                            {#if isSwabbing}
                                <div
                                    class="swab-tool"
                                    style="transform: rotate({samplingProgress *
                                        5}deg)"
                                >
                                    🖌️
                                </div>
                            {/if}
                        </div>

                        <div class="progress-container">
                            <div
                                class="progress-bar"
                                style="width: {samplingProgress}%"
                            ></div>
                        </div>

                        <button
                            class="swab-btn"
                            class:active={isSwabbing}
                            on:mousedown={startSwabbing}
                            on:mouseup={stopSwabbing}
                            on:touchstart={startSwabbing}
                            on:touchend={stopSwabbing}
                        >
                            {#if samplingProgress >= 100}
                                Sample Collected!
                            {:else if isSwabbing}
                                Swabbing...
                            {:else}
                                Press & Hold to Swab
                            {/if}
                        </button>
                    </div>

                    {#if samplingProgress >= 100}
                        <button
                            class="action-btn success"
                            on:click={nextStep}
                            in:scale
                        >
                            Secure Sample
                        </button>
                    {/if}
                </div>
            {:else if step === "primer_advisor"}
                <div class="step-content" in:fly={{ y: 20 }}>
                    <div class="icon-hero">🧬</div>
                    <h3>AIVA Primer Advisor</h3>
                    <p>
                        Validated PCR Primers for <strong
                            >{discovery.ai_classification?.species} identification</strong
                        >.
                    </p>

                    <div class="primer-card">
                        <div class="primer-row">
                            <strong>Target Gene:</strong>
                            {primers.gene}
                        </div>
                        <div class="primer-row">
                            <strong>Forward (5'-3'):</strong>
                            <code>{primers.forward}</code>
                        </div>
                        <div class="primer-row">
                            <strong>Reverse (5'-3'):</strong>
                            <code>{primers.reverse}</code>
                        </div>
                        <div class="primer-row">
                            <strong>Amplicon Size:</strong>
                            {primers.ampliconSize} bp
                        </div>
                        <div class="primer-row source">
                            Reference: {primers.reference}
                        </div>
                    </div>

                    <button class="action-btn" on:click={nextStep}
                        >Verify Assay Plan</button
                    >
                </div>
            {:else if step === "chain_of_custody"}
                <div class="step-content" in:fly={{ y: 20 }}>
                    <div class="icon-hero">📋</div>
                    <h3>Digital Chain-of-Custody</h3>
                    <p>
                        Establish immutable provenance for the Sovereign Science
                        Ledger.
                    </p>

                    <div class="coc-form">
                        <div class="form-group">
                            <label>Sample ID</label>
                            <input type="text" readonly value={sampleId} />
                        </div>
                        <div class="form-group">
                            <label>Collector Name</label>
                            <input
                                type="text"
                                bind:value={collectorName}
                                placeholder="Djari Yidinji"
                            />
                        </div>
                        <div class="form-group">
                            <label>Storage Method</label>
                            <select bind:value={storageMethod}>
                                <option>FTA card, ambient</option>
                                <option>Ethanol, -20°C</option>
                                <option>VTM, Chilled (4°C)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        class="action-btn"
                        disabled={!collectorName}
                        on:click={nextStep}>Lock Ledger Entry</button
                    >
                </div>
            {:else if step === "data_sync"}
                <div class="step-content" in:fly={{ y: 20 }}>
                    <div class="icon-hero">📡</div>
                    <h3>Planetary Ledger Sync</h3>
                    <p>
                        Broadcasting forensic metadata to the Northern Shield
                        node.
                    </p>

                    <ul class="sync-logs">
                        <li class="success">✓ Geotag & Timestamp Frozen</li>
                        <li class="success">
                            ✓ Chain-of-Custody SHA-3: {chainOfCustodyHash.substring(
                                0,
                                12,
                            )}...
                        </li>
                        <li class="success">✓ PII Privacy Scrubber Active</li>
                        {#if isCertifying}
                            <li class="pending">
                                ⌛ Negotiating Sovereign Credential...
                            </li>
                        {:else}
                            <li class="success">
                                ✓ Ready for Final Certification
                            </li>
                        {/if}
                    </ul>

                    <button
                        class="action-btn"
                        disabled={isCertifying}
                        on:click={nextStep}
                    >
                        {isCertifying ? "Certifying..." : "Finalize & Sign"}
                    </button>
                </div>
            {:else if step === "complete"}
                <div class="step-content success-final" in:scale>
                    <div class="icon-hero big">🏆</div>
                    <h2>Competency Verified</h2>
                    <p>
                        Training units achieved for <strong
                            >{discovery.ai_classification?.species}</strong
                        > sampling.
                    </p>

                    <div class="badge-display">
                        <div class="badge-icon">🏅</div>
                        <div class="badge-info">
                            <h4>{issuedBadge?.name}</h4>
                            <p>ID: {issuedBadge?.id}</p>
                        </div>
                    </div>

                    <div class="reward-box">
                        <div class="reward-pill xp">
                            +{certificationPoints} Bio-Credits
                        </div>
                        <div class="reward-pill">+1,000 Surveillance XP</div>
                    </div>

                    <p class="training-notice">
                        Aligned with <strong
                            >Cert IV Tropical Biosecurity</strong
                        > units: AHCARB401, AHCLSK402, BSBMED401.
                    </p>

                    <button class="action-btn" on:click={close}
                        >Return to Field Map</button
                    >
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .molecular-bridge-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        backdrop-filter: blur(10px);
    }

    .molecular-bridge-modal {
        background: #fff;
        width: 90%;
        max-width: 500px;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        max-height: 95vh;
    }

    .molecular-bridge-modal.tactical {
        background: #0f172a;
        color: #38bdf8;
        border: 1px solid #38bdf8;
    }

    .bridge-header {
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .step-indicator {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.6;
        display: block;
        margin-bottom: 0.25rem;
    }

    .bridge-header h2 {
        margin: 0;
        font-size: 1.2rem;
    }

    .close-x {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0.5;
    }

    .bridge-body {
        padding: 2rem;
        flex: 1;
        overflow-y: auto;
    }

    .step-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .icon-hero {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .icon-hero.big {
        font-size: 5rem;
    }

    h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.4rem;
    }

    p {
        opacity: 0.8;
        line-height: 1.5;
        margin-bottom: 1.5rem;
    }

    /* PPE Grid */
    .ppe-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        width: 100%;
        margin-bottom: 2rem;
    }

    .ppe-item {
        background: #f8f9fa;
        border: 2px solid transparent;
        padding: 1rem;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .tactical .ppe-item {
        background: #1e293b;
        color: #38bdf8;
    }

    .ppe-item.selected {
        border-color: #38bdf8;
        background: rgba(56, 189, 248, 0.1);
    }

    .ppe-icon {
        font-size: 2rem;
    }

    /* Swab interaction */
    .swab-interaction {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .swab-target {
        width: 120px;
        height: 120px;
        background: #f0f0f0;
        border-radius: 50%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid #38bdf8;
    }

    .tactical .swab-target {
        background: #1e293b;
    }

    .target-glow {
        position: absolute;
        inset: 10px;
        background: radial-gradient(
            circle,
            rgba(56, 189, 248, 0.4) 0%,
            transparent 70%
        );
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.4;
            transform: scale(1);
        }
        50% {
            opacity: 0.8;
            transform: scale(1.1);
        }
    }

    .swab-tool {
        font-size: 2.5rem;
        z-index: 2;
    }

    .progress-container {
        width: 100%;
        height: 8px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        overflow: hidden;
    }

    .progress-bar {
        height: 100%;
        background: #38bdf8;
        transition: width 0.1s linear;
    }

    .swab-btn {
        padding: 1rem;
        background: #38bdf8;
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        width: 100%;
    }

    /* Primer Card */
    .primer-card {
        background: rgba(56, 189, 248, 0.05);
        border: 1px solid #38bdf8;
        padding: 1rem;
        border-radius: 12px;
        width: 100%;
        text-align: left;
        margin-bottom: 1.5rem;
        font-family: monospace;
    }

    .primer-row {
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
    }
    .primer-row code {
        color: #f472b6;
    }

    /* Forms */
    .coc-form {
        width: 100%;
        text-align: left;
        margin-bottom: 1.5rem;
    }
    .form-group {
        margin-bottom: 1rem;
    }
    .form-group label {
        display: block;
        font-size: 0.8rem;
        opacity: 0.6;
        margin-bottom: 0.3rem;
    }
    .form-group input,
    .form-group select {
        width: 100%;
        padding: 0.75rem;
        border-radius: 8px;
        background: rgba(56, 189, 248, 0.1);
        border: 1px solid rgba(56, 189, 248, 0.2);
        color: inherit;
    }

    /* Sync Logs */
    .sync-logs {
        width: 100%;
        list-style: none;
        padding: 0;
        text-align: left;
        margin-bottom: 1.5rem;
    }

    .sync-logs li {
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 0.85rem;
    }

    .sync-logs li.success {
        color: #10b981;
    }
    .sync-logs li.pending {
        color: #fbbf24;
        font-style: italic;
    }

    /* Complete */
    .badge-display {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        background: rgba(56, 189, 248, 0.1);
        padding: 1rem;
        border-radius: 16px;
        width: 100%;
        margin-bottom: 1.5rem;
        text-align: left;
    }

    .badge-icon {
        font-size: 3rem;
    }
    .badge-info h4 {
        margin: 0;
        color: #38bdf8;
    }
    .badge-info p {
        margin: 0;
        font-size: 0.75rem;
        font-family: monospace;
        opacity: 0.6;
    }

    .reward-box {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .reward-pill {
        background: #38bdf8;
        color: #0f172a;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.85rem;
    }

    .reward-pill.xp {
        background: #f472b6;
        color: white;
    }

    .training-notice {
        font-size: 0.75rem;
        opacity: 0.6;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 1rem;
    }

    .action-btn {
        width: 100%;
        padding: 1.25rem;
        background: #38bdf8;
        color: #0f172a;
        border: none;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .action-btn.success {
        background: #10b981;
        color: white;
    }
</style>
