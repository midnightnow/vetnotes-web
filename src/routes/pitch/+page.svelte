<script lang="ts">
    import { fade, fly, scale } from "svelte/transition";
    import { onMount } from "svelte";

    const verticals = [
        {
            id: "valley-vet",
            title: "Valley Vet",
            tagline: "The Sims meets Veterinary Medicine",
            audience: "Consumer Game",
            revenue: "$9.99/mo Subscription",
            features: [
                "3D Clinic Management",
                "Voice AI Consultations",
                "Pet Social Network",
            ],
            gradient: "from-blue-500 to-cyan-400",
        },
        {
            id: "northern-shield",
            title: "Northern Shield",
            tagline: "AUSVETPLAN Biosecurity MMORPG",
            audience: "Professional & Government",
            revenue: "Government Contracts ($50K+)",
            features: [
                "Epidemiological Simulation",
                "Incident Command Training",
                "Real-time Crisis Response",
            ],
            gradient: "from-red-600 to-orange-500",
        },
        {
            id: "vetsorcery",
            title: "VetSorcery",
            tagline: "The Clinical Intelligence Layer",
            audience: "Medical Professionals",
            revenue: "$99-$499/mo SaaS",
            features: [
                "AIVA Empathy Engine",
                "Sovereign Clinical Ledger",
                "Revenue Optimization",
            ],
            gradient: "from-purple-600 to-indigo-500",
        },
    ];

    let currentVertical = 0;

    onMount(() => {
        const interval = setInterval(() => {
            currentVertical = (currentVertical + 1) % verticals.length;
        }, 8000);
        return () => clearInterval(interval);
    });
</script>

<div
    class="pitch-container bg-[#020617] text-white min-h-screen overflow-x-hidden"
>
    <!-- Hero Section -->
    <section
        class="relative h-screen flex items-center justify-center p-8 text-center overflow-hidden"
    >
        <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]"
        ></div>

        <div class="relative z-10 max-w-4xl">
            <div
                class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8"
                in:fade
            >
                <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"
                ></span>
                <span
                    class="text-[10px] font-bold uppercase tracking-widest text-blue-400"
                    >Valley Vet Alpha Launch</span
                >
            </div>

            <h1
                class="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none"
                in:fly={{ y: 50, duration: 1000 }}
            >
                The World's First <br />
                <span
                    class="bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-fill-color"
                    >Generative Kingdom</span
                >
            </h1>

            <p
                class="text-xl md:text-2xl text-white/60 font-medium mb-12 max-w-2xl mx-auto"
                in:fade={{ delay: 500 }}
            >
                Bridging the gap between entertainment, professional training,
                and clinical intelligence through sovereign AI.
            </p>

            <div
                class="flex flex-col sm:flex-row items-center justify-center gap-4"
                in:fade={{ delay: 800 }}
            >
                <a
                    href="/happy-valley"
                    class="px-8 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all"
                >
                    EXPLORE THE ALPHA
                </a>
                <button
                    class="px-8 py-4 bg-white/5 border border-white/10 font-bold rounded-2xl hover:bg-white/10 transition-all"
                >
                    WATCH THE MOONSHOT
                </button>
            </div>
        </div>

        <!-- Floating Elements -->
        <div
            class="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20"
        >
            <div class="w-1 h-12 bg-white rounded-full"></div>
        </div>
    </section>

    <!-- The Verticals -->
    <section class="py-24 px-8 max-w-7xl mx-auto">
        <h2 class="text-4xl font-black mb-16 text-center">
            Three Verticals. One Engine.
        </h2>

        <div class="grid lg:grid-cols-3 gap-8">
            {#each verticals as v}
                <div
                    class="group relative p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all"
                >
                    <div
                        class={`absolute inset-0 bg-gradient-to-br ${v.gradient} opacity-0 group-hover:opacity-5 rounded-[2.5rem] transition-opacity`}
                    ></div>

                    <span
                        class="text-[10px] font-black uppercase text-white/40 tracking-widest mb-4 block"
                        >{v.audience}</span
                    >
                    <h3 class="text-3xl font-black mb-2">{v.title}</h3>
                    <p class="text-white/60 font-medium mb-8">{v.tagline}</p>

                    <ul class="space-y-4 mb-8">
                        {#each v.features as feature}
                            <li
                                class="flex items-center space-x-3 text-sm font-bold"
                            >
                                <span class="text-blue-500">✓</span>
                                <span>{feature}</span>
                            </li>
                        {/each}
                    </ul>

                    <div class="pt-6 border-t border-white/5">
                        <span
                            class="text-[10px] font-black text-white/30 uppercase"
                            >Revenue Model</span
                        >
                        <p class="font-black text-lg">{v.revenue}</p>
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- The Scale -->
    <section class="py-24 bg-white/5 relative overflow-hidden">
        <div class="max-w-4xl mx-auto px-8 text-center">
            <h2 class="text-5xl font-black mb-8 tracking-tighter text-blue-400">
                1,000 Concurrent Clinics
            </h2>
            <p class="text-xl text-white/70 font-medium leading-relaxed mb-16">
                Our architecture is designed for population-scale simulation.
                Each virtual clinic runs 5 AI veterinarians processing 100
                consultations daily.
            </p>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div class="p-6 rounded-2xl bg-black/40">
                    <div class="text-3xl font-black mb-1 text-white">100K</div>
                    <div
                        class="text-[10px] font-black uppercase tracking-widest text-white/40"
                    >
                        Daily Consults
                    </div>
                </div>
                <div class="p-6 rounded-2xl bg-black/40">
                    <div class="text-3xl font-black mb-1 text-white">5K</div>
                    <div
                        class="text-[10px] font-black uppercase tracking-widest text-white/40"
                    >
                        AI Agents
                    </div>
                </div>
                <div class="p-6 rounded-2xl bg-black/40">
                    <div class="text-3xl font-black mb-1 text-white">0.3s</div>
                    <div
                        class="text-[10px] font-black uppercase tracking-widest text-white/40"
                    >
                        Voice Latency
                    </div>
                </div>
                <div class="p-6 rounded-2xl bg-black/40">
                    <div class="text-3xl font-black mb-1 text-white">$2.3B</div>
                    <div
                        class="text-[10px] font-black uppercase tracking-widest text-white/40"
                    >
                        Total TAM
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Call to Action -->
    <section class="py-32 px-8 text-center">
        <div
            class="max-w-2xl mx-auto p-12 rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/20"
        >
            <h2 class="text-4xl font-black mb-6">Join the Movement</h2>
            <p class="text-lg font-medium text-white/80 mb-10">
                We are building the future of veterinary science. Be part of the
                sovereign clinical alliance.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    class="px-8 py-4 bg-white text-blue-700 font-black rounded-2xl"
                    >INVESTOR INQUIRY</button
                >
                <button
                    class="px-8 py-4 bg-blue-800/40 border border-blue-400/30 font-black rounded-2xl"
                    >PARTNER WITH US</button
                >
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer
        class="py-12 border-t border-white/5 text-center text-white/20 text-[10px] font-black uppercase tracking-[0.2em]"
    >
        © 2026 Vet Kingdom | Dr. Dallas McMillan, DVM
    </footer>
</div>

<style>
    .text-fill-color {
        -webkit-text-fill-color: transparent;
    }
</style>
