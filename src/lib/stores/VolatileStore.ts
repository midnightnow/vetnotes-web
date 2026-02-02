import { writable, get } from 'svelte/store';

/**
 * Volatile Billing Bridge (Zero-Retention)
 * 
 * Manages transient line-items identified during clinical charting.
 * These items exist only in local memory and are never sent to the VetNotes backend.
 * Persistence is limited to SessionStorage to allow for tab refresh protection.
 */

export interface BillingItem {
    sku: string;
    description: string;
    quantity: number;
    unitPrice: number;
    category: string;
    originNote: string; // The shorthand that triggered this
}

function createVolatileStore() {
    const { subscribe, set, update } = writable<BillingItem[]>([]);

    return {
        subscribe,

        /**
         * Adds an item to the volatile tray.
         */
        addItem: (item: BillingItem) => {
            update(items => {
                // Prevent duplicate skus from the same trigger context
                const exists = items.find(i => i.sku === item.sku && i.originNote === item.originNote);
                if (exists) return items;
                return [...items, item];
            }),
                saveToSession();
        },

        /**
         * Removes an item (manual correction by vet).
         */
        removeItem: (sku: string) => {
            update(items => items.filter(i => i.sku !== sku));
            saveToSession();
        },

        /**
         * Clears all items (Zero-Retention event).
         * Triggered on "Push to PIMS" or manual session end.
         */
        clear: () => {
            set([]);
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('vetnotes_volatile_billing');
            }
        },

        /**
         * Restores items from session storage (tab recovery).
         */
        restore: () => {
            if (typeof window !== 'undefined') {
                const saved = sessionStorage.getItem('vetnotes_volatile_billing');
                if (saved) {
                    try {
                        set(JSON.parse(saved));
                    } catch (e) {
                        console.error('Failed to restore billing bridge:', e);
                    }
                }
            }
        }
    };
}

function saveToSession() {
    if (typeof window !== 'undefined') {
        const items = get(volatileBillingTray);
        sessionStorage.setItem('vetnotes_volatile_billing', JSON.stringify(items));
    }
}

export const volatileBillingTray = createVolatileStore();
