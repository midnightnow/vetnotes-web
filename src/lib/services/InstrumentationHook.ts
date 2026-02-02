import { writable } from 'svelte/store';

export interface VitalsData {
    heartRate: number;
    spo2: number;
    respRate: number;
    temp: number;
    timestamp: number;
    source: string; // 'SurgVet', 'Cardell', 'Simulated'
}

const SOVEREIGN_CHANNEL = 'sovereign-clinical-alliance';

function createInstrumentationStore() {
    const { subscribe, set, update } = writable<VitalsData | null>(null);
    let channel: BroadcastChannel | null = null;
    let simulationInterval: any = null;

    return {
        subscribe,

        // Connect to the Sovereign Channel
        connect: () => {
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                channel = new BroadcastChannel(SOVEREIGN_CHANNEL);

                channel.onmessage = (event) => {
                    const msg = event.data;
                    if (msg.type === 'INSTRUMENTATION_UPDATE') {
                        set(msg.payload);
                    }
                };
                console.log('[InstrumentationHook] Listening on Sovereign Channel');
            }
        },

        // Disconnect and cleanup
        disconnect: () => {
            if (channel) channel.close();
            if (simulationInterval) clearInterval(simulationInterval);
            set(null);
        },

        // Simulate a live feed (for demo/testing)
        startSimulation: () => {
            if (simulationInterval) clearInterval(simulationInterval);

            console.log('[InstrumentationHook] Starting Vitals Simulation');

            // Base values
            let hr = 80;
            let spo2 = 98;
            let rr = 20;
            let temp = 38.5;

            simulationInterval = setInterval(() => {
                // Random walk
                hr += (Math.random() - 0.5) * 5;
                spo2 += (Math.random() - 0.5) * 1;
                rr += (Math.random() - 0.5) * 2;

                // Clamp
                if (spo2 > 100) spo2 = 100;
                if (spo2 < 90) spo2 = 90;

                set({
                    heartRate: Math.round(hr),
                    spo2: Math.round(spo2),
                    respRate: Math.round(rr),
                    temp: Number(temp.toFixed(1)),
                    timestamp: Date.now(),
                    source: 'Simulated (Sovereign)'
                });
            }, 2000); // Update every 2 seconds
        },

        stopSimulation: () => {
            if (simulationInterval) clearInterval(simulationInterval);
        }
    };
}

export const instrumentationParams = createInstrumentationStore();
