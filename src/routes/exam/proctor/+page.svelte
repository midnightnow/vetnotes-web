<script lang="ts">
    import { onMount } from "svelte";

    interface StudentStatus {
        id: string;
        currentCase: number;
        timeRemaining: number;
        safetyScore: number;
        status: "active" | "distress" | "completed";
        lastActivity: string;
    }

    let students: StudentStatus[] = [
        {
            id: "STU001",
            currentCase: 4,
            timeRemaining: 5400,
            safetyScore: 92,
            status: "active",
            lastActivity: "Auscultation",
        },
        {
            id: "STU002",
            currentCase: 7,
            timeRemaining: 3200,
            safetyScore: 65,
            status: "distress",
            lastActivity: "Drug Calculation",
        },
        {
            id: "STU003",
            currentCase: 10,
            timeRemaining: 120,
            safetyScore: 98,
            status: "completed",
            lastActivity: "PIMS Sync",
        },
    ];

    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    onMount(() => {
        const interval = setInterval(() => {
            students = students.map((s) => ({
                ...s,
                timeRemaining: Math.max(0, s.timeRemaining - 1),
            }));
        }, 1000);
        return () => clearInterval(interval);
    });
</script>

<div class="min-h-screen bg-[#0a0a0c] text-white p-8 font-sans">
    <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-center mb-12">
            <div>
                <h1
                    class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
                >
                    ValleyVet Proctor Dashboard
                </h1>
                <p class="text-white/40 text-sm mt-1">
                    Live Clinical Exam Monitoring • 2026 Feb Cohort
                </p>
            </div>
            <div class="flex space-x-4">
                <div
                    class="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl text-center"
                >
                    <p class="text-[10px] text-blue-400 uppercase font-bold">
                        Active Students
                    </p>
                    <p class="text-xl font-mono text-blue-100">
                        {students.filter((s) => s.status !== "completed")
                            .length}
                    </p>
                </div>
                <div
                    class="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-center"
                >
                    <p class="text-[10px] text-emerald-400 uppercase font-bold">
                        Completion Rate
                    </p>
                    <p class="text-xl font-mono text-emerald-100">33%</p>
                </div>
            </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each students as student}
                <div
                    class="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden"
                >
                    {#if student.status === "distress"}
                        <div
                            class="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none"
                        ></div>
                    {/if}

                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <span class="text-xs font-mono text-white/40"
                                >#{student.id}</span
                            >
                            <h3 class="text-lg font-bold">
                                Case {student.currentCase}/10
                            </h3>
                        </div>
                        <div class="text-right">
                            <p
                                class="text-xs text-white/40 uppercase font-bold"
                            >
                                Time Left
                            </p>
                            <p
                                class="text-xl font-mono {student.timeRemaining <
                                600
                                    ? 'text-red-400'
                                    : 'text-blue-400'}"
                            >
                                {formatTime(student.timeRemaining)}
                            </p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between text-xs mb-1">
                                <span
                                    class="text-white/40 uppercase font-bold tracking-wider"
                                    >Clinical Integrity</span
                                >
                                <span
                                    class={student.safetyScore < 70
                                        ? "text-red-400"
                                        : "text-emerald-400"}
                                >
                                    {student.safetyScore}%
                                </span>
                            </div>
                            <div
                                class="h-2 w-full bg-white/5 rounded-full overflow-hidden"
                            >
                                <div
                                    class="h-full transition-all duration-1000 {student.safetyScore <
                                    70
                                        ? 'bg-red-500'
                                        : 'bg-emerald-500'}"
                                    style="width: {student.safetyScore}%"
                                ></div>
                            </div>
                        </div>

                        <div
                            class="pt-4 border-t border-white/5 flex justify-between items-center"
                        >
                            <div
                                class="text-[10px] text-white/30 truncate max-w-[150px]"
                            >
                                Last activity: <span class="text-white/60"
                                    >{student.lastActivity}</span
                                >
                            </div>
                            <button
                                class="bg-white/5 hover:bg-white/10 text-white/60 text-[10px] px-3 py-1 rounded-lg transition-colors font-bold uppercase tracking-wider"
                            >
                                View Feed
                            </button>
                        </div>
                    </div>

                    {#if student.status === "distress"}
                        <div
                            class="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                        >
                            <p
                                class="text-[10px] text-red-100 font-bold leading-tight"
                            >
                                ⚠️ CLINICAL DISTRESS ALERT: Safety score below
                                70% during drug calculation.
                            </p>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .glass-panel {
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    }

    @keyframes pulse-slow {
        0%,
        100% {
            opacity: 0.05;
        }
        50% {
            opacity: 0.15;
        }
    }
    .animate-pulse-slow {
        animation: pulse-slow 3s infinite ease-in-out;
    }
</style>
