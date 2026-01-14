/**
 * Session Storage for VetNotes
 * Maintains a local history of consults in IndexedDB for audit trail.
 */

const DB_NAME = 'vetnotes_sessions';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

export interface Session {
    id: string;
    timestamp: number;
    template: string;
    rawTranscript: string;
    redactedTranscript: string;
    structuredNote: string;
    provider: 'gemini' | 'ollama';
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

export async function saveSession(session: Omit<Session, 'id' | 'timestamp'>): Promise<string> {
    const db = await openDB();
    const id = crypto.randomUUID();
    const fullSession: Session = {
        ...session,
        id,
        timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(fullSession);
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
}

export async function getSessions(limit: number = 50): Promise<Session[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const request = index.openCursor(null, 'prev');

        const results: Session[] = [];
        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor && results.length < limit) {
                results.push(cursor.value);
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

export async function deleteSession(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getSessionStats(): Promise<{ total: number; today: number; week: number }> {
    const sessions = await getSessions(1000);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;

    return {
        total: sessions.length,
        today: sessions.filter(s => now - s.timestamp < dayMs).length,
        week: sessions.filter(s => now - s.timestamp < weekMs).length,
    };
}
