import { GoogleGenAI } from "@google/genai";
import { TargetType } from "../types";

// GOOGLE MODELS CONFIGURATION
export const GOOGLE_MODELS = [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro Preview' },
    { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Exp' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash Lite' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
];

const SYSTEM_PROMPT = `
ROLE: You are the Universal OSINT Orchestrator.
GOAL: Perform a COMPREHENSIVE ACADEMIC ANALYSIS using live search data.

CORE DIRECTIVES:
1. **ZERO TRUNCATION**: Do not summarize. List all findings in detail.
2. **VERBOSITY**: Prefer detailed reports.
3. **REAL DATA ONLY**: Do NOT generate fake data. Use the provided search tools to verify.
4. **SCOPE**:
   - **Education/Work**: specific dates, degrees, project names, and thesis titles.
   - **Development**: repository names, commit history summaries, and languages.
   - **Social**: bio text exactly as written.

TASK:
1. Analyze the context and target identifier.
2. If multiple potential matches exist, list the top 3 most likely candidates with reasoning.
3. STREAM the output as a detailed Markdown dossier.

OUTPUT RULES:
- **Do not** use phrases like "various projects" or "and others". List them.
- **Do not** cut off long text. 
- **Do not** omit dates or locations.
- **IMPORTANT**: Return RAW markdown text only. Do not wrap in markdown code blocks.
`;

export const checkModelAvailability = async (apiKey: string, modelId: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required");

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Simple generation to test connection
    await ai.models.generateContent({
      model: modelId,
      contents: { role: 'user', parts: [{ text: 'ping' }] }
    });
    return modelId;
  } catch (e: any) {
    throw new Error(`Connection Failed: ${e.message}`);
  }
};

export const streamOsintData = async (
    target: string, 
    type: TargetType, 
    additionalInfo: string, 
    onUpdate: (chunk: string) => void,
    customApiKey?: string,
    modelId: string = 'gemini-3-pro-preview'
): Promise<void> => {
  // Priority: 
  // 1. Custom Key entered in UI
  // 2. API_KEY (Environment Variable)
  const apiKey = customApiKey || process.env.API_KEY;
    
  if (!apiKey) {
      throw new Error("No Google API Key Found. Please set a Custom API Key or configure API_KEY.");
  }

  const timestamp = new Date().toISOString();
  
  let contextPrompt = "";
  if (additionalInfo) {
      contextPrompt = `\nADDITIONAL CONTEXT:\n"${additionalInfo}"\nUse this context to filter results.\n`;
  }

  const userPrompt = `
    TARGET: "${target}"
    DETECTED TYPE: ${type}
    TIMESTAMP: ${timestamp}
    ${contextPrompt}
    
    Conduct a deep research analysis. 
    **Look specifically for resumes, CVs, portfolios, and academic records.**
    
    INSTRUCTION:
    Provide the MOST DETAILED report possible. 
    If you find a GitHub profile, list the top repositories. 
    If you find a LinkedIn, list the full work history with dates.
    DO NOT TRIM THE OUTPUT.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContentStream({
        model: modelId,
        contents: [
            { role: 'user', parts: [{ text: userPrompt }] }
        ],
        config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: [{ googleSearch: {} }]
        }
    });

    const collectedUrls = new Set<string>();
    const collectedQueries = new Set<string>();

    for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
            onUpdate(text);
        }

        // Collect grounding metadata (sources & queries)
        const groundingMetadata = chunk.groundingMetadata;
        if (groundingMetadata) {
            // Collect Sources
            groundingMetadata.groundingChunks?.forEach((c: any) => {
                if (c.web?.uri) {
                    collectedUrls.add(`[${c.web.title || 'Source'}](${c.web.uri})`);
                }
            });

            // Collect Queries
            if (groundingMetadata.webSearchQueries) {
                groundingMetadata.webSearchQueries.forEach((q: string) => collectedQueries.add(q));
            }
        }
    }

    // Build Footer with Queries and Sources
    let footer = "";
    
    if (collectedQueries.size > 0 || collectedUrls.size > 0) {
        footer += "\n\n---\n";
        footer += "### 📡 Intelligence Gathering Log\n";
    }

    if (collectedQueries.size > 0) {
        footer += "\n**Executed Search Queries:**\n" + 
                  Array.from(collectedQueries).map(q => `- \`${q}\``).join("\n");
    }

    if (collectedUrls.size > 0) {
        footer += "\n\n**Verified Sources:**\n" + 
                  Array.from(collectedUrls).map(url => `- ${url}`).join("\n");
    }

    if (footer) {
        onUpdate(footer);
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};