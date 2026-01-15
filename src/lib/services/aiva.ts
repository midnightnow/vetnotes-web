// AIVA SOAP Structuring Service
// Takes raw transcript and structures it into veterinary SOAP format

const AIVA_SYSTEM_PROMPT = `You are AIVA (Augmented Intelligence for Veterinary Applications), a clinical documentation assistant.
Your role is to convert raw consultation transcripts into structured SOAP notes.

Guidelines:
- Be concise and use standard veterinary terminology
- Extract key clinical findings accurately
- Flag any mentioned but unbilled procedures
- Never fabricate clinical signs that weren't mentioned
- If information is missing, note it as "Not recorded" rather than inferring

Output Format:
S: [Subjective - owner complaints, history]
O: [Objective - physical exam findings, vitals]
A: [Assessment - differential diagnoses, clinical impression]
P: [Plan - treatments, medications, follow-up]`;

export interface SOAPNote {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    missedCharges?: string[];
}

export async function structureToSOAP(transcript: string, useCloud = false): Promise<SOAPNote> {
    if (useCloud && typeof window !== 'undefined') {
        // Use Gemini API via server-side function
        return await structureViaGemini(transcript);
    }

    // Local rule-based structuring (fallback)
    return structureLocally(transcript);
}

async function structureViaGemini(transcript: string): Promise<SOAPNote> {
    try {
        const response = await fetch('/api/structure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript })
        });

        if (!response.ok) {
            throw new Error('Gemini API call failed');
        }

        return await response.json();
    } catch (error) {
        console.warn('Cloud structuring failed, falling back to local:', error);
        return structureLocally(transcript);
    }
}

function structureLocally(transcript: string): SOAPNote {
    // Simple rule-based parser for offline mode
    const lines = transcript.toLowerCase();

    // Extract sections using common patterns
    const subjective = extractSubjective(transcript);
    const objective = extractObjective(transcript);
    const assessment = extractAssessment(transcript);
    const plan = extractPlan(transcript);
    const missedCharges = detectMissedCharges(transcript);

    return { subjective, objective, assessment, plan, missedCharges };
}

function extractSubjective(text: string): string {
    // Look for owner-reported information
    const patterns = [
        /(?:owner|client)\s+(?:reports?|states?|says?|noted?)\s+(.+?)(?:\.|$)/gi,
        /(?:presented?|came in)\s+(?:for|with)\s+(.+?)(?:\.|$)/gi,
        /history\s+of\s+(.+?)(?:\.|$)/gi
    ];

    const findings: string[] = [];
    for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            findings.push(match[1].trim());
        }
    }

    return findings.length > 0
        ? findings.join('. ') + '.'
        : 'See raw transcript for subjective findings.';
}

function extractObjective(text: string): string {
    // Look for clinical findings
    const patterns = [
        /(?:hr|heart rate)[:\s]+(\d+)/gi,
        /(?:rr|resp(?:iratory)? rate)[:\s]+(\d+)/gi,
        /(?:temp(?:erature)?)[:\s]+([\d.]+)/gi,
        /(?:mm|mucous membranes?)[:\s]+(\w+)/gi,
        /(?:crt)[:\s]+([<>]?\s*\d+)/gi
    ];

    const findings: string[] = [];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            findings.push(match[0]);
        }
    }

    return findings.length > 0
        ? findings.join('. ') + '.'
        : 'Physical examination performed. See transcript for details.';
}

function extractAssessment(text: string): string {
    const patterns = [
        /(?:likely|probable|suspected?|r\/o|rule out)\s+(.+?)(?:\.|$)/gi,
        /(?:differential|ddx)[:\s]+(.+?)(?:\.|$)/gi
    ];

    const findings: string[] = [];
    for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            findings.push(match[1].trim());
        }
    }

    return findings.length > 0
        ? findings.join('; ')
        : 'Clinical assessment pending review.';
}

function extractPlan(text: string): string {
    const patterns = [
        /(?:prescrib(?:ed?|ing)|gave|administered?|dispensed?)\s+(.+?)(?:\.|$)/gi,
        /(?:recommend|suggest|advise)[:\s]+(.+?)(?:\.|$)/gi,
        /(?:recheck|follow[- ]?up|return)\s+(.+?)(?:\.|$)/gi
    ];

    const findings: string[] = [];
    for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            findings.push(match[1].trim());
        }
    }

    return findings.length > 0
        ? findings.join('. ') + '.'
        : 'Treatment plan to be documented.';
}

function detectMissedCharges(text: string): string[] {
    const chargeableItems = [
        { pattern: /(?:nail\s*(?:trim|clip))/gi, item: 'Nail Trim' },
        { pattern: /(?:anal\s*gland)/gi, item: 'Anal Gland Expression' },
        { pattern: /(?:ear\s*clean)/gi, item: 'Ear Cleaning' },
        { pattern: /(?:fecal|faecal|feces)/gi, item: 'Fecal Float' },
        { pattern: /(?:blood\s*(?:work|test)|cbc|biochem)/gi, item: 'Blood Work' },
        { pattern: /(?:injection|inj\.?|administered)/gi, item: 'Injection Fee' },
        { pattern: /(?:catheter|iv\s*cath)/gi, item: 'IV Catheter' },
        { pattern: /(?:fluid|lactated|lrs|saline)/gi, item: 'IV Fluids' },
        { pattern: /(?:sedation|sedate)/gi, item: 'Sedation' },
        { pattern: /(?:xray|x-ray|radiograph)/gi, item: 'Radiograph' },
        { pattern: /(?:ultrasound|sono)/gi, item: 'Ultrasound' }
    ];

    const detected: string[] = [];
    for (const { pattern, item } of chargeableItems) {
        if (pattern.test(text)) {
            detected.push(item);
        }
    }

    return detected;
}

export function formatSOAPAsText(note: SOAPNote): string {
    let output = `S: ${note.subjective}\n`;
    output += `O: ${note.objective}\n`;
    output += `A: ${note.assessment}\n`;
    output += `P: ${note.plan}`;

    if (note.missedCharges && note.missedCharges.length > 0) {
        output += `\n\n⚠️ Potential Missed Charges: ${note.missedCharges.join(', ')}`;
    }

    return output;
}

export async function pushToPIMS(note: SOAPNote, pimsType: 'ezyvet' | 'rxworks' | 'ascend' = 'ezyvet'): Promise<{ success: boolean; message: string }> {
    console.log(`Pushing to ${pimsType}...`, note);

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real implementation, this would call a secure cloud function 
    // or a local PIMS bridge (like Hardcard or a custom driver)

    const success = Math.random() > 0.1; // 90% success rate for simulation

    if (success) {
        return {
            success: true,
            message: `Successfully pushed to ${pimsType}. Patient record updated.`
        };
    } else {
        return {
            success: false,
            message: `Connection to ${pimsType} timed out. Please check your credentials in settings.`
        };
    }
}
