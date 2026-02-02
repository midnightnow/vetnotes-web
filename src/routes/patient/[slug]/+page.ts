
import type { PageLoad } from './$types';
import type { VetNotesSafeContext } from '$lib/types/sovereign';

export const load: PageLoad = async ({ params }) => {
    const slug = params.slug;

    // In a real app, we would fetch data from an API using the slug.
    // For this demo, we will generate deterministic mock data based on the slug.

    // Check if it's a specific test case or just random
    const isJasper = slug.toLowerCase().includes('jasper');
    const name = isJasper ? "Jasper" : "Patient";
    const species = isJasper ? "Feline" : "Canine";

    // Mock Data mimicking what would come from the server
    const patientContext: VetNotesSafeContext = {
        patientId: slug.slice(0, 8) + "...",
        clinicId: "CLI-001...",
        verification: {
            narrativeHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // Placeholder
            timestamp: new Date().toISOString(),
            vetApproved: true
        },
        narrative: {
            storyTitle: `Visit Summary for ${name}`,
            summary: `${name} was a brave ${species.toLowerCase()} today! We examined her for some tummy trouble. She was very patient during the exam. We've prescribed some medication to help her feel better and she should be back to her normal self in a few days.`,
            keyMoments: [
                {
                    momentId: "moment-1",
                    title: "Physical Examination",
                    description: "Dr. McMillan checked her heart, lungs, and abdomen. Everything sounded clear, though her tummy was a bit sensitive.",
                    date: new Date().toISOString(),
                    type: 'WELLNESS',
                    mediaApprovedByVet: false,
                    tone: 'Hopeful',
                    _narrativeHash: "abc"
                },
                {
                    momentId: "moment-2",
                    title: "Treatment Plan",
                    description: "Started on a gentle diet and supportive medication.",
                    date: new Date().toISOString(),
                    type: 'RECOVERY',
                    mediaApprovedByVet: false,
                    tone: 'Relieved',
                    _narrativeHash: "def"
                }
            ],
            lastUpdated: new Date().toISOString()
        }
    };

    // Pre-calculate hash for the 'verified' badge to work
    // The client code uses: JSON.stringify({ title, summary, moments })
    // We need to match that exactly if we want the "Verified" tick.
    // Or we can just let it be unverified for realism, or hack it.
    // Let's try to make it verify.

    async function computeHash(narrative: any) {
        const contentToHash = JSON.stringify({
            title: narrative.storyTitle,
            summary: narrative.summary,
            moments: narrative.keyMoments
        });

        // Use crypto subtle if available (browser) or node crypto (server)
        // Since this is a universal load function, we might be on server or client.
        // Simplest is to just return the data and let the client re-hash it to check,
        // BUT we need to provide the *expected* hash in the data.

        // For simplicity in this demo script without bringing in crypto libs,
        // we will manually set the hash in the client component to match WHATEVER it computes,
        // OR we just accept that it might show "Unverified" unless we do the crypto here.

        // Actually, let's just use a hardcoded mocked hash for the UI to display,
        // and if it fails verification, that's a features (tamper detection).
        // But the user probably wants to see a nice "Verified" page.

        // Only browser crypto is reliably available in this context without extra imports in SvelteKit
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(contentToHash);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hash;
        }

        return "mock-hash-server-side";
    }

    patientContext.verification.narrativeHash = await computeHash(patientContext.narrative);

    return {
        patientContext
    };
};
