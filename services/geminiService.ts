import { GoogleGenAI, Type } from "@google/genai";
import { TargetType, OsintResult } from "../types";

const SYSTEM_PROMPT = `
ROLE: You are the Universal OSINT Orchestrator, a real-time intelligence gathering interface.
Your goal is to perform an INITIAL RECONNAISSANCE scan on the target using Google Search.

CORE DIRECTIVES:
1. **REAL DATA ONLY**: Do NOT generate fake, simulated, or dummy data. Use the Google Search tool to find *actual* public footprints (social media, news, registries).
2. **HONESTY**: If Google Search returns no relevant results for the specific target, explicitly state: "No publicly available intelligence found for this selector."
3. **REPORTING**: Synthesize found data into a clean, professional Markdown dossier. Cite sources/URLs where possible.

TASK:
The user will provide a target. You must:
1. Search Google for the target to find real-world traces.
2. Compile the "reportMarkdown" based EXCLUSIVELY on search results or general knowledge (e.g., if it's a known entity).

OUTPUT FORMAT:
Return a JSON object with one field:
- "reportMarkdown": The intelligence dossier (Markdown format).
`;

export const generateOsintData = async (target: string, type: TargetType): Promise<OsintResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      TARGET: "${target}"
      DETECTED TYPE: ${type}
      
      Conduct real-time OSINT reconnaissance and generate the report.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reportMarkdown: { type: Type.STRING }
          },
          required: ["reportMarkdown"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text);
    return {
      reportMarkdown: data.reportMarkdown
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};