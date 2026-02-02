<script lang="ts">
    import { page } from "$app/stores";
    import { player } from "$lib/stores/player";
    import { fade, slide } from "svelte/transition";

    export let breadcrumbs: { label: string; href: string }[] = [];

    $: currentPath = $page.url.pathname;
    $: isPro =
        typeof window !== "undefined" &&
        window.location.hostname.includes("vetnotes.pro");

    const navLinks = [
        { label: "Dashboard", href: "/", icon: "🏠" },
        { label: "Happy Valley", href: "/happy-valley", icon: "🏕️" },
        { label: "Quest Master", href: "/quest-master", icon: "📜" },
        {
            label: "AIVET",
            href: "https://aiva.vet",
            icon: "🛡️",
            external: true,
        },
        {
            label: "Vetsorcery",
            href: "https://vetsorcery.com",
            icon: "🐾",
            external: true,
        },
    ];

    function setMode(mode: "cozy" | "adventure" | "tactical") {
        player.setLens(mode);
    }
</script>

<nav
    class="glass-panel sticky top-4 z-50 mx-4 mt-4 px-6 py-3 rounded-2xl flex items-center justify-between"
>
    <!-- Left: Branding & Breadcrumbs -->
    <div class="flex items-center space-x-6">
        <a href="/" class="flex items-center space-x-2">
            <div
                class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20"
            >
                <span class="text-white text-xs font-bold">VN</span>
            </div>
            <span class="text-lg font-bold tracking-tight hidden md:block">
                [Vetnotes<span class="text-blue-400">.pro</span>]
            </span>
        </a>

        <div class="h-6 w-px bg-white/10 hidden md:block"></div>

        <!-- Breadcrumbs -->
        <div
            class="hidden lg:flex items-center space-x-2 text-sm text-white/40"
        >
            <a href="/" class="hover:text-white transition-colors">Home</a>
            {#each breadcrumbs as crumb}
                <span>/</span>
                <a
                    href={crumb.href}
                    class="hover:text-white transition-colors capitalize"
                    >{crumb.label}</a
                >
            {/each}
        </div>
    </div>

    <!-- Center: Main Navigation -->
    <div
        class="hidden md:flex items-center space-x-1 bg-white/[0.03] p-1 rounded-xl border border-white/5"
    >
        {#each navLinks as link}
            {#if link.external}
                <a
                    href={link.href}
                    target="_blank"
                    class="px-4 py-1.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center space-x-2"
                >
                    <span>{link.icon}</span>
                    <span class="hidden lg:inline">{link.label}</span>
                </a>
            {:else}
                <a
                    href={link.href}
                    class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2
                           {currentPath === link.href
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'}"
                >
                    <span>{link.icon}</span>
                    <span class="hidden lg:inline">{link.label}</span>
                </a>
            {/if}
        {/each}
    </div>

    <!-- Right: Player Stats & Mode Switcher -->
    <div class="flex items-center space-x-4">
        <!-- Progress Summary -->
        <div
            class="hidden sm:flex items-center space-x-3 px-3 py-1.5 bg-black/20 rounded-xl border border-white/5"
        >
            <div class="text-right">
                <p
                    class="text-[10px] uppercase text-white/40 font-bold leading-none"
                >
                    LVL {$player.level}
                </p>
                <p
                    class="text-xs font-mono font-bold text-blue-400 leading-none"
                >
                    {$player.xp} XP
                </p>
            </div>
            <div
                class="w-10 h-10 rounded-full border-2 border-blue-500/30 p-0.5 relative"
            >
                <div
                    class="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden"
                >
                    <img
                        src="/assets/dallas_avatar.jpg"
                        alt="Dallas McMillan"
                        class="w-full h-full object-cover"
                    />
                </div>
                <!-- XP Circle would go here -->
            </div>
        </div>

        <!-- Mode Switcher -->
        <div
            class="flex items-center bg-black/30 p-1 rounded-xl border border-white/5"
        >
            <button
                on:click={() => setMode("cozy")}
                class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all
                       {$player.preferredLens === 'cozy'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                    : 'text-white/40 hover:text-white'}"
                title="Cozy Mode: Relaxed clinic management"
            >
                Cozy
            </button>
            <button
                on:click={() => setMode("adventure")}
                class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all
                       {$player.preferredLens === 'adventure'
                    ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20'
                    : 'text-white/40 hover:text-white'}"
                title="Adventure Mode: Field clinics & exploration"
            >
                Adv
            </button>
            <button
                on:click={() => setMode("tactical")}
                class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all
                       {$player.preferredLens === 'tactical'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'text-white/40 hover:text-white'}"
                title="Tactical Mode: High-stakes biosecurity response"
            >
                Tac
            </button>
        </div>
    </div>
</nav>
