/**
 * PII Redaction Utility for VetNotes
 * Designed to scrub patient/client identifiers before text leaves the local "Local Loop".
 */

export function redactPII(text: string): string {
    let redacted = text;

    // 1. Phone Numbers (Various Formats)
    redacted = redacted.replace(/(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[PHONE]');

    // 2. Email Addresses
    redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

    // 3. Dates of Birth (Optional - common in transcripts)
    // Match "Born on X", "DOB: X", etc.
    redacted = redacted.replace(/\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/g, '[DATE]');

    // 4. Heuristic for Surname patterns (e.g., "Mr. Smith", "Mrs. Jackson")
    // We look for common titles followed by a capitalized word
    redacted = redacted.replace(/\b(Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+)\b/g, '$1 [SURNAME]');

    // 5. Patient Name patterns (e.g., "The dog, Bella", "Cat's name is Luna")
    // This is harder but we can catch common "Name is X" structures
    redacted = redacted.replace(/\b(name is|called|named)\s+([A-Z][a-z]+)\b/gi, '$1 [NAME]');

    return redacted;
}
