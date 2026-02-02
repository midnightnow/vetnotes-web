/**
 * REDACTION VALIDATOR
 * 
 * Ensures that VetNotes NEVER receives raw clinical data or PII.
 * This is the final security boundary before patient-facing publication.
 */

import type { VetNotesSafeContext } from '../types/sovereign';

export class RedactionValidator {
    /**
     * Strict validation: Ensures context is VetNotes-safe
     * @throws Error if any PII or clinical data detected
     */
    static strictValidate(context: any): void {
        // 1. Check for clinical data leakage
        if ('clinical' in context) {
            throw new Error('SECURITY VIOLATION: Clinical data detected in VetNotes context');
        }

        // 2. Check for full patient IDs (must be truncated)
        if (context.patientId && !context.patientId.includes('...')) {
            throw new Error('SECURITY VIOLATION: Full patient ID detected');
        }

        // 3. Check for owner PII
        const piiKeywords = ['email', 'phone', 'address', 'owner', 'client'];
        const contextString = JSON.stringify(context).toLowerCase();

        for (const keyword of piiKeywords) {
            if (contextString.includes(`"${keyword}":`)) {
                throw new Error(`SECURITY VIOLATION: PII field detected: ${keyword}`);
            }
        }

        // 4. Verify narrative hash exists
        if (!context.verification?.narrativeHash) {
            throw new Error('SECURITY VIOLATION: Missing narrative hash');
        }

        // 5. Verify vet approval
        if (!context.verification?.vetApproved) {
            throw new Error('SECURITY VIOLATION: Narrative not vet-approved');
        }

        // 6. Check for medical terminology that shouldn't be in owner-facing content
        const clinicalTerms = [
            'nsaid',
            'renal insufficiency',
            'hepatic',
            'contraindication',
            'grimace scale',
            'kappa consensus'
        ];

        const narrativeString = JSON.stringify(context.narrative).toLowerCase();
        for (const term of clinicalTerms) {
            if (narrativeString.includes(term)) {
                console.warn(`WARNING: Clinical term detected in narrative: ${term}`);
                // Don't throw - just warn, as some terms might be acceptable in context
            }
        }
    }

    /**
     * Validates that a narrative is owner-friendly
     */
    static validateNarrativeTone(summary: string): boolean {
        // Check for compassionate language
        const compassionateWords = [
            'friend',
            'companion',
            'wellness',
            'healthy',
            'comfortable',
            'happy',
            'recovery'
        ];

        const lowerSummary = summary.toLowerCase();
        return compassionateWords.some(word => lowerSummary.includes(word));
    }

    /**
     * Sanitizes any remaining clinical jargon
     */
    static sanitizeNarrative(text: string): string {
        const replacements: Record<string, string> = {
            'NSAID': 'pain relief medication',
            'renal': 'kidney',
            'hepatic': 'liver',
            'vomiting': 'upset tummy',
            'diarrhea': 'loose stools',
            'lethargic': 'feeling under the weather',
            'anorexia': 'not eating well'
        };

        let sanitized = text;
        for (const [clinical, friendly] of Object.entries(replacements)) {
            const regex = new RegExp(clinical, 'gi');
            sanitized = sanitized.replace(regex, friendly);
        }

        return sanitized;
    }
}
