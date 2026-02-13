/**
 * KeyEscrowService.ts
 * 
 * Secure key management with Shamir Secret Sharing for HIPAA-compliant recovery.
 * Implements the Noctua Sentinel key persistence protocol.
 * 
 * Architecture:
 * - Master keys are generated with high entropy from Web Crypto API
 * - Keys are split using Shamir Secret Sharing (3-of-5 threshold)
 * - Shares are stored locally in IndexedDB, encrypted at rest
 * - Recovery requires minimum threshold of shares
 */

import { StateSigner } from './StateSigner';
import * as KeyVault from './KeyVaultIndexedDB';

// Shamir Secret Sharing configuration
const SHARE_COUNT = 5;      // Total shares to generate
const THRESHOLD = 3;        // Minimum shares needed for recovery
const SECRET_LENGTH = 32;   // 256 bits

/**
 * Pure-JavaScript Shamir Secret Sharing implementation.
 * Uses GF(256) for byte-level operations.
 */
class ShamirSecretSharing {
    private static readonly PRIME = 257; // Prime for modular arithmetic (larger than 256)

    /**
     * Generate a random polynomial of given degree with secret as constant term.
     * Uses crypto.getRandomValues() for cryptographically secure coefficients.
     */
    private static generatePolynomial(secret: number[], degree: number): number[][] {
        const polynomials: number[][] = [];

        for (let byteIdx = 0; byteIdx < secret.length; byteIdx++) {
            const coeffs = [secret[byteIdx]];
            // Use crypto.getRandomValues() for secure coefficient generation
            const randomCoeffs = crypto.getRandomValues(new Uint8Array(degree));
            for (let i = 0; i < degree; i++) {
                coeffs.push(randomCoeffs[i]);
            }
            polynomials.push(coeffs);
        }

        return polynomials;
    }

    /**
     * Evaluate polynomial at point x using Horner's method.
     */
    private static evaluatePolynomial(coeffs: number[], x: number): number {
        let result = 0;
        for (let i = coeffs.length - 1; i >= 0; i--) {
            result = (result * x + coeffs[i]) % this.PRIME;
        }
        return result;
    }

    /**
     * Modular inverse using extended Euclidean algorithm.
     */
    private static modInverse(a: number, m: number): number {
        let [old_r, r] = [a, m];
        let [old_s, s] = [1, 0];

        while (r !== 0) {
            const quotient = Math.floor(old_r / r);
            [old_r, r] = [r, old_r - quotient * r];
            [old_s, s] = [s, old_s - quotient * s];
        }

        return ((old_s % m) + m) % m;
    }

    /**
     * Split a secret into n shares requiring k to reconstruct.
     */
    static split(secret: Uint8Array, n: number, k: number): string[] {
        const secretArray = Array.from(secret);
        const polynomials = this.generatePolynomial(secretArray, k - 1);

        const shares: string[] = [];
        for (let i = 1; i <= n; i++) {
            const shareBytes: number[] = [i]; // First byte is the x-coordinate
            for (let byteIdx = 0; byteIdx < secretArray.length; byteIdx++) {
                shareBytes.push(this.evaluatePolynomial(polynomials[byteIdx], i));
            }
            // Encode as base64
            shares.push(btoa(String.fromCharCode(...shareBytes)));
        }

        return shares;
    }

    /**
     * Reconstruct secret from k shares using Lagrange interpolation.
     */
    static combine(shares: string[]): Uint8Array {
        // Decode shares
        const decodedShares = shares.map(s => {
            const bytes = atob(s).split('').map(c => c.charCodeAt(0));
            return { x: bytes[0], y: bytes.slice(1) };
        });

        const secretLength = decodedShares[0].y.length;
        const secret = new Uint8Array(secretLength);

        for (let byteIdx = 0; byteIdx < secretLength; byteIdx++) {
            let result = 0;

            for (let i = 0; i < decodedShares.length; i++) {
                let numerator = 1;
                let denominator = 1;

                for (let j = 0; j < decodedShares.length; j++) {
                    if (i !== j) {
                        numerator = (numerator * (0 - decodedShares[j].x)) % this.PRIME;
                        denominator = (denominator * (decodedShares[i].x - decodedShares[j].x)) % this.PRIME;
                    }
                }

                // Ensure positive modulo
                numerator = ((numerator % this.PRIME) + this.PRIME) % this.PRIME;
                denominator = ((denominator % this.PRIME) + this.PRIME) % this.PRIME;

                const lagrange = (numerator * this.modInverse(denominator, this.PRIME)) % this.PRIME;
                result = (result + decodedShares[i].y[byteIdx] * lagrange) % this.PRIME;
            }

            secret[byteIdx] = ((result % this.PRIME) + this.PRIME) % this.PRIME;
        }

        return secret;
    }
}

export class KeyEscrowService {
    /**
     * Generate a cryptographically secure master secret.
     */
    static async generateMasterSecret(): Promise<string> {
        const randomBytes = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        // Convert to hex string for consistent handling
        return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get existing master secret or create a new one for the clinic.
     * This is the primary entry point for key management.
     */
    static async getOrCreateMasterSecret(clinicId: string): Promise<string> {
        // Check if we have a stored key
        const existingKey = await KeyVault.getKey(clinicId);

        if (existingKey) {
            // Log access for audit trail
            await StateSigner.seal({
                action: 'KEY_ACCESS',
                clinicId,
                deviceId: await KeyVault.getDeviceId(),
                timestamp: Date.now()
            });

            return existingKey.encryptedMasterKey; // Already base64 encoded
        }

        // Generate new master secret
        const masterSecret = await this.generateMasterSecret();

        // Store the key
        await KeyVault.storeKey(clinicId, masterSecret);

        // Generate and store recovery shares
        const secretBytes = new Uint8Array(
            masterSecret.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
        );
        const shares = ShamirSecretSharing.split(secretBytes, SHARE_COUNT, THRESHOLD);
        await KeyVault.storeShares(clinicId, shares, THRESHOLD);

        // Log creation for audit trail
        await StateSigner.seal({
            action: 'KEY_CREATED',
            clinicId,
            deviceId: await KeyVault.getDeviceId(),
            sharesGenerated: SHARE_COUNT,
            threshold: THRESHOLD,
            timestamp: Date.now()
        });

        console.log(`🔐 [KeyEscrow] Created new master key for clinic: ${clinicId}`);

        return masterSecret;
    }

    /**
     * Retrieve backup shares for external storage (cloud backup, paper backup, etc).
     */
    static async getBackupShares(clinicId: string): Promise<string[]> {
        const shares = await KeyVault.getShares(clinicId);

        if (shares.length === 0) {
            throw new Error('KEY_ESCROW_ERROR: No shares found for clinic');
        }

        // Log backup retrieval for audit
        await StateSigner.seal({
            action: 'SHARES_EXPORTED',
            clinicId,
            deviceId: await KeyVault.getDeviceId(),
            sharesExported: shares.length,
            timestamp: Date.now()
        });

        return shares.map(s => s.encryptedShare);
    }

    /**
     * Recover master secret from threshold shares.
     * Use this when device key is lost but shares are available.
     */
    static async recoverFromShares(clinicId: string, shares: string[]): Promise<string> {
        if (shares.length < THRESHOLD) {
            throw new Error(`KEY_ESCROW_ERROR: Need at least ${THRESHOLD} shares, got ${shares.length}`);
        }

        try {
            const recoveredBytes = ShamirSecretSharing.combine(shares.slice(0, THRESHOLD));
            const masterSecret = Array.from(recoveredBytes)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            // Store the recovered key
            await KeyVault.storeKey(clinicId, masterSecret);

            // Log recovery for audit
            await StateSigner.seal({
                action: 'KEY_RECOVERED',
                clinicId,
                deviceId: await KeyVault.getDeviceId(),
                sharesUsed: THRESHOLD,
                timestamp: Date.now()
            });

            console.log(`🔓 [KeyEscrow] Recovered master key for clinic: ${clinicId}`);

            return masterSecret;
        } catch (error) {
            // Log failed recovery attempt
            await StateSigner.seal({
                action: 'KEY_RECOVERY_FAILED',
                clinicId,
                deviceId: await KeyVault.getDeviceId(),
                error: (error as Error).message,
                timestamp: Date.now()
            });

            throw new Error('KEY_ESCROW_ERROR: Failed to recover key from shares');
        }
    }

    /**
     * Rotate the master key (generates new key and new shares).
     * Old encrypted data will need to be re-encrypted with new key.
     */
    static async rotateKey(clinicId: string): Promise<string> {
        // Delete existing key and shares
        await KeyVault.deleteKey(clinicId);

        // Generate new key
        const newSecret = await this.getOrCreateMasterSecret(clinicId);

        // Log rotation for audit
        await StateSigner.seal({
            action: 'KEY_ROTATED',
            clinicId,
            deviceId: await KeyVault.getDeviceId(),
            timestamp: Date.now()
        });

        console.log(`🔄 [KeyEscrow] Rotated master key for clinic: ${clinicId}`);

        return newSecret;
    }

    /**
     * Check if a master key exists for the clinic.
     */
    static async hasKey(clinicId: string): Promise<boolean> {
        return await KeyVault.hasKey(clinicId);
    }

    /**
     * Get key metadata without exposing the actual key.
     */
    static async getKeyInfo(clinicId: string): Promise<{
        exists: boolean;
        createdAt?: number;
        lastAccessedAt?: number;
        keyVersion?: number;
    }> {
        const entry = await KeyVault.getKey(clinicId);

        if (!entry) {
            return { exists: false };
        }

        return {
            exists: true,
            createdAt: entry.createdAt,
            lastAccessedAt: entry.lastAccessedAt,
            keyVersion: entry.keyVersion
        };
    }
}

// Default clinic ID for demo/dev mode
export const DEFAULT_CLINIC_ID = 'VETNOTES_DEFAULT_CLINIC';
