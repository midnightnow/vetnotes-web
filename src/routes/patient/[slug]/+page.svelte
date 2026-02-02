<script lang="ts">
  import { onMount } from 'svelte';
  import type { VetNotesSafeContext } from '$lib/types/sovereign';
  import type { PageData } from './$types';

  export let data: PageData;
  let verificationStatus: 'verified' | 'unverified' | 'loading' = 'loading';
  let verificationHash = '';

  // Simulate data loaded from server (in real app this comes from load function)
  // For demo purposes, we might need to rely on what's passed or stored
  // Assuming data.patientContext is populated by the server load function
  const patientContext: VetNotesSafeContext = data.patientContext;

  onMount(async () => {
    if (!patientContext) {
        verificationStatus = 'unverified';
        return;
    }

    // Verify narrative integrity client-side
    const narrativeHash = await computeNarrativeHash(patientContext.narrative);
    
    // Normalize hash comparison (case-insensitive)
    if (patientContext.verification && 
        narrativeHash.toLowerCase() === patientContext.verification.narrativeHash.toLowerCase()) {
      verificationStatus = 'verified';
    } else {
      verificationStatus = 'unverified';
      console.error('NARRATIVE TAMPERING DETECTED');
      console.error('Computed:', narrativeHash);
      console.error('Expected:', patientContext.verification?.narrativeHash);
    }
  });
  
  async function computeNarrativeHash(narrative: any): Promise<string> {
    // Client-side hash verification (Web Crypto API)
    // We must ensure the serialization matches exactly what was signed
    // For robust implementation, we'd use a canonical JSON stringify
    
    // Simplified for demo: just hash specific fields we know are critical
    const contentToHash = JSON.stringify({
        title: narrative.storyTitle,
        summary: narrative.summary,
        moments: narrative.keyMoments
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(contentToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
</script>

<div class="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
    
    <!-- HEADER -->
    <div class="bg-indigo-600 px-8 py-6 text-white text-center">
        <h1 class="text-3xl font-bold tracking-tight">VetNotes</h1>
        <p class="text-indigo-100 mt-2">Sovereign Clinical Intelligence • PII-Free</p>
    </div>

    <div class="p-8">
        <!-- Noctua Verification Badge -->
        <div class="mb-8 flex justify-center">
            {#if verificationStatus === 'verified'}
            <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-full flex items-center shadow-sm animate-pulse">
                <span class="mr-2 text-xl">✓</span>
                <span class="font-medium mr-3">Noctua Verified</span>
                <span class="font-mono text-xs opacity-75 hidden sm:inline-block">
                SHA256:{patientContext.verification.narrativeHash.slice(0, 8)}...
                </span>
            </div>
            {:else if verificationStatus === 'unverified'}
            <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                <span class="mr-2 text-xl">⚠️</span>
                <span class="font-bold">Verification Failed — Contact your clinic</span>
            </div>
            {:else}
            <div class="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Cryptographic Provenance...
            </div>
            {/if}
        </div>
        
        <!-- Patient Story -->
        <article class="prose prose-indigo lg:prose-xl mx-auto">
            <h2 class="text-center text-3xl font-bold text-gray-900 mb-6">{patientContext.narrative.storyTitle}</h2>
            
            <div class="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-indigo-900 text-lg leading-relaxed italic mb-10">
                "{patientContext.narrative.summary}"
            </div>
            
            <div class="space-y-8">
                {#each patientContext.narrative.keyMoments as moment}
                <div class="relative pl-8 border-l-4 border-indigo-200 hover:border-indigo-500 transition-colors">
                    <div class="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-indigo-500"></div>
                    <h3 class="font-bold text-xl text-gray-900 mb-2">{moment.title}</h3>
                    <p class="text-gray-600 mb-2">{moment.description}</p>
                    <time class="text-sm text-gray-400 font-medium">
                        {new Date(moment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                </div>
                {/each}
            </div>
        </article>
        
        <!-- Owner Guidance & Footer -->
        <div class="mt-16 border-t border-gray-100 pt-8">
            <div class="bg-blue-50 p-6 rounded-xl flex items-start">
            <span class="text-3xl mr-4">🦉</span>
            <div>
                <h4 class="font-bold text-blue-900 text-lg mb-1">About Your Pet's VetNote</h4>
                <p class="text-blue-800 text-sm leading-relaxed">
                This story was created by your veterinary team using <strong>Sovereign Clinical Intelligence</strong>. 
                Every detail has been verified by the Noctua system and scrubbed of private medical information (PII). 
                Ideally, you would scan the QR code on your invoice to view this secure record.
                </p>
            </div>
            </div>
            
            <p class="text-center text-xs text-gray-400 mt-8">
            Secured by AiVet Sovereign Alliance • Zero Data Retention • PII Redaction Active
            </p>
        </div>
    </div>
  </div>
</div>
