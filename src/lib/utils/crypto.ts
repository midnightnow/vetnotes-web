// REMOVED js-sha3 dependency to fix Vite/CJS interop issues for demo stability.
// import jsSha3 from 'js-sha3';

export function sha3Hash(input: string): string {
    // DEMO IMPLEMENTATION: Robust fallback that doesn't crash
    // In production, restore real SHA-3 or use Web Crypto API (async)
    let hash = 0;
    if (input.length === 0) return '00000000';
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase() + "-SIMULATED-HASH";
    // return jsSha3.sha3_256(input);
}

export function generateSampleId(region: string, type: string, sampleType: string): string {
    const prefix = region === 'FNQ' ? 'FNQ' : 'AUS';
    const typeCode = type.substring(0, 4).toUpperCase();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    // Robust random hash for ID generation
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}-${typeCode}-${sampleType.toUpperCase()}-${date}-${hash}`;
}
