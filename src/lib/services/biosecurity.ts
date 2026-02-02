import { NOTIFIABLE_CONDITIONS, type NotifiableCondition } from '../data/notifiable';

export function detectNotifiableConditions(transcript: string): NotifiableCondition[] {
    if (!transcript) return [];

    const detected: NotifiableCondition[] = [];
    const lowerTranscript = transcript.toLowerCase();

    for (const condition of NOTIFIABLE_CONDITIONS) {
        const found = condition.keywords.some(keyword =>
            lowerTranscript.includes(keyword.toLowerCase())
        );

        if (found) {
            detected.push(condition);
        }
    }

    return detected;
}
