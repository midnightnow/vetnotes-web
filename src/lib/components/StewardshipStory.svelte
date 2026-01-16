<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
    import type { Story } from "$lib/types";

    export let story: Story;
    const dispatch = createEventDispatcher();
</script>

<div class="story-overlay" transition:fade>
    <div class="story-card" in:fly={{ y: 50, duration: 600 }}>
        <header>
            <span class="custodian-badge">🌿 CUSTODIANSHIP PATH</span>
            <h1>{story.title}</h1>
            <p class="narrator">Told by {story.narrator}</p>
        </header>

        <div class="transcript-box">
            <p>{story.transcript}</p>
        </div>

        <footer>
            <div class="permission">{story.permissionSource}</div>
            <button class="done-btn" on:click={() => dispatch("close")}
                >I LISTENED</button
            >
        </footer>
    </div>
</div>

<style>
    .story-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 6000;
        backdrop-filter: blur(15px);
        padding: 2rem;
    }

    .story-card {
        background: #1a1a1a;
        width: 100%;
        max-width: 500px;
        border-radius: 24px;
        padding: 2.5rem;
        color: white;
        border: 1px solid #2d3a2d;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
    }

    .custodian-badge {
        font-size: 0.65rem;
        font-weight: 900;
        color: #34d399;
        letter-spacing: 0.15em;
        margin-bottom: 1rem;
        display: block;
    }

    h1 {
        font-size: 1.75rem;
        font-weight: 900;
        margin: 0;
    }

    .narrator {
        color: #999;
        font-weight: 700;
        margin-top: 0.25rem;
    }

    .transcript-box {
        margin: 2rem 0;
        background: #161616;
        padding: 2rem;
        border-radius: 16px;
        font-style: italic;
        line-height: 1.8;
        color: #eee;
        font-size: 1.1rem;
    }

    footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    .permission {
        font-size: 0.7rem;
        color: #555;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .done-btn {
        background: #34d399;
        color: black;
        border: none;
        padding: 1rem 2.5rem;
        border-radius: 50px;
        font-weight: 900;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .done-btn:active {
        transform: scale(0.95);
    }
</style>
