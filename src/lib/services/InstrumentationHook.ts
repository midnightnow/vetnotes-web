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
        startSimulation: () => {
            // Default to Snakebite scenario if triggered from high-stakes modes
            return createInstrumentationStore().startSnakebiteScenario();
        },

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

        // Simulate a Snakebite (Envenomation) scenario
        startSnakebiteScenario: () => {
            if (simulationInterval) clearInterval(simulationInterval);

            console.log('[InstrumentationHook] Starting Snakebite (Envenomation) Scenario');

            // Baseline stable
            let hr = 80;
            let spo2 = 98;
            let rr = 20;
            let temp = 38.5;
            let step = 0;

            simulationInterval = setInterval(() => {
                step++;

                // Clinical Progression: Tachycardia + Hypoxemia
                if (step > 5) { // After 10 seconds, start distress
                    hr += 2.5; // Rapidly rising HR
                    spo2 -= 0.3; // Gradual drop in oxygen saturation
                    rr += 1; // Tachypnea
                } else {
                    // Random fluctuation
                    hr += (Math.random() - 0.5) * 2;
                }

                // Clamp for realism
                if (hr > 180) hr = 180;
                if (spo2 < 82) spo2 = 82;
                if (rr > 60) rr = 60;

                set({
                    heartRate: Math.round(hr),
                    spo2: Math.round(spo2),
                    respRate: Math.round(rr),
                    temp: Number(temp.toFixed(1)),
                    timestamp: Date.now(),
                    source: 'Evidence-Locked (Forensic)'
                });
            }, 2000);
        },

        stopSimulation: () => {
            if (simulationInterval) clearInterval(simulationInterval);
        }
    };
}

export const instrumentationParams = createInstrumentationStore();
