/**
 * CloudShareBackup.ts
 * 
 * Secure cloud backup for Shamir shares to enable cross-device key recovery.
 * Implements partial share backup (2-of-5) to maintain Zero-Trust architecture.
 * 
 * Security Model:
 * - Only 2 shares are backed up to cloud (threshold is 3)
 * - Cloud-only access CANNOT reconstruct the key
 * - User needs 1 additional local share + cloud to recover
 */

import { StateSigner } from './StateSigner';

// Cloud backup configuration
const CLOUD_SHARE_COUNT = 2;  // Only backup 2 shares (below threshold)

export interface CloudBackupRecord {
    clinicId: string;
    userId: string;
    shares: string[];         // Only 2 of 5 shares
    deviceFingerprint: string;
    createdAt: string;
    updatedAt: string;
    version: number;
}

/**
 * CloudShareBackup service for secure cross-device recovery.
 * 
 * NOTE: This module provides the interface but requires Firestore
 * initialization in your app. Import your Firestore instance and
 * pass it to the backup/restore functions.
 */
export class CloudShareBackup {
    /**
     * Backup partial shares to Firestore for cross-device recovery.
     * Only backs up 2 shares (below 3-of-5 threshold) to maintain security.
     */
    static async backupShares(
        shares: string[],
        clinicId: string,
        userId: string,
        firestoreDb: any  // Firestore instance
    ): Promise<boolean> {
        if (!firestoreDb) {
            console.warn('⚠️ [CloudBackup] Firestore not configured');
            return false;
        }

        if (shares.length < CLOUD_SHARE_COUNT) {
            throw new Error('CLOUD_BACKUP_ERROR: Not enough shares to backup');
        }

        try {
            // Take only first 2 shares (cannot reconstruct key alone)
            const partialShares = shares.slice(0, CLOUD_SHARE_COUNT);

            const record: CloudBackupRecord = {
                clinicId,
                userId,
                shares: partialShares,
                deviceFingerprint: await getDeviceFingerprint(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: 1
            };

            // Store in Firestore under user's secure collection
            await firestoreDb
                .collection('key_escrow')
                .doc(userId)
                .collection('shares')
                .doc(clinicId)
                .set(record, { merge: true });

            // Audit log
            await StateSigner.seal({
                action: 'CLOUD_BACKUP_CREATED',
                clinicId,
                userId,
                sharesBackedUp: CLOUD_SHARE_COUNT,
                timestamp: Date.now()
            });

            console.log(`☁️ [CloudBackup] Backed up ${CLOUD_SHARE_COUNT} shares for clinic: ${clinicId}`);
            return true;

        } catch (error) {
            console.error('❌ [CloudBackup] Backup failed:', error);

            await StateSigner.seal({
                action: 'CLOUD_BACKUP_FAILED',
                clinicId,
                userId,
                error: (error as Error).message,
                timestamp: Date.now()
            });

            return false;
        }
    }

    /**
     * Retrieve cloud-backed shares for recovery.
     * Returns null if no backup exists.
     */
    static async getCloudShares(
        clinicId: string,
        userId: string,
        firestoreDb: any
    ): Promise<string[] | null> {
        if (!firestoreDb) {
            console.warn('⚠️ [CloudBackup] Firestore not configured');
            return null;
        }

        try {
            const doc = await firestoreDb
                .collection('key_escrow')
                .doc(userId)
                .collection('shares')
                .doc(clinicId)
                .get();

            if (!doc.exists) {
                return null;
            }

            const record = doc.data() as CloudBackupRecord;

            // Audit log
            await StateSigner.seal({
                action: 'CLOUD_SHARES_RETRIEVED',
                clinicId,
                userId,
                sharesRetrieved: record.shares.length,
                timestamp: Date.now()
            });

            return record.shares;

        } catch (error) {
            console.error('❌ [CloudBackup] Retrieval failed:', error);
            return null;
        }
    }

    /**
     * Check if cloud backup exists for a clinic.
     */
    static async hasCloudBackup(
        clinicId: string,
        userId: string,
        firestoreDb: any
    ): Promise<boolean> {
        if (!firestoreDb) return false;

        try {
            const doc = await firestoreDb
                .collection('key_escrow')
                .doc(userId)
                .collection('shares')
                .doc(clinicId)
                .get();

            return doc.exists;
        } catch {
            return false;
        }
    }

    /**
     * Delete cloud backup (for key rotation or account deletion).
     */
    static async deleteCloudBackup(
        clinicId: string,
        userId: string,
        firestoreDb: any
    ): Promise<boolean> {
        if (!firestoreDb) return false;

        try {
            await firestoreDb
                .collection('key_escrow')
                .doc(userId)
                .collection('shares')
                .doc(clinicId)
                .delete();

            await StateSigner.seal({
                action: 'CLOUD_BACKUP_DELETED',
                clinicId,
                userId,
                timestamp: Date.now()
            });

            console.log(`🗑️ [CloudBackup] Deleted cloud backup for clinic: ${clinicId}`);
            return true;

        } catch (error) {
            console.error('❌ [CloudBackup] Delete failed:', error);
            return false;
        }
    }

    /**
     * Get backup metadata without exposing shares.
     */
    static async getBackupInfo(
        clinicId: string,
        userId: string,
        firestoreDb: any
    ): Promise<{ exists: boolean; createdAt?: string; version?: number } | null> {
        if (!firestoreDb) return { exists: false };

        try {
            const doc = await firestoreDb
                .collection('key_escrow')
                .doc(userId)
                .collection('shares')
                .doc(clinicId)
                .get();

            if (!doc.exists) {
                return { exists: false };
            }

            const record = doc.data() as CloudBackupRecord;
            return {
                exists: true,
                createdAt: record.createdAt,
                version: record.version
            };
        } catch {
            return { exists: false };
        }
    }
}

/**
 * Generate a device fingerprint for audit purposes.
 */
async function getDeviceFingerprint(): Promise<string> {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone
    ];

    const data = components.join('|');
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * Recovery flow helper: Combine cloud shares with local share.
 * Requires at least 1 local share + 2 cloud shares = 3 (threshold)
 */
export async function combineForRecovery(
    cloudShares: string[],
    localShares: string[]
): Promise<string[]> {
    // Need at least 1 local + 2 cloud = 3 minimum
    if (cloudShares.length < 2) {
        throw new Error('RECOVERY_ERROR: Need at least 2 cloud shares');
    }
    if (localShares.length < 1) {
        throw new Error('RECOVERY_ERROR: Need at least 1 local share');
    }

    // Combine to meet threshold
    return [...cloudShares.slice(0, 2), localShares[0]];
}
