import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini Client
// WARNING: In a production app, calling this directly from the client exposes the API key.
// Ensure your API key has referrer restrictions set in Google Cloud Console to only allow 'vetnotes.me' and 'vetnotes-mvp.web.app'.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        temperature: 0.3, // Lower for clinical accuracy and consistency
    }
});

const AIVA_SYSTEM_PROMPT = `
You are AIVA (Artificial Intelligence Veterinary Assistant), a specialist in veterinary documentation and REVENUE CAPTURE.
Your task is to structure raw veterinary consultation transcripts into a professional SOAP note and IDENITFY MISSED REVENUE.

RULES:
1. Output MUST be a valid JSON object. Do not include markdown formatting (like \`\`\`json) in the response.
2. The JSON schema must be exactly:
   {
	 "subjective": "string",
	 "objective": "string",
	 "assessment": "string",
	 "plan": "string",
	 "missedCharges": ["string"]
   }
3. Use professional medical terminology (e.g. "vomiting" -> "emesis").
4. Be concise and telegraphic style.

REVENUE LEAKAGE DETECTION (CRITICAL):
Scan the transcript for ANY procedures, items, or services that are often forgotten. If mentioned or implied, add to "missedCharges".
Examples to watch for:
- "Nail trim" / "Pedicure"
- "Cytology" / "Ear swab" / "Skin scrape"
- "Fluids" / "Subcutaneous fluids" -> "Fluid Administration" + "Fluid Bag"
- "Hospitalization" / "Day stay"
- "Medical Waste" (if injections given)
- "E-Collar" / "Cone"
- "Urinalysis" / "Cystocentesis"
- "Sedation" / "Torbugesic" / "Dexdomitor"
- "Reverse" (Antisedan)

If the input is empty or nonsense, return fields with "Not reported".
`;

export const structureNote = structureViaGemini;

export async function structureViaGemini(transcript: string, customApiKey?: string, templatePrompt?: string): Promise<any> {
    const keyToUse = customApiKey || API_KEY;

    if (!keyToUse) {
        console.error("Gemini API Key missing");
        throw new Error("Gemini API Key not configured");
    }

    const genAI = new GoogleGenerativeAI(keyToUse);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.3,
        }
    });

    const prompt = `
    ${templatePrompt || AIVA_SYSTEM_PROMPT}

    RAW TRANSCRIPT:
    "${transcript}"

    JSON OUTPUT:
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if the model includes them despite instructions
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}
