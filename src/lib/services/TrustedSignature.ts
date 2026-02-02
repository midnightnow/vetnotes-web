import { sha256 } from 'js-sha3';

/**
 * TrustedSignature Service
 * 
 * Provides cryptographic evidence locking for clinical data.
 * Every clinical consult must be signed before it can be committed to the 
 * Sovereign Clinical Alliance ledger.
 */

export interface ClinicalPayload {
    caseId: string;
    transcript: string;
    axes: {
        path?: string;
        tox?: string;
        vital?: string;
    };
    revenue: number;
    timestamp: number;
}

export class TrustedSignature {
    private static SECRET_KEY = "SOVEREIGN_VET_INTEGRITY_KEY"; // In production, this would be an environment variable

    /**
     * Generates a SHA-256 HMAC signature for a clinical payload.
     */
    static signPayload(payload: ClinicalPayload): string {
        const dataString = JSON.stringify(payload);
        return sha256.hmac(this.SECRET_KEY, dataString);
    }

    /**
     * Verifies if a signature matches the given clinical payload.
     */
    static verifySignature(payload: ClinicalPayload, signature: string): boolean {
        const expectedSignature = this.signPayload(payload);
        return expectedSignature === signature;
    }

    /**
     * Locks the evidence by preparing the final signed artifact.
     * This is the "Evidence-Locked" state required for wholesale settlements.
     */
    static lockEvidence(payload: ClinicalPayload): { hash: string; seal: string } {
        const hash = sha256(JSON.stringify(payload));
        const seal = this.signPayload(payload);

        console.log(`[TrustedSignature] Evidence Locked for Case ${payload.caseId}`);
        console.log(`[TrustedSignature] Hash: ${hash}`);
        console.log(`[TrustedSignature] Seal: ${seal}`);

        return { hash, seal };
    }
}
