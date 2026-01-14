const PROJECT_PROMPT = `
Act as an expert Veterinary Scribe. 
Convert the provided raw transcript from a veterinary consultation into a professional, structured SOAP note.

RULES:
1. Maintain clinical terminology.
2. Use standard SOAP headings (Subjective, Objective, Assessment, Plan).
3. Capture specific diagnostics or dosages accurately.
4. Professional and concise.
5. No hallucinations.

Transcript follows:
---
`;

export async function structureNoteLocal(transcript: string, modelName: string = "llama3") {
    try {
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: modelName,
                prompt: PROJECT_PROMPT + transcript,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error("Ollama connection failed");
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error("Ollama Error:", error);
        throw error;
    }
}
