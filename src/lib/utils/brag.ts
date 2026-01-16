/**
 * Brag Clip Generator & Viral Sharing Utility
 * Transforms a clinical success or biosecurity find into a shareable content piece.
 */

export interface BragData {
    species: string;
    credits: number;
    suburb: string;
    rank: string;
    image?: string;
    template?: "Space-to-Backyard-Zoom" | "Epic-Reveal" | "Planetary-Shield";
    lore?: string;
}

export async function generateBragCard(data: BragData): Promise<string> {
    console.log(`🎬 Rendering ${data.template || "Epic-Reveal"} for ${data.species}...`);

    // Simulate high-fidelity rendering delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Return a mock URI for the "rendered" content
    return `https://happy.valleyvet.online/brag/${data.suburb.toLowerCase()}-${Math.random().toString(36).substr(2, 6)}`;
}

export async function shareToTikTok(uri: string, data: BragData) {
    const text = `I just protected ${data.suburb} from ${data.species}! 🛡️\n+${data.credits} Bio-Credits. I'm a #PlanetaryDefender. Join the shield at ValleyVet.online 🌍`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Valley Vet Sentinel Achievement',
                text: text,
                url: uri
            });
            return true;
        } catch (e) {
            console.error("Share failed", e);
            return false;
        }
    } else {
        // Fallback for desktop: Copy to clipboard
        await navigator.clipboard.writeText(text);
        alert("Brag message copied to clipboard! Share on TikTok or Instagram Stories with #PlanetaryDefender");
        return true;
    }
}
