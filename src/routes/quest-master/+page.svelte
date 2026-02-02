<script lang="ts">
    import { onMount } from "svelte";

    // Types
    interface Discovery {
        id: string;
        type: string;
        subtype: string;
        coordinates: { lat: number; lng: number };
        reported_by: string;
        reported_at: string;
        photo_uri: string | null;
        ai_classification: {
            species: string;
            confidence: number;
            risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        };
        quest_status: "OPEN" | "REPORTED" | "VERIFIED" | "RESOLVED";
        reward_tier: { xp: number; coins: number; badge?: string };
        days_outstanding: number;
    }

    // State
    let discoveries: Discovery[] = [];
    let isLoading = true;
    let filter: "all" | "pending" | "verified" = "pending";
    let selectedDiscovery: Discovery | null = null;

    const apiUrl =
        import.meta.env.VITE_VETNOTES_API_URL || "http://localhost:8000";

    onMount(async () => {
        await loadDiscoveries();
    });

    async function loadDiscoveries() {
        isLoading = true;
        try {
            const response = await fetch(`${apiUrl}/api/v1/quests/discoveries`);
            discoveries = await response.json();
        } catch (e) {
            console.error("Failed to load discoveries:", e);
        }
        isLoading = false;
    }

    async function verifyDiscovery(id: string, verified: boolean) {
        try {
            await fetch(
                `${apiUrl}/api/v1/quests/discoveries/${id}/verify?verified=${verified}`,
                {
                    method: "POST",
                },
            );
            await loadDiscoveries();
            selectedDiscovery = null;
        } catch (e) {
            console.error("Verification failed:", e);
        }
    }

    async function resolveDiscovery(id: string) {
        try {
            await fetch(`${apiUrl}/api/v1/quests/discoveries/${id}/resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resolution_notes: "Resolved by Quest Master",
                }),
            });
            await loadDiscoveries();
            selectedDiscovery = null;
        } catch (e) {
            console.error("Resolution failed:", e);
        }
    }

    $: filteredDiscoveries = discoveries.filter((d) => {
        if (filter === "pending") return d.quest_status === "REPORTED";
        if (filter === "verified") return d.quest_status === "VERIFIED";
        return true;
    });

    function getRiskColor(level: string): string {
        switch (level) {
            case "CRITICAL":
                return "#e74c3c";
            case "HIGH":
                return "#e67e22";
            case "MEDIUM":
                return "#f1c40f";
            default:
                return "#27ae60";
        }
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString("en-AU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<svelte:head>
    <title>Quest Master Dashboard | Country Guardians</title>
</svelte:head>

<div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
        <div class="header-content">
            <h1>🛡️ Quest Master Dashboard</h1>
            <p class="subtitle">
                Country Guardians — Verify & Validate Field Reports
            </p>
        </div>
        <button class="refresh-btn" on:click={loadDiscoveries}>
            🔄 Refresh
        </button>
    </header>

    <!-- Stats Bar -->
    <div class="stats-bar">
        <div class="stat-card">
            <span class="stat-value"
                >{discoveries.filter((d) => d.quest_status === "REPORTED")
                    .length}</span
            >
            <span class="stat-label">Pending Review</span>
        </div>
        <div class="stat-card">
            <span class="stat-value"
                >{discoveries.filter((d) => d.quest_status === "VERIFIED")
                    .length}</span
            >
            <span class="stat-label">Verified</span>
        </div>
        <div class="stat-card critical">
            <span class="stat-value"
                >{discoveries.filter(
                    (d) => d.ai_classification?.risk_level === "CRITICAL",
                ).length}</span
            >
            <span class="stat-label">Critical Alerts</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">{discoveries.length}</span>
            <span class="stat-label">Total Reports</span>
        </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
        <button
            class:active={filter === "pending"}
            on:click={() => (filter = "pending")}
        >
            ⏳ Pending ({discoveries.filter(
                (d) => d.quest_status === "REPORTED",
            ).length})
        </button>
        <button
            class:active={filter === "verified"}
            on:click={() => (filter = "verified")}
        >
            ✅ Verified ({discoveries.filter(
                (d) => d.quest_status === "VERIFIED",
            ).length})
        </button>
        <button
            class:active={filter === "all"}
            on:click={() => (filter = "all")}
        >
            📋 All ({discoveries.length})
        </button>
    </div>

    <!-- Discovery List -->
    <main class="discovery-list">
        {#if isLoading}
            <div class="loading">Loading discoveries...</div>
        {:else if filteredDiscoveries.length === 0}
            <div class="empty-state">
                <span class="empty-icon">🔍</span>
                <p>No discoveries to review</p>
            </div>
        {:else}
            {#each filteredDiscoveries as discovery}
                <article
                    class="discovery-card"
                    class:selected={selectedDiscovery?.id === discovery.id}
                    on:click={() => (selectedDiscovery = discovery)}
                    on:keydown={(e) =>
                        e.key === "Enter" && (selectedDiscovery = discovery)}
                    role="button"
                    tabindex="0"
                >
                    <div class="card-header">
                        <span class="discovery-type">
                            {#if discovery.type === "invasive_pest"}🐜
                            {:else if discovery.type === "wildlife_sighting"}🐊
                            {:else if discovery.type === "infrastructure_fault"}🕳️
                            {:else}🚨
                            {/if}
                            {discovery.subtype || discovery.type}
                        </span>
                        <span
                            class="risk-badge"
                            style="background: {getRiskColor(
                                discovery.ai_classification?.risk_level,
                            )}"
                        >
                            {discovery.ai_classification?.risk_level ||
                                "UNKNOWN"}
                        </span>
                    </div>

                    <div class="card-body">
                        <div class="ai-result">
                            <span class="species"
                                >{discovery.ai_classification?.species ||
                                    "Unidentified"}</span
                            >
                            <div class="flex items-center gap-2">
                                <div class="relative w-8 h-8">
                                    <svg
                                        class="w-full h-full transform -rotate-90"
                                    >
                                        <circle
                                            cx="16"
                                            cy="16"
                                            r="14"
                                            stroke="currentColor"
                                            stroke-width="3"
                                            fill="transparent"
                                            class="text-white/5"
                                        />
                                        <circle
                                            cx="16"
                                            cy="16"
                                            r="14"
                                            stroke="currentColor"
                                            stroke-width="3"
                                            fill="transparent"
                                            class="text-blue-500"
                                            stroke-dasharray="88"
                                            stroke-dashoffset={88 -
                                                88 *
                                                    (discovery.ai_classification
                                                        ?.confidence || 0)}
                                            stroke-linecap="round"
                                        />
                                    </svg>
                                    <span
                                        class="absolute inset-0 flex items-center justify-center text-[8px] font-bold"
                                    >
                                        {Math.round(
                                            (discovery.ai_classification
                                                ?.confidence || 0) * 100,
                                        )}%
                                    </span>
                                </div>
                                <span
                                    class="text-[10px] text-white/40 uppercase font-bold tracking-tighter"
                                    >Confidence</span
                                >
                            </div>
                        </div>

                        <div class="meta">
                            <span
                                >📍 {discovery.coordinates.lat.toFixed(4)}, {discovery.coordinates.lng.toFixed(
                                    4,
                                )}</span
                            >
                            <span>🕐 {formatDate(discovery.reported_at)}</span>
                        </div>
                    </div>

                    <div class="card-status">
                        <span
                            class="status-badge status-{discovery.quest_status.toLowerCase()}"
                        >
                            {discovery.quest_status}
                        </span>
                    </div>
                </article>
            {/each}
        {/if}
    </main>

    <!-- Detail Panel -->
    {#if selectedDiscovery}
        <aside class="detail-panel">
            <button
                class="close-panel"
                on:click={() => (selectedDiscovery = null)}>✕</button
            >

            <h2>Discovery Details</h2>

            <div class="detail-section">
                <h3>AI Classification</h3>
                <div class="classification-box">
                    <div class="species-name">
                        {selectedDiscovery.ai_classification?.species}
                    </div>
                    <div class="confidence-bar">
                        <div
                            class="confidence-fill"
                            style="width: {(selectedDiscovery.ai_classification
                                ?.confidence || 0) * 100}%"
                        ></div>
                    </div>
                    <div class="confidence-label">
                        {Math.round(
                            (selectedDiscovery.ai_classification?.confidence ||
                                0) * 100,
                        )}% Confidence
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Location</h3>
                <p>Lat: {selectedDiscovery.coordinates.lat}</p>
                <p>Lng: {selectedDiscovery.coordinates.lng}</p>
            </div>

            <div class="detail-section">
                <h3>Reporter</h3>
                <p>{selectedDiscovery.reported_by}</p>
                <p class="timestamp">
                    {formatDate(selectedDiscovery.reported_at)}
                </p>
            </div>

            <div class="detail-section">
                <h3>Rewards Issued</h3>
                <div class="rewards">
                    <span>⭐ {selectedDiscovery.reward_tier.xp} XP</span>
                    <span>🪙 {selectedDiscovery.reward_tier.coins} Coins</span>
                    {#if selectedDiscovery.reward_tier.badge}
                        <span>🏅 {selectedDiscovery.reward_tier.badge}</span>
                    {/if}
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
                {#if selectedDiscovery.quest_status === "REPORTED"}
                    <button
                        class="btn-verify"
                        on:click={() =>
                            verifyDiscovery(selectedDiscovery?.id || "", true)}
                    >
                        ✅ Verify Discovery
                    </button>
                    <button
                        class="btn-reject"
                        on:click={() =>
                            verifyDiscovery(selectedDiscovery?.id || "", false)}
                    >
                        ❌ Reject (False Positive)
                    </button>
                {:else if selectedDiscovery.quest_status === "VERIFIED"}
                    <button
                        class="btn-resolve"
                        on:click={() =>
                            resolveDiscovery(selectedDiscovery?.id || "")}
                    >
                        🏁 Mark Resolved
                    </button>
                {/if}
            </div>

            <!-- Escalation Warning -->
            {#if selectedDiscovery.ai_classification?.risk_level === "CRITICAL"}
                <div class="escalation-warning">
                    ⚠️ <strong>CRITICAL THREAT</strong><br />
                    This discovery requires immediate escalation to biosecurity authorities.
                    <button class="btn-escalate">
                        📞 Contact 1800 675 888
                    </button>
                </div>
            {/if}
        </aside>
    {/if}
</div>

<style>
    .dashboard {
        min-height: 100vh;
        background: #0f1419;
        color: white;
        font-family:
            "Inter",
            -apple-system,
            sans-serif;
    }

    /* Header */
    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 2rem;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-bottom: 1px solid #2d3a4a;
    }

    .dashboard-header h1 {
        margin: 0;
        font-size: 1.75rem;
    }

    .subtitle {
        margin: 0.25rem 0 0 0;
        opacity: 0.7;
        font-size: 0.9rem;
    }

    .refresh-btn {
        padding: 0.75rem 1.5rem;
        background: #4a90d9;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
    }

    /* Stats Bar */
    .stats-bar {
        display: flex;
        gap: 1rem;
        padding: 1.5rem 2rem;
        background: #1a1f26;
        overflow-x: auto;
    }

    .stat-card {
        flex: 1;
        min-width: 120px;
        padding: 1rem;
        background: #252d38;
        border-radius: 12px;
        text-align: center;
    }

    .stat-card.critical {
        background: linear-gradient(135deg, #c0392b 0%, #96281b 100%);
    }

    .stat-value {
        display: block;
        font-size: 2rem;
        font-weight: 700;
    }

    .stat-label {
        font-size: 0.8rem;
        opacity: 0.7;
    }

    /* Filter Tabs */
    .filter-tabs {
        display: flex;
        gap: 0.5rem;
        padding: 1rem 2rem;
        background: #1a1f26;
        border-bottom: 1px solid #2d3a4a;
    }

    .filter-tabs button {
        padding: 0.75rem 1.25rem;
        background: transparent;
        color: rgba(255, 255, 255, 0.6);
        border: 1px solid #2d3a4a;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }

    .filter-tabs button.active {
        background: #4a90d9;
        color: white;
        border-color: #4a90d9;
    }

    /* Discovery List */
    .discovery-list {
        padding: 1.5rem 2rem;
        display: grid;
        gap: 1rem;
        max-width: 800px;
    }

    .loading,
    .empty-state {
        text-align: center;
        padding: 3rem;
        opacity: 0.6;
    }

    .empty-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
    }

    /* Discovery Card */
    .discovery-card {
        background: #1a1f26;
        border: 1px solid #2d3a4a;
        border-radius: 12px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .discovery-card:hover {
        border-color: #4a90d9;
        transform: translateY(-2px);
    }

    .discovery-card.selected {
        border-color: #4a90d9;
        background: #252d38;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .discovery-type {
        font-weight: 600;
        font-size: 1.1rem;
    }

    .risk-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
    }

    .card-body {
        margin-bottom: 0.75rem;
    }

    .species {
        font-style: italic;
        opacity: 0.9;
    }

    .confidence {
        font-size: 0.8rem;
        opacity: 0.6;
        margin-left: 0.5rem;
    }

    .meta {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        opacity: 0.6;
        margin-top: 0.5rem;
    }

    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .status-reported {
        background: #f1c40f;
        color: #333;
    }
    .status-verified {
        background: #27ae60;
        color: white;
    }
    .status-resolved {
        background: #4a90d9;
        color: white;
    }
    .status-open {
        background: #666;
        color: white;
    }

    /* Detail Panel */
    .detail-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        height: 100vh;
        background: #1a1f26;
        border-left: 1px solid #2d3a4a;
        padding: 2rem;
        overflow-y: auto;
        z-index: 100;
    }

    .close-panel {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: white;
        cursor: pointer;
        opacity: 0.6;
    }

    .detail-panel h2 {
        margin: 0 0 1.5rem 0;
    }

    .detail-section {
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #2d3a4a;
    }

    .detail-section h3 {
        margin: 0 0 0.75rem 0;
        font-size: 0.85rem;
        text-transform: uppercase;
        opacity: 0.6;
    }

    .classification-box {
        background: #252d38;
        padding: 1rem;
        border-radius: 8px;
    }

    .species-name {
        font-size: 1.25rem;
        font-style: italic;
        margin-bottom: 0.75rem;
    }

    .confidence-bar {
        height: 8px;
        background: #333;
        border-radius: 4px;
        overflow: hidden;
    }

    .confidence-fill {
        height: 100%;
        background: linear-gradient(90deg, #27ae60, #2ecc71);
        transition: width 0.3s;
    }

    .confidence-label {
        font-size: 0.85rem;
        opacity: 0.7;
        margin-top: 0.5rem;
    }

    .rewards {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .rewards span {
        background: #252d38;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    /* Action Buttons */
    .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1.5rem;
    }

    .btn-verify,
    .btn-reject,
    .btn-resolve,
    .btn-escalate {
        width: 100%;
        padding: 1rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-verify {
        background: #27ae60;
        color: white;
    }

    .btn-reject {
        background: #e74c3c;
        color: white;
    }

    .btn-resolve {
        background: #4a90d9;
        color: white;
    }

    .btn-escalate {
        background: #c0392b;
        color: white;
        margin-top: 0.5rem;
    }

    /* Escalation Warning */
    .escalation-warning {
        margin-top: 1.5rem;
        padding: 1rem;
        background: rgba(192, 57, 43, 0.2);
        border: 1px solid #c0392b;
        border-radius: 8px;
        text-align: center;
    }

    .timestamp {
        font-size: 0.85rem;
        opacity: 0.6;
    }
</style>
