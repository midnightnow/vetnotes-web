/**
 * Weight Parser Utility
 * Ensures that random numbers in transcript are not misidentified as patient weight.
 * Looks for explicit units (kg, lb) and context clues.
 */

export interface WeightMatch {
    value: number;
    unit: 'kg' | 'lb';
    confidence: number;
}

const WEIGHT_UNITS = ['kg', 'kilo', 'kgs', 'kilos', 'lb', 'lbs', 'pounds'];
const CONTEXT_CLUES = ['weighs', 'weight', 'mass', 'heavy'];

export function parseWeightFromText(text: string): WeightMatch | null {
    if (!text) return null;

    // Pattern: [number] [optional space] [unit]
    const pattern = /\b(\d+(\.\d+)?)\s*(kg|kilo|kgs|kilos|lb|lbs|pounds)\b/i;
    const match = text.match(pattern);

    if (!match) {
        // Fallback: look for "weighs [number]" without unit
        const fallbackPattern = /\b(?:weighs|weight is)\s*(\d+(\.\d+)?)\b/i;
        const fallbackMatch = text.match(fallbackPattern);

        if (fallbackMatch && fallbackMatch[1]) {
            return {
                value: parseFloat(fallbackMatch[1]),
                unit: 'kg', // Default to kg if not specified
                confidence: 0.6
            };
        }
        return null;
    }

    const value = parseFloat(match[1]);
    const unitRaw = match[3].toLowerCase();
    const unit: 'kg' | 'lb' = ['lb', 'lbs', 'pounds'].includes(unitRaw) ? 'lb' : 'kg';

    // Calculate Confidence
    let confidence = 0.8; // Base confidence for value + unit

    const sentence = getSurroundingSentence(text, match.index || 0);
    if (CONTEXT_CLUES.some(clue => sentence.toLowerCase().includes(clue))) {
        confidence += 0.2; // Increase if context clues like "weighs" are present
    }

    return { value, unit, confidence };
}

function getSurroundingSentence(text: string, index: number): string {
    const start = text.lastIndexOf('.', index) + 1;
    const end = text.indexOf('.', index);
    return text.substring(start, end === -1 ? text.length : end).trim();
}

/**
 * Converts pounds to kilograms if necessary
 */
export function toKg(value: number, unit: 'kg' | 'lb'): number {
    if (unit === 'kg') return value;
    return value * 0.453592;
}
