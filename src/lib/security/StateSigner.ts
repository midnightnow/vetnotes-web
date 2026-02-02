/**
 * StateSigner.ts
 * 
 * Implements the "Sovereign Audit" cryptographic anchoring for client-side state.
 * Prevents casual tampering (Save-Scumming) of exam scores and logic.
 */

const LOCAL_SECRET = "VET_SORCERY_LOCAL_LEDGER_KEY_V1";

export class StateSigner {
    /**
     * Generates a simple HMAC-like signature for the state object.
     * Uses the Web Crypto API for performance and standard alignment.
     */
    static async sign(data: any): Promise<string> {
        const msgBuffer = new TextEncoder().encode(JSON.stringify(data) + LOCAL_SECRET);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Verifies if the stored data matches its signature.
     */
    static async verify(data: any, signature: string): Promise<boolean> {
        const computed = await this.sign(data);
        return computed === signature;
    }

    /**
     * Wraps the payload with a signature envelope.
     */
    static async seal(payload: any) {
        const signature = await this.sign(payload);
        return {
            payload,
            signature,
            timestamp: Date.now(),
            _integrity: "signed_hpss_01"
        };
    }

    /**
     * Unwraps and verifies the payload. Returns null if integrity fails.
     */
    static async open(envelope: any): Promise<any | null> {
        if (!envelope || !envelope.payload || !envelope.signature) return null;

        const isValid = await this.verify(envelope.payload, envelope.signature);
        if (!isValid) {
            console.error("⚠️ [SECURITY] State Integrity Violation Detected");
            return null;
        }
        return envelope.payload;
    }
}
