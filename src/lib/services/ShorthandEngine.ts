/**
 * Shorthand Engine for VetNotes Pro
 * 
 * Transforms clinical triggers (*path:, *tox:, *lesion:) into structured data fragments.
 * Supports Multi-Axis Classification and research-grade standardization.
 */

export interface ShorthandMatch {
    trigger: string;
    axis: string;
    startIndex: number;
    endIndex: number;
}

export type AxisType = 'pathology' | 'toxicology' | 'lesion_description' | 'instrumentation' | 'billing';

export const SHORTHAND_TRIGGERS: Record<string, AxisType> = {
    '*path:': 'pathology',
    '*tox:': 'toxicology',
    '*lesion:': 'lesion_description',
    '*vital:': 'instrumentation',
    '*bill:': 'billing'
};

export class ShorthandEngine {
    /**
     * Scans text for clinical shorthand triggers
     */
    static scan(text: string): ShorthandMatch[] {
        const matches: ShorthandMatch[] = [];
        const regex = /^\*(path|tox|lesion|vital|bill):/gm;

        let match;
        while ((match = regex.exec(text)) !== null) {
            const trigger = match[0];
            matches.push({
                trigger,
                axis: SHORTHAND_TRIGGERS[trigger],
                startIndex: match.index,
                endIndex: match.index + trigger.length
            });
        }

        return matches;
    }

    /**
     * Expands a multi-axis selection into a structured SOAP fragment
     */
    static expand(axis: AxisType, data: Record<string, string>): string {
        switch (axis) {
            case 'lesion_description':
                return this.expandLesion(data);
            case 'pathology':
                return this.expandPathology(data);
            case 'toxicology':
                return this.expandToxicology(data);
            case 'billing':
                return this.expandBilling(data);
            default:
                return JSON.stringify(data, null, 2);
        }
    }

    private static expandBilling(data: Record<string, string>): string {
        return `
[BILLING SNAPSHOT]
SKU Code: ${data.code || 'UNTRACKED'}
Description: ${data.description || 'General Service'}
Quantity: ${data.qty || '1'}
Notes: ${data.notes || 'Added via Volatile Bridge'}
`.trim();
    }

    private static expandLesion(data: Record<string, string>): string {
        return `
[LESION DESCRIPTION - MULTI-AXIS]
Morphology: ${data.morphology || 'N/A'}
Configuration: ${data.configuration || 'N/A'}
Distribution: ${data.distribution || 'N/A'}
Evolution: ${data.evolution || 'Secondary changes: ' + (data.secondary || 'None')}
Anatomical Site: ${data.site || 'Unspecified'}
`.trim();
    }

    private static expandPathology(data: Record<string, string>): string {
        return `
[PATHOLOGY MODULE]
Source: ${data.source || 'N/A'}
Sampling: ${data.method || 'N/A'}
Fixative: ${data.fixative || '10% Neutral Buffered Formalin'}
Clinical History: ${data.history || 'See Subjective'}
`.trim();
    }

    private static expandToxicology(data: Record<string, string>): string {
        return `
[TOXICOLOGY PROTOCOL]
Agent: ${data.agent || 'Unknown'}
Exposure: ${data.exposure_time || 'N/A'} ago
Signs: ${data.signs || 'N/A'}
Action: ${data.decontamination || 'N/A'}
`.trim();
    }
}
