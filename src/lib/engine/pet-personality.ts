/**
 * Pet Personality Engine
 * 
 * Defines how virtual patients respond to the player's presence and voice.
 * This is the "Cozy-to-Chaos" social simulation hook.
 */

export type Temperament = 'grumpy' | 'hyperactive' | 'anxious' | 'brave' | 'curious' | 'stoic';

export interface PetState {
    id: string;
    name: string;
    species: string;
    breed: string;
    temperament: Temperament;
    trustLevel: number; // 0 to 100
    healthStatus: 'stable' | 'distressed' | 'critical' | 'recovering';
    currentMood: string;
}

export const TEMPERAMENTS: Record<Temperament, {
    description: string;
    voiceSensitivity: number; // 0 to 1
    socialDrains: number; // Rate at which trust drops if ignored
    icon: string;
}> = {
    grumpy: {
        description: "Hard to please. Prefers low-volume, direct communication.",
        voiceSensitivity: 0.8,
        socialDrains: 0.1,
        icon: "😠"
    },
    hyperactive: {
        description: "High energy! Responds well to excitement and praise.",
        voiceSensitivity: 0.4,
        socialDrains: 0.5,
        icon: "⚡"
    },
    anxious: {
        description: "Easily spooked. Requires a soft, steady voice and slow movements.",
        voiceSensitivity: 0.9,
        socialDrains: 0.3,
        icon: "😰"
    },
    brave: {
        description: "Steady as a rock. Doesn't mind loud noises or busy clinics.",
        voiceSensitivity: 0.1,
        socialDrains: 0.05,
        icon: "🦁"
    },
    curious: {
        description: "Wants to play with every stethoscope and vial.",
        voiceSensitivity: 0.3,
        socialDrains: 0.2,
        icon: "🧐"
    },
    stoic: {
        description: "Quiet and observant. Very patient.",
        voiceSensitivity: 0.2,
        socialDrains: 0.05,
        icon: "🗿"
    }
};

export function createRandomPet(species?: string): PetState {
    const names = ["Barnaby", "Luna", "Diesel", "Coco", "Shadow", "Pip", "Waffles", "Zelda"];
    const speciesList = ["Dog", "Cat", "Blue-Tongue Lizard", "Flying Fox", "Wallaby"];
    const breeds: Record<string, string[]> = {
        "Dog": ["Golden Retriever", "Border Collie", "Pug", "Dingo-Cross"],
        "Cat": ["Cosmic Bengal", "Tabby", "Siamese"],
        "Blue-Tongue Lizard": ["Shingleback", "Eastern"],
        "Flying Fox": ["Spectacled", "Grey-headed"],
        "Wallaby": ["Agile", "Rock"]
    };

    const selectedSpecies = species || speciesList[Math.floor(Math.random() * speciesList.length)];
    const selectedBreedList = breeds[selectedSpecies] || ["Common"];
    const selectedTemperaments = Object.keys(TEMPERAMENTS) as Temperament[];

    return {
        id: `pet_${Math.random().toString(36).substr(2, 9)}`,
        name: names[Math.floor(Math.random() * names.length)],
        species: selectedSpecies,
        breed: selectedBreedList[Math.floor(Math.random() * selectedBreedList.length)],
        temperament: selectedTemperaments[Math.floor(Math.random() * selectedTemperaments.length)],
        trustLevel: 40 + Math.random() * 30,
        healthStatus: 'stable',
        currentMood: 'neutral'
    };
}

/**
 * Calculates how a pet's trust changes based on a voice interaction.
 * @param pet The current pet state
 * @param volume Simulated voice volume (0 to 1)
 * @param sentiment Simulated sentiment (positive to negative)
 */
export function calculateVoiceImpact(pet: PetState, volume: number, sentiment: number): number {
    const tempConfig = TEMPERAMENTS[pet.temperament];
    let impact = 0;

    // Volume logic
    if (volume > 0.7 && (pet.temperament === 'anxious' || pet.temperament === 'grumpy')) {
        impact -= (volume * 10 * tempConfig.voiceSensitivity);
    } else if (volume > 0.6 && pet.temperament === 'hyperactive') {
        impact += (volume * 5);
    }

    // Sentiment logic
    impact += (sentiment * 15);

    return Math.max(-20, Math.min(20, impact));
}
