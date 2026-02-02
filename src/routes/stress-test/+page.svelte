<script lang="ts">
    import { onMount } from "svelte";
    import {
        ParticleStressTest,
        type StressTestResult,
    } from "$lib/utils/ParticleStressTest";

    let canvas: HTMLCanvasElement;
    let stressTest: ParticleStressTest;
    let results: StressTestResult[] = [];
    let isRunning = false;
    let currentTest = "";
    let progress = 0;

    onMount(() => {
        canvas.width = 800;
        canvas.height = 600;
        stressTest = new ParticleStressTest(canvas);

        return () => {
            if (stressTest) {
                stressTest.destroy();
            }
        };
    });

    async function runTests() {
        isRunning = true;
        results = [];
        progress = 0;

        try {
            results = await stressTest.runAllTests();
        } catch (e) {
            console.error("Stress test failed:", e);
        } finally {
            isRunning = false;
            progress = 100;
        }
    }

    function getStatusColor(passed: boolean): string {
        return passed ? "#10b981" : "#ef4444";
    }

    function getPerformanceRating(fps: number): string {
        if (fps >= 60) return "Excellent";
        if (fps >= 55) return "Good";
        if (fps >= 45) return "Acceptable";
        if (fps >= 30) return "Poor";
        return "Critical";
    }

    function exportResults() {
        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `particle-stress-test-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
</script>

<div class="stress-test-container">
    <div class="header">
        <h1>🧪 Particle Pool Stress Test</h1>
        <p>Find the performance breaking point of the ParticlePool system</p>
    </div>

    <div class="controls">
        <button on:click={runTests} disabled={isRunning} class="run-button">
            {#if isRunning}
                ⏳ Running Tests...
            {:else}
                ▶️ Run All Tests
            {/if}
        </button>

        {#if results.length > 0}
            <button on:click={exportResults} class="export-button">
                💾 Export Results
            </button>
        {/if}
    </div>

    <div class="canvas-container">
        <canvas bind:this={canvas}></canvas>
        {#if isRunning}
            <div class="overlay">
                <div class="spinner"></div>
                <p>{currentTest}</p>
            </div>
        {/if}
    </div>

    {#if results.length > 0}
        <div class="results">
            <h2>📊 Test Results</h2>

            <div class="summary">
                <div class="summary-card">
                    <div class="label">Tests Passed</div>
                    <div class="value">
                        {results.filter((r) => r.passed).length} / {results.length}
                    </div>
                </div>

                <div class="summary-card">
                    <div class="label">Breaking Point</div>
                    <div class="value">
                        {#if results.some((r) => !r.passed)}
                            {results.find((r) => !r.passed)?.particleCount} particles
                        {:else}
                            Not reached
                        {/if}
                    </div>
                </div>

                <div class="summary-card">
                    <div class="label">Best FPS</div>
                    <div class="value">
                        {Math.max(...results.map((r) => r.fps)).toFixed(1)}
                    </div>
                </div>

                <div class="summary-card">
                    <div class="label">Total GC Events</div>
                    <div class="value">
                        {results.reduce((sum, r) => sum + r.gcEvents, 0)}
                    </div>
                </div>
            </div>

            <div class="results-table">
                <table>
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Test Name</th>
                            <th>Particles</th>
                            <th>FPS</th>
                            <th>Avg Frame (ms)</th>
                            <th>Dropped Frames</th>
                            <th>GC Events</th>
                            <th>Memory (MB)</th>
                            <th>Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each results as result}
                            <tr class:failed={!result.passed}>
                                <td>
                                    <span
                                        class="status-badge"
                                        style="background-color: {getStatusColor(
                                            result.passed,
                                        )}"
                                    >
                                        {result.passed ? "✅" : "❌"}
                                    </span>
                                </td>
                                <td class="test-name">{result.testName}</td>
                                <td>{result.particleCount}</td>
                                <td class="fps">{result.fps}</td>
                                <td>{result.avgFrameTime}</td>
                                <td>{result.droppedFrames}</td>
                                <td>{result.gcEvents}</td>
                                <td
                                    >{(result.memoryUsed / 1024 / 1024).toFixed(
                                        2,
                                    )}</td
                                >
                                <td>
                                    <span
                                        class="rating rating-{getPerformanceRating(
                                            result.fps,
                                        ).toLowerCase()}"
                                    >
                                        {getPerformanceRating(result.fps)}
                                    </span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <div class="notes-section">
                <h3>📝 Test Notes</h3>
                {#each results as result}
                    <div class="note-card">
                        <div class="note-header">
                            <strong>{result.testName}</strong>
                            <span class="note-fps">{result.fps} fps</span>
                        </div>
                        <p>{result.notes}</p>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .stress-test-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
        font-family: "Space Grotesk", monospace;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        color: #e2e8f0;
    }

    .header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .header h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .header p {
        color: #94a3b8;
        font-size: 1.1rem;
    }

    .controls {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 2rem;
    }

    .run-button,
    .export-button {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
    }

    .run-button {
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        color: white;
    }

    .run-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }

    .run-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .export-button {
        background: #10b981;
        color: white;
    }

    .export-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
    }

    .canvas-container {
        position: relative;
        background: #000;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 2rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }

    canvas {
        display: block;
        width: 100%;
        height: auto;
    }

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-top-color: #60a5fa;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .results {
        margin-top: 2rem;
    }

    .results h2 {
        font-size: 2rem;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .summary-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
    }

    .summary-card .label {
        color: #94a3b8;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
    }

    .summary-card .value {
        font-size: 2rem;
        font-weight: bold;
        color: #60a5fa;
    }

    .results-table {
        overflow-x: auto;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 2rem;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th {
        text-align: left;
        padding: 1rem;
        border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        color: #94a3b8;
        font-weight: 600;
    }

    td {
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    tr.failed {
        background: rgba(239, 68, 68, 0.1);
    }

    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .test-name {
        font-weight: 600;
    }

    .fps {
        font-weight: bold;
        color: #60a5fa;
    }

    .rating {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 600;
    }

    .rating-excellent {
        background: #10b981;
        color: white;
    }
    .rating-good {
        background: #3b82f6;
        color: white;
    }
    .rating-acceptable {
        background: #f59e0b;
        color: white;
    }
    .rating-poor {
        background: #ef4444;
        color: white;
    }
    .rating-critical {
        background: #7f1d1d;
        color: white;
    }

    .notes-section {
        margin-top: 2rem;
    }

    .notes-section h3 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
    }

    .note-card {
        background: rgba(255, 255, 255, 0.05);
        border-left: 4px solid #60a5fa;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
    }

    .note-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .note-fps {
        color: #60a5fa;
        font-weight: bold;
    }

    .note-card p {
        color: #cbd5e1;
        margin: 0;
    }
</style>
