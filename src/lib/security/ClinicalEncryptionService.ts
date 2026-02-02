/**
 * ClinicalEncryptionService.ts
 * 
 * Provides AES-256-GCM encryption for HIPAA-compliant storage of voice and transcripts.
 * Leverages the Web Crypto API for high-performance, hardware-accelerated encryption.
 */

import { StateSigner } from './StateSigner';

const ALGORITHM = 'AES-256-GCM';
const KEY_DERIVATION_ALGO = 'PBKDF2';
const ITERATIONS = 100000;
const SALT_SIZE = 16;
const IV_SIZE = 12; // Standard for AES-GCM

export class ClinicalEncryptionService {
    /**
     * Derives a cryptographic key from a master secret (e.g., clinic/session ID).
     */
    private static async deriveKey(masterSecret: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(masterSecret),
            { name: KEY_DERIVATION_ALGO },
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: KEY_DERIVATION_ALGO,
                salt: salt,
                iterations: ITERATIONS,
                hash: 'SHA-256'
            },
            baseKey,
            { name: ALGORITHM, length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypts clinical data (Buffer or JSON) and returns a sealed envelope.
     */
    static async encrypt(data: any, masterSecret: string): Promise<any> {
        const encoder = new TextEncoder();
        const rawData = typeof data === 'string' ? encoder.encode(data) :
            data instanceof Uint8Array ? data :
                encoder.encode(JSON.stringify(data));

        const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
        const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
        const key = await this.deriveKey(masterSecret, salt);

        const ciphertext = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            key,
            rawData
        );

        const envelope = {
            ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
            iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
            salt: btoa(String.fromCharCode(...new Uint8Array(salt))),
            _v: 'v1_gcm'
        };

        // Anchor the encrypted envelope to the Verified Ledger
        return await StateSigner.seal(envelope);
    }

    /**
     * Decrypts a sealed envelope back to its original format.
     */
    static async decrypt(sealedEnvelope: any, masterSecret: string): Promise<any> {
        // 1. Verify integrity via StateSigner
        const envelope = await StateSigner.open(sealedEnvelope);
        if (!envelope) {
            throw new Error('SECURITY_VIOLATION: Encrypted envelope integrity failure.');
        }

        const salt = new Uint8Array(atob(envelope.salt).split('').map(c => c.charCodeAt(0)));
        const iv = new Uint8Array(atob(envelope.iv).split('').map(c => c.charCodeAt(0)));
        const ciphertext = new Uint8Array(atob(envelope.ciphertext).split('').map(c => c.charCodeAt(0)));

        const key = await this.deriveKey(masterSecret, salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            ciphertext
        );

        const decoded = new TextDecoder().decode(decrypted);
        try {
            return JSON.parse(decoded);
        } catch {
            return decoded; // Return as string if not JSON
        }
    }
}
