import { GoogleGenAI } from "@google/genai";
import { TargetType } from "../types";

const SYSTEM_PROMPT = `
ROLE: You are the Universal OSINT Orchestrator.
GOAL: Perform a FORENSIC-LEVEL SCRAPE. 

CORE DIRECTIVES:
1. **ZERO TRUNCATION**: You are prohibited from summarizing. If you find a list of 50 items, LIST ALL 50.
2. **VERBOSITY**: Prefer long, detailed reports over concise ones. 
3. **REAL DATA ONLY**: Do NOT generate fake data.
4. **SCOPE**:
   - **Education/Work**: Extract specific dates, GPA, project names, and thesis titles.
   - **Development**: Extract repository names, commit history summaries, and languages used.
   - **Social**: Extract bio text exactly as written.

TASK:
1. Search Google for the target using the context.
2. If multiple potential matches are found, list the top 3 most likely candidates with reasoning.
3. STREAM the output as a detailed Markdown dossier.

OUTPUT RULES:
- **Do not** use phrases like "various projects" or "and others". List them.
- **Do not** cut off long text. 
- **Do not** omit dates or locations.
- **IMPORTANT**: Do NOT wrap the output in a markdown code block (e.g., \`\`\`markdown). Return RAW markdown text only.
`;

export const checkModelAvailability = async (apiKey: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required");
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Define models to try in order of preference for OSINT tasks
  // Pro is better for reasoning, Flash is faster/cheaper/higher quota
  const models = [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash 2.0' } // Fallback to stable latest
  ];

  for (const model of models) {
    try {
      // Small ping to check quota/availability with timeout
      const checkPromise = ai.models.generateContent({
        model: model.id,
        contents: 'ping',
        config: { maxOutputTokens: 1 }
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );

      await Promise.race([checkPromise, timeoutPromise]);
      return model.id;
    } catch (e: any) {
       console.warn(`Model ${model.id} failed check:`, e.message);
       // Continue to next model
    }
  }

  throw new Error("Unable to establish connection with any supported Gemini model. Your API key may be invalid or quota exceeded.");
};

export const streamOsintData = async (
    target: string, 
    type: TargetType, 
    additionalInfo: string, 
    onUpdate: (chunk: string) => void,
    customApiKey?: string,
    modelId: string = 'gemini-3-pro-preview'
): Promise<void> => {
  try {
    const apiKey = customApiKey || process.env.API_KEY;
    
    if (!apiKey) {
        throw new Error("No API Configuration Found. Please set a Custom API Key.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const timestamp = new Date().toISOString();
    
    let contextPrompt = "";
    if (additionalInfo) {
        contextPrompt = `\nADDITIONAL CONTEXT PROVIDED BY INTELLIGENCE OFFICER:\n"${additionalInfo}"\nUse this context to filter false positives and find the correct individual.\n`;
    }

    const prompt = `
      TARGET: "${target}"
      DETECTED TYPE: ${type}
      TIMESTAMP: ${timestamp}
      ${contextPrompt}
      
      Conduct a deep, multi-pass OSINT reconnaissance. 
      **Search specifically for resumes, CVs, portfolios, and academic records.**
      
      CRITICAL INSTRUCTION:
      Provide the MOST DETAILED report possible. 
      If you find a GitHub profile, list the top repositories. 
      If you find a LinkedIn, list the full work history with dates.
      DO NOT TRIM THE OUTPUT.
      
      Begin streaming the Markdown report immediately.
    `;

    // Use the dynamic modelId passed from the app state
    const responseStream = await ai.models.generateContentStream({
      model: modelId, 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
        temperature: 0, 
      }
    });

    for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
            onUpdate(text);
        }
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};