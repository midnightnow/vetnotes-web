/**
 * KeyVaultIndexedDB.ts
 * 
 * Secure local key storage using IndexedDB.
 * Provides device-bound encryption key persistence for the Noctua Sentinel protocol.
 */

const DB_NAME = 'vetnotes_keyvault';
const STORE_NAME = 'keys';
const DB_VERSION = 1;

/** Storage availability state for graceful degradation */
export enum StorageMode {
    PERSISTENT = 'PERSISTENT',      // Full IndexedDB with persistent storage
    EPHEMERAL = 'EPHEMERAL',        // IndexedDB without persistence guarantee
    SESSION_ONLY = 'SESSION_ONLY',  // In-memory fallback (private browsing)
    UNAVAILABLE = 'UNAVAILABLE'     // No storage available
}

let currentStorageMode: StorageMode = StorageMode.EPHEMERAL;
let inMemoryFallback: Map<string, any> = new Map();

/**
 * Request persistent storage from the browser to prevent eviction.
 * Returns the resulting storage mode.
 */
export async function requestPersistentStorage(): Promise<StorageMode> {
    try {
        // Check if IndexedDB is available
        if (!('indexedDB' in window)) {
            console.warn('⚠️ [KeyVault] IndexedDB not available - using session-only mode');
            currentStorageMode = StorageMode.SESSION_ONLY;
            return currentStorageMode;
        }

        // Request persistent storage (prevents eviction during disk pressure)
        if ('storage' in navigator && 'persist' in navigator.storage) {
            const isPersisted = await navigator.storage.persist();
            if (isPersisted) {
                console.log('✅ [KeyVault] Persistent storage granted');
                currentStorageMode = StorageMode.PERSISTENT;
            } else {
                console.warn('⚠️ [KeyVault] Persistent storage denied - keys may be evicted');
                currentStorageMode = StorageMode.EPHEMERAL;
            }
        } else {
            currentStorageMode = StorageMode.EPHEMERAL;
        }

        return currentStorageMode;
    } catch (error) {
        console.error('❌ [KeyVault] Storage initialization failed:', error);
        currentStorageMode = StorageMode.SESSION_ONLY;
        return currentStorageMode;
    }
}

/**
 * Get the current storage mode for UI display.
 */
export function getStorageMode(): StorageMode {
    return currentStorageMode;
}

export interface KeyEntry {
    clinicId: string;
    encryptedMasterKey: string;  // Base64 encoded
    deviceId: string;
    createdAt: number;
    lastAccessedAt: number;
    keyVersion: number;
}

export interface ShareEntry {
    shareId: string;
    clinicId: string;
    encryptedShare: string;  // Base64 encoded
    shareIndex: number;
    totalShares: number;
    threshold: number;
    createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        // Fallback for private browsing
        if (currentStorageMode === StorageMode.SESSION_ONLY || !('indexedDB' in window)) {
            reject(new Error('STORAGE_UNAVAILABLE'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Master keys store
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const keyStore = db.createObjectStore(STORE_NAME, { keyPath: 'clinicId' });
                keyStore.createIndex('deviceId', 'deviceId', { unique: false });
            }

            // Shares store for recovery
            if (!db.objectStoreNames.contains('shares')) {
                const shareStore = db.createObjectStore('shares', { keyPath: 'shareId' });
                shareStore.createIndex('clinicId', 'clinicId', { unique: false });
            }
        };
    });
}

/**
 * Get or generate a persistent device ID for this browser.
 */
export async function getDeviceId(): Promise<string> {
    let deviceId = localStorage.getItem('vetnotes_device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('vetnotes_device_id', deviceId);
    }
    return deviceId;
}

/**
 * Store a master key for a clinic (encrypted at rest).
 * Falls back to in-memory storage in private browsing mode.
 */
export async function storeKey(clinicId: string, encryptedMasterKey: string): Promise<void> {
    const deviceId = await getDeviceId();

    const entry: KeyEntry = {
        clinicId,
        encryptedMasterKey,
        deviceId,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        keyVersion: 1
    };

    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        // Fallback to in-memory storage
        console.warn('⚠️ [KeyVault] Using in-memory storage for key:', clinicId);
        inMemoryFallback.set(`key_${clinicId}`, entry);
    }
}

/**
 * Retrieve a stored key for a clinic.
 * Falls back to in-memory storage in private browsing mode.
 */
export async function getKey(clinicId: string): Promise<KeyEntry | null> {
    // Check in-memory first
    const memoryKey = inMemoryFallback.get(`key_${clinicId}`);
    if (memoryKey) {
        return memoryKey as KeyEntry;
    }

    try {
        const db = await openDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(clinicId);

            request.onsuccess = async () => {
                const entry = request.result as KeyEntry | undefined;
                if (entry) {
                    // Update last accessed time
                    const writeTx = db.transaction(STORE_NAME, 'readwrite');
                    const writeStore = writeTx.objectStore(STORE_NAME);
                    writeStore.put({ ...entry, lastAccessedAt: Date.now() });
                }
                resolve(entry || null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn('⚠️ [KeyVault] IndexedDB unavailable, checking memory');
        return null;
    }
}

/**
 * Store recovery shares for a clinic.
 */
export async function storeShares(clinicId: string, shares: string[], threshold: number): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction('shares', 'readwrite');
        const store = tx.objectStore('shares');

        shares.forEach((share, index) => {
            const entry: ShareEntry = {
                shareId: `${clinicId}_share_${index}`,
                clinicId,
                encryptedShare: share,
                shareIndex: index,
                totalShares: shares.length,
                threshold,
                createdAt: Date.now()
            };
            store.put(entry);
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Retrieve all shares for a clinic.
 */
export async function getShares(clinicId: string): Promise<ShareEntry[]> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction('shares', 'readonly');
        const store = tx.objectStore('shares');
        const index = store.index('clinicId');
        const request = index.getAll(clinicId);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Check if a master key exists for a clinic.
 */
export async function hasKey(clinicId: string): Promise<boolean> {
    const entry = await getKey(clinicId);
    return entry !== null;
}

/**
 * Delete a key (for rotation or testing).
 */
export async function deleteKey(clinicId: string): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME, 'shares'], 'readwrite');

        // Delete master key
        tx.objectStore(STORE_NAME).delete(clinicId);

        // Delete associated shares
        const shareStore = tx.objectStore('shares');
        const shareIndex = shareStore.index('clinicId');
        const request = shareIndex.openCursor(IDBKeyRange.only(clinicId));

        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
