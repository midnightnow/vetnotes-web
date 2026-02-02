export interface NotifiableCondition {
    id: string;
    name: string;
    description: string;
    keywords: string[];
    severity: 'critical' | 'warning';
    authority: string;
    instructions: string;
}

export const NOTIFIABLE_CONDITIONS: NotifiableCondition[] = [
    {
        id: 'fire_ants',
        name: 'Red Imported Fire Ant (RIFA)',
        description: 'Solenopsis invicta - Highly invasive pest species.',
        keywords: ['fire ant', 'solenopsis', 'invasive ant', 'stinging ant'],
        severity: 'critical',
        authority: 'National Biosecurity Authority',
        instructions: 'Do not disturb the nest. Record coordinates and report immediately.'
    },
    {
        id: 'foot_and_mouth',
        name: 'Foot and Mouth Disease (FMD)',
        description: 'Highly contagious viral disease of cloven-hoofed animals.',
        keywords: ['foot and mouth', 'fmd', 'aphthovirus', 'blisters', 'cloven hoof'],
        severity: 'critical',
        authority: 'Department of Agriculture / FAO',
        instructions: 'Immediate quarantine required. Cease all animal movement.'
    },
    {
        id: 'hendra',
        name: 'Hendra Virus (HeV)',
        description: 'Zoonotic viral disease in horses and humans.',
        keywords: ['hendra', 'flying fox exposure', 'pteropus', 'hev'],
        severity: 'critical',
        authority: 'State Veterinary Services',
        instructions: 'Use maximum PPE. Isolate horse immediately.'
    },
    {
        id: 'citrus_greening',
        name: 'Citrus Greening (HLB)',
        description: 'Bacterial disease (Candidatus Liberibacter) spread by psyllids.',
        keywords: ['citrus greening', 'hlb', 'diaphorina', 'yellow shoot'],
        severity: 'warning',
        authority: 'Plant Health Authority',
        instructions: 'Monitor for Asian Citrus Psyllid vectors. Report suspect specimens.'
    },
    {
        id: 'stem_rust',
        name: 'Wheat Stem Rust (Ug99)',
        description: 'Puccinia graminis tritici - Threat to global wheat security.',
        keywords: ['stem rust', 'ug99', 'puccinia', 'cereal rust'],
        severity: 'warning',
        authority: 'Global Rust Initiative / IARC',
        instructions: 'Collect spore samples using phytosanitary kits.'
    },
    {
        id: 'xylella',
        name: 'Xylella fastidiosa',
        description: 'Bacterial pathogen causing Olive Quick Decline and Pierce\'s Disease.',
        keywords: ['xylella', 'olive quick decline', 'pierce\'s disease', 'glassy-winged sharpshooter'],
        severity: 'critical',
        authority: 'National Plant Protection Organization (NPPO)',
        instructions: 'Immediate halt to all plant movement. Report suspect vectors.'
    },
    {
        id: 'citrus_canker',
        name: 'Citrus Canker',
        description: 'Bacterial disease (Xanthomonas citri) causing lesions on citrus fruit and leaves.',
        keywords: ['citrus canker', 'xanthomonas', 'citrus lesion'],
        severity: 'warning',
        authority: 'Biosecurity Agency',
        instructions: 'Decontaminate tools and clothing. Do not move fruit from site.'
    }
];
