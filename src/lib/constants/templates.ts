export type TemplateId = 'general' | 'surgery' | 'vaccine' | 'dental' | 'emergency';

export interface Template {
    id: TemplateId;
    name: string;
    icon: string;
    prompt: string;
}

export const TEMPLATES: Record<TemplateId, Template> = {
    general: {
        id: 'general',
        name: 'General Exam',
        icon: '🐾',
        prompt: 'Convert to a comprehensive General Exam SOAP note. Focus on thoroughness in the Objective section.'
    },
    surgery: {
        id: 'surgery',
        name: 'Surgery/Anesth.',
        icon: '✂️',
        prompt: 'Format as a Surgical/Anesthesia record. Include pre-meds, induction, maintenance, and recovery details mentioned.'
    },
    vaccine: {
        id: 'vaccine',
        name: 'Vaccine/Wellness',
        icon: '💉',
        prompt: 'Format as a Wellness/Vaccination check. Ensure vaccine types, locations (if mentioned), and next due dates are highlighted.'
    },
    dental: {
        id: 'dental',
        name: 'Dental/Oral',
        icon: '🦷',
        prompt: 'Format as an Oral Health Assessment and Treatment (COHAT) record. Focus on dental indexing and systemic oral health.'
    },
    emergency: {
        id: 'emergency',
        name: 'Emergency/Triage',
        icon: '🚨',
        prompt: 'Format as an Emergency Triage note. Prioritize chief complaint, vital stability, and immediate stabilization plan.'
    }
};
