import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface PlayerState {
    // Identity
    playerId: string;
    displayName: string;

    // Progression
    xp: number;
    level: number;

    // Currency
    happyValleyCredits: number;
    northernShieldCerts: number;

    // Preferences
    preferredLens: 'cozy' | 'adventure' | 'tactical';

    // Licensing (gates access to advanced scenarios)
    licenseStatus: 'provisional' | 'registered' | 'specialist';

    // Stats
    totalConsultations: number;
    successfulTreatments: number;
    outbreaksContained: number;

    // Achievements
    unlockedScenarios: string[];
    badges: string[];

    // Session
    currentStreak: number;
    lastPlayedAt: number;
}

const DEFAULT_PLAYER: PlayerState = {
    playerId: crypto.randomUUID(),
    displayName: 'Veterinary Cadet',
    xp: 0,
    level: 1,
    happyValleyCredits: 100, // Starting credits for basic supplies
    northernShieldCerts: 0,
    preferredLens: 'cozy',
    licenseStatus: 'provisional',
    totalConsultations: 0,
    successfulTreatments: 0,
    outbreaksContained: 0,
    unlockedScenarios: ['vaccination', 'microchip', 'dental_check'], // Starter scenarios
    badges: [],
    currentStreak: 0,
    lastPlayedAt: Date.now()
};

// Load from localStorage if available
function loadPlayerState(): PlayerState {
    if (!browser) return DEFAULT_PLAYER;

    const stored = localStorage.getItem('valley_vet_player');
    if (!stored) return DEFAULT_PLAYER;

    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse player state:', e);
        return DEFAULT_PLAYER;
    }
}

// Create the store
function createPlayerStore() {
    const { subscribe, set, update } = writable<PlayerState>(loadPlayerState());

    // Auto-save to localStorage on changes
    if (browser) {
        subscribe(state => {
            localStorage.setItem('valley_vet_player', JSON.stringify(state));
        });
    }

    return {
        subscribe,
        set,
        update,

        // XP & Leveling
        addXP: (amount: number) => update(state => {
            const newXP = state.xp + amount;
            const newLevel = Math.floor(newXP / 1000) + 1; // 1000 XP per level

            return {
                ...state,
                xp: newXP,
                level: newLevel
            };
        }),

        // Currency
        addCredits: (amount: number) => update(state => ({
            ...state,
            happyValleyCredits: state.happyValleyCredits + amount
        })),

        spendCredits: (amount: number) => update(state => {
            if (state.happyValleyCredits < amount) {
                throw new Error('Insufficient credits');
            }
            return {
                ...state,
                happyValleyCredits: state.happyValleyCredits - amount
            };
        }),

        addCerts: (amount: number) => update(state => ({
            ...state,
            northernShieldCerts: state.northernShieldCerts + amount
        })),

        // Preferences
        setLens: (lens: 'cozy' | 'adventure' | 'tactical') => update(state => ({
            ...state,
            preferredLens: lens
        })),

        // Progression
        completeConsultation: (success: boolean, xpReward: number, creditReward: number) => update(state => {
            const newXP = state.xp + xpReward;
            const newLevel = Math.floor(newXP / 1000) + 1;

            return {
                ...state,
                xp: newXP,
                level: newLevel,
                happyValleyCredits: state.happyValleyCredits + creditReward,
                totalConsultations: state.totalConsultations + 1,
                successfulTreatments: success ? state.successfulTreatments + 1 : state.successfulTreatments,
                lastPlayedAt: Date.now()
            };
        }),

        containOutbreak: (certReward: number) => update(state => ({
            ...state,
            outbreaksContained: state.outbreaksContained + 1,
            northernShieldCerts: state.northernShieldCerts + certReward,
            lastPlayedAt: Date.now()
        })),

        // Unlocks
        unlockScenario: (scenarioId: string) => update(state => {
            if (state.unlockedScenarios.includes(scenarioId)) return state;

            return {
                ...state,
                unlockedScenarios: [...state.unlockedScenarios, scenarioId]
            };
        }),

        awardBadge: (badgeId: string) => update(state => {
            if (state.badges.includes(badgeId)) return state;

            return {
                ...state,
                badges: [...state.badges, badgeId]
            };
        }),

        // License progression
        upgradeLicense: () => update(state => {
            const nextLicense =
                state.licenseStatus === 'provisional' ? 'registered' :
                    state.licenseStatus === 'registered' ? 'specialist' :
                        state.licenseStatus;

            return {
                ...state,
                licenseStatus: nextLicense
            };
        }),

        // Reset (for testing)
        reset: () => set(DEFAULT_PLAYER)
    };
}

export const player = createPlayerStore();

// Helper functions for level requirements
export function getXPForNextLevel(currentXP: number): number {
    const currentLevel = Math.floor(currentXP / 1000) + 1;
    return (currentLevel * 1000) - currentXP;
}

export function canAccessScenario(state: PlayerState, scenarioId: string): boolean {
    return state.unlockedScenarios.includes(scenarioId);
}

export function canAccessTacticalMode(state: PlayerState): boolean {
    return state.level >= 5; // Tactical mode unlocks at level 5
}

export function getLicenseRequirements(license: 'registered' | 'specialist'): {
    level: number;
    consultations: number;
    certs: number;
} {
    if (license === 'registered') {
        return {
            level: 5,
            consultations: 50,
            certs: 0
        };
    }

    // Specialist
    return {
        level: 10,
        consultations: 200,
        certs: 10
    };
}
