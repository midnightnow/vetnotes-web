
export type GameLens = 'cozy' | 'adventure' | 'tactical';

export interface RewardTier {
    xp: number;
    coins: number;
    badge?: string;
    certificationPoints?: number;
}

export interface Story {
    id: string;
    title: string;
    narrator: string;
    transcript: string;
    audioUrl?: string;
    permissionSource: string; // e.g., "Approved by Yalanji Elders"
    suburb?: string;
}

export interface RegionConfig {
    id: string;
    name: string;
    features: {
        custodianship: boolean;
        education: boolean;
        professional: boolean;
    };
    storyIds: string[];
    postcode?: string;
}

export interface PointOfDiscovery {
    id: string;
    type: 'invasive_pest' | 'infrastructure_fault' | 'wildlife_sighting' | 'biosecurity_concern';
    subtype?: string;
    coordinates: { lat: number; lng: number };
    reportedBy: string;
    reportedAt: Date;
    photoUri?: string;
    aiClassification?: {
        species?: string;
        confidence: number;
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
    questStatus: 'OPEN' | 'REPORTED' | 'VERIFIED' | 'RESOLVED';
    rewardTier: RewardTier;
    xp?: number; // Added for convenience in simpler loops
}
