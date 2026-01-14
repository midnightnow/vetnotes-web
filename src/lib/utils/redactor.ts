// PII Redaction Utility for Client-Side Privacy
// Runs before any data leaves the browser

const REDACTION_PATTERNS = [
    // Phone numbers (various formats)
    { pattern: /\b(?:\+?61|0)[\s.-]?(?:4[\d]{2}|[2-9])[\s.-]?\d{3}[\s.-]?\d{3,4}\b/g, replacement: '[PHONE]' },
    { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[PHONE]' },

    // Email addresses
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },

    // Microchip numbers (15-digit)
    { pattern: /\b9\d{14}\b/g, replacement: '[MICROCHIP]' },

    // Credit card numbers
    { pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g, replacement: '[CARD]' },

    // Australian postcodes
    { pattern: /\b[0-9]{4}\b(?=\s*(?:NSW|VIC|QLD|WA|SA|TAS|NT|ACT)?)/gi, replacement: '[POSTCODE]' },

    // Street addresses
    { pattern: /\b\d+\s+[A-Za-z]+\s+(?:St(?:reet)?|Rd|Road|Ave(?:nue)?|Dr(?:ive)?|Ct|Court|Cres(?:cent)?|Pl(?:ace)?|Lane|Way)\b/gi, replacement: '[ADDRESS]' },

    // Medicare/Health numbers
    { pattern: /\b\d{4}\s?\d{5}\s?\d{1}\b/g, replacement: '[HEALTH_ID]' },

    // Date of birth patterns
    { pattern: /\b(?:DOB|born|birthday)[:\s]+\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi, replacement: '[DOB]' },
];

// Common name patterns (simple heuristic)
const NAME_INDICATORS = [
    /\b(?:Mrs?\.?|Ms\.?|Dr\.?|Miss)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
    /\b(?:owner|client)\s+(?:is\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi,
];

export function redactPII(text: string, options: { aggressive?: boolean } = {}): string {
    let redacted = text;

    // Apply pattern-based redaction
    for (const { pattern, replacement } of REDACTION_PATTERNS) {
        redacted = redacted.replace(pattern, replacement);
    }

    // Apply name redaction if aggressive mode
    if (options.aggressive) {
        for (const pattern of NAME_INDICATORS) {
            redacted = redacted.replace(pattern, (match, name) => {
                return match.replace(name, '[CLIENT_NAME]');
            });
        }
    }

    return redacted;
}

export function detectPIITypes(text: string): string[] {
    const detected: string[] = [];

    for (const { pattern, replacement } of REDACTION_PATTERNS) {
        if (pattern.test(text)) {
            detected.push(replacement.replace(/[\[\]]/g, ''));
        }
        // Reset lastIndex for global patterns
        pattern.lastIndex = 0;
    }

    return [...new Set(detected)];
}

export function generateRedactionReport(original: string, redacted: string): {
    originalLength: number;
    redactedLength: number;
    redactionsCount: number;
    piiTypesFound: string[];
} {
    const piiTypes = detectPIITypes(original);

    // Count redactions by looking for [PLACEHOLDER] patterns
    const redactionMatches = redacted.match(/\[[A-Z_]+\]/g) || [];

    return {
        originalLength: original.length,
        redactedLength: redacted.length,
        redactionsCount: redactionMatches.length,
        piiTypesFound: piiTypes
    };
}
