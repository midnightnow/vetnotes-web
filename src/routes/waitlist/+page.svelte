<script lang="ts">
    let email = "";
    let submitted = false;
    let loading = false;

    async function handleSubmit() {
        if (!email) return;
        loading = true;

        // Simulate API call to waitlist service
        await new Promise((resolve) => setTimeout(resolve, 1000));

        submitted = true;
        loading = false;
    }
</script>

<svelte:head>
    <title>Waitlist - VetNotes.me</title>
</svelte:head>

<div
    class="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6"
>
    <div class="max-w-md w-full text-center space-y-8">
        <div class="flex flex-col items-center space-y-4">
            <div
                class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20"
            >
                <svg
                    class="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                </svg>
            </div>
            <h1 class="text-4xl font-bold tracking-tight">
                [Vetnotes<span class="text-blue-400">.pro</span>]
            </h1>
            <p class="text-gray-400 text-lg">
                Join the future of clinical intelligence.
            </p>
        </div>

        <div
            class="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
        >
            {#if !submitted}
                <h2 class="text-2xl font-bold mb-2">Join the Waitlist</h2>
                <p class="text-sm text-gray-400 mb-8">
                    Secure your clinical seat. Be the first to access the
                    Sovereign Vet platform.
                </p>

                <form on:submit|preventDefault={handleSubmit} class="space-y-4">
                    <div>
                        <input
                            type="email"
                            bind:value={email}
                            placeholder="your@clinic.email"
                            required
                            class="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder-white/20"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        class="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2"
                    >
                        {#if loading}
                            <svg
                                class="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            <span>Joining...</span>
                        {:else}
                            <span>Reserve My Spot</span>
                        {/if}
                    </button>
                </form>
            {:else}
                <div class="py-8 space-y-4 animate-in zoom-in-95 duration-300">
                    <div
                        class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <svg
                            class="w-8 h-8 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold">You're in!</h2>
                    <p class="text-gray-400 text-sm leading-relaxed">
                        We've received your request. Watch your inbox for a
                        verification link and your Sovereign Clinician
                        onboarding steps.
                    </p>
                    <a
                        href="/"
                        class="inline-block pt-4 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                        Return to Dashboard
                    </a>
                </div>
            {/if}
        </div>

        <p
            class="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold"
        >
            Zero Data Retention Policy Active
        </p>
    </div>
</div>
