import { GoogleGenerativeAI } from "@google/generative-ai";

const PROJECT_PROMPT = `
Act as an expert Veterinary Scribe. 
Convert the provided raw transcript from a veterinary consultation into a professional, structured SOAP note.

RULES:
1. Maintain clinical terminology.
2. Use standard SOAP headings (Subjective, Objective, Assessment, Plan).
3. If specific diagnostics or dosages are mentioned, ensure they are captured accurately.
4. Keep the tone professional but concise.
5. If the transcript is unclear, use your best clinical judgment but do not hallucinate data points that were not present.

Transcript follows:
---
`;

export async function structureNote(transcript: string, apiKey: string) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = PROJECT_PROMPT + transcript;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        throw error;
    }
}
