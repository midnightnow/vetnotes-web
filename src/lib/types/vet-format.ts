/**
 * .VET UNIVERSAL COMMUNICATION FORMAT (UCF)
 * 
 * The standard interoperability format for the Sovereign Clinical Alliance.
 * Based on the VetNotes open standard, used for high-fidelity clinical transfers
 * and patient-facing narratives.
 * 
 * FILE EXTENSION: .vet
 * MIME TYPE: application/vnd.vetsorcery.vet+json
 */

import type { SovereignPatientContext, VetNotesSafeContext } from './sovereign';

export interface VetFile {
    version: "1.0.0";
    format: "UCF"; // Universal Communication Format
    metadata: {
        origin: "VetNotes" | "VetSorcery" | "AiVet";
        timestamp: string;
        isScrubbed: boolean; // True if PII/Clinical data has been removed (VetNotes mode)
        cryptographicSeal: string; // Master hash of the content
    };
    // The actual payload is either a full Sovereign context or a scrubbed VetNotes context
    payload: SovereignPatientContext | VetNotesSafeContext;
}

/**
 * Helper to wrap a context into a .vet file structure
 */
export function wrapAsVetFile(
    payload: SovereignPatientContext | VetNotesSafeContext,
    origin: "VetNotes" | "VetSorcery" | "AiVet"
): VetFile {
    const isScrubbed = !('clinical' in payload);
    return {
        version: "1.0.0",
        format: "UCF",
        metadata: {
            origin,
            timestamp: new Date().toISOString(),
            isScrubbed,
            cryptographicSeal: (payload as any).sovereignHash || (payload as any).verification?.narrativeHash || ""
        },
        payload
    };
}
