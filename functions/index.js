const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Initialize Gemini
// Note: We use process.env.GEMINI_API_KEY if available (modern), or functions.config().gemini.key (legacy)
const API_KEY = process.env.GEMINI_API_KEY || functions.config().gemini?.key;
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        temperature: 0.3, // Lower for clinical accuracy
    },
});

const AIVA_SYSTEM_PROMPT = `
You are AIVA (Artificial Intelligence Veterinary Assistant).
Your task is to structure raw veterinary consultation transcripts into a professional SOAP note.

RULES:
1. Output MUST be a valid JSON object.
2. The JSON schema must be:
   - subjective (string): History, client complaints, duration, progression.
   - objective (string): Physical exam findings, vital signs.
   - assessment (string): Differential diagnoses, confirmed diagnoses.
   - plan (string): Diagnostics, treatments, medications (w/ dosages), follow-up.
   - missedCharges (array of strings): Procedures/items mentioned but potentially not billed (e.g. "Nail Trim", "Cytology", "Fluids").
3. Use professional medical terminology (e.g. "vomiting" -> "emesis").
4. Be concise and telegraphic style.
5. If the input is empty or nonsense, return fields with "Not reported".
`;

exports.structureNote = functions.https.onCall(async (data, context) => {
    const transcript = data.transcript;

    if (!transcript || typeof transcript !== "string") {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with a 'transcript' string."
        );
    }

    if (!API_KEY) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "Gemini API key not configured."
        );
    }

    try {
        const prompt = `
    ${AIVA_SYSTEM_PROMPT}

    RAW TRANSCRIPT:
    "${transcript}"

    JSON OUTPUT:
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if any
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Gemini Error:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Failed to structure note via Gemini."
        );
    }
});
