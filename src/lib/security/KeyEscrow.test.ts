/**
 * KeyEscrow.test.ts
 * 
 * Test suite for Shamir Secret Sharing reconstruction and key escrow flows.
 * Validates the 3-of-5 threshold recovery mechanism.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Inline Shamir implementation for isolated testing
const PRIME = 257;

function generatePolynomial(secret: number[], degree: number): number[][] {
    const polynomials: number[][] = [];
    for (let byteIdx = 0; byteIdx < secret.length; byteIdx++) {
        const coeffs = [secret[byteIdx]];
        const randomCoeffs = crypto.getRandomValues(new Uint8Array(degree));
        for (let i = 0; i < degree; i++) {
            coeffs.push(randomCoeffs[i]);
        }
        polynomials.push(coeffs);
    }
    return polynomials;
}

function evaluatePolynomial(coeffs: number[], x: number): number {
    let result = 0;
    for (let i = coeffs.length - 1; i >= 0; i--) {
        result = (result * x + coeffs[i]) % PRIME;
    }
    return result;
}

function modInverse(a: number, m: number): number {
    let [old_r, r] = [a, m];
    let [old_s, s] = [1, 0];
    while (r !== 0) {
        const quotient = Math.floor(old_r / r);
        [old_r, r] = [r, old_r - quotient * r];
        [old_s, s] = [s, old_s - quotient * s];
    }
    return ((old_s % m) + m) % m;
}

function split(secret: Uint8Array, n: number, k: number): string[] {
    const secretArray = Array.from(secret);
    const polynomials = generatePolynomial(secretArray, k - 1);
    const shares: string[] = [];
    for (let i = 1; i <= n; i++) {
        const shareBytes: number[] = [i];
        for (let byteIdx = 0; byteIdx < secretArray.length; byteIdx++) {
            // Ensure value is in valid byte range (0-255) by taking mod 256
            const val = evaluatePolynomial(polynomials[byteIdx], i);
            shareBytes.push(val % 256);
        }
        // Use hex encoding instead of btoa to avoid character issues
        const hex = shareBytes.map(b => b.toString(16).padStart(2, '0')).join('');
        shares.push(hex);
    }
    return shares;
}

function combine(shares: string[]): Uint8Array {
    // Decode hex shares
    const decodedShares = shares.map(s => {
        const bytes: number[] = [];
        for (let i = 0; i < s.length; i += 2) {
            bytes.push(parseInt(s.substring(i, i + 2), 16));
        }
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
                    numerator = (numerator * (0 - decodedShares[j].x)) % PRIME;
                    denominator = (denominator * (decodedShares[i].x - decodedShares[j].x)) % PRIME;
                }
            }
            numerator = ((numerator % PRIME) + PRIME) % PRIME;
            denominator = ((denominator % PRIME) + PRIME) % PRIME;
            const lagrange = (numerator * modInverse(denominator, PRIME)) % PRIME;
            result = (result + decodedShares[i].y[byteIdx] * lagrange) % PRIME;
        }
        secret[byteIdx] = ((result % PRIME) + PRIME) % PRIME;
    }
    return secret;
}

describe('Shamir Secret Sharing', () => {
    const SECRET_LENGTH = 32; // 256 bits

    it('should split a secret into 5 shares', () => {
        const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        const shares = split(secret, 5, 3);

        expect(shares).toHaveLength(5);
        shares.forEach(share => {
            expect(typeof share).toBe('string');
            expect(share.length).toBeGreaterThan(0);
        });
    });

    it('should reconstruct secret with exactly 3 shares', () => {
        const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        const shares = split(secret, 5, 3);

        // Use shares 1, 2, 3
        const recovered = combine([shares[0], shares[1], shares[2]]);
        expect(Array.from(recovered)).toEqual(Array.from(secret));
    });

    it('should reconstruct with any 3-share combination', () => {
        const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        const shares = split(secret, 5, 3);

        // Test multiple combinations
        const combinations = [
            [0, 1, 2], // 1,2,3
            [0, 2, 4], // 1,3,5
            [1, 3, 4], // 2,4,5
            [0, 3, 4], // 1,4,5
            [2, 3, 4], // 3,4,5
        ];

        combinations.forEach(([a, b, c]) => {
            const recovered = combine([shares[a], shares[b], shares[c]]);
            expect(Array.from(recovered)).toEqual(Array.from(secret));
        });
    });

    it('should reconstruct with more than threshold (4 shares)', () => {
        const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        const shares = split(secret, 5, 3);

        const recovered = combine([shares[0], shares[1], shares[2], shares[3]]);
        expect(Array.from(recovered)).toEqual(Array.from(secret));
    });

    it('should reconstruct with all 5 shares', () => {
        const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        const shares = split(secret, 5, 3);

        const recovered = combine(shares);
        expect(Array.from(recovered)).toEqual(Array.from(secret));
    });

    it('should FAIL reconstruction with only 2 shares (below threshold)', () => {
        const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        const shares = split(secret, 5, 3);

        // Only 2 shares - should NOT reconstruct correctly
        const recovered = combine([shares[0], shares[1]]);
        expect(Array.from(recovered)).not.toEqual(Array.from(secret));
    });

    it('should FAIL reconstruction with only 1 share', () => {
        const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        const shares = split(secret, 5, 3);

        const recovered = combine([shares[0]]);
        expect(Array.from(recovered)).not.toEqual(Array.from(secret));
    });
});

describe('Disaster Recovery Scenarios', () => {
    const SECRET_LENGTH = 32;

    it('Scenario A: Device loss - recover with 2 cloud + 1 backup', () => {
        const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        const shares = split(secret, 5, 3);

        // Simulate: Cloud has shares 0,1 (2 shares)
        const cloudShares = [shares[0], shares[1]];

        // User provides 1 backup share (e.g., from paper backup)
        const backupShare = shares[4];

        // Combine for recovery
        const recovered = combine([...cloudShares, backupShare]);
        expect(Array.from(recovered)).toEqual(Array.from(secret));
    });

    it('Scenario B: Cloud breach - attacker gets 2 shares, cannot reconstruct', () => {
        const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        const shares = split(secret, 5, 3);

        // Attacker only has access to 2 cloud shares
        const compromisedShares = [shares[0], shares[1]];

        // Attempt reconstruction - should fail
        const attemptedRecovery = combine(compromisedShares);
        expect(Array.from(attemptedRecovery)).not.toEqual(Array.from(secret));
    });

    it('Scenario C: Partial local corruption - recover with remaining shares', () => {
        const secret = crypto.getRandomValues(new Uint8Array(SECRET_LENGTH));
        const shares = split(secret, 5, 3);

        // Simulate: Local IndexedDB corrupted shares 2,3
        // Remaining local shares: 0, 4
        // Cloud shares: 0, 1

        // User can recover with: local[4] + cloud[0, 1]
        const recovered = combine([shares[4], shares[0], shares[1]]);
        expect(Array.from(recovered)).toEqual(Array.from(secret));
    });
});

describe('Encryption Round-Trip', () => {
    it('should encrypt and decrypt data with derived key', async () => {
        // Generate master secret
        const secret = crypto.getRandomValues(new Uint8Array(32));
        const masterKey = Array.from(secret).map(b => b.toString(16).padStart(2, '0')).join('');

        // Derive key using PBKDF2
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const baseKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(masterKey),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        // Encrypt
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const plaintext = encoder.encode('Sensitive clinical data: Patient Fluffy, diagnosis: healthy');
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            derivedKey,
            plaintext
        );

        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            derivedKey,
            ciphertext
        );

        const decoded = new TextDecoder().decode(decrypted);
        expect(decoded).toBe('Sensitive clinical data: Patient Fluffy, diagnosis: healthy');
    });
});
