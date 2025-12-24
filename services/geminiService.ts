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
  
  // UPDATED PRIORITY: 
  // Added 1.5 Flash 8B as extreme fallback and increased robustness
  const models = [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro' }
  ];

  const errors: string[] = [];

  for (const model of models) {
    try {
      // Increased timeout to 10s to handle Vercel cold starts / edge latency
      const checkPromise = ai.models.generateContent({
        model: model.id,
        contents: 'ping',
        config: { maxOutputTokens: 1 }
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout connecting to ${model.id}`)), 10000)
      );

      await Promise.race([checkPromise, timeoutPromise]);
      return model.id;
    } catch (e: any) {
       console.warn(`Model ${model.id} failed check:`, e.message);
       errors.push(e.message || "Unknown error");
    }
  }

  // Diagnostic Error Analysis for User Feedback
  const joinedErrors = errors.join(' ');
  
  // Check for common API Key restrictions
  if (joinedErrors.includes("403") || joinedErrors.includes("check your API key")) {
      throw new Error("Access Denied (403). If using Vercel, check if your API Key in Google Cloud Console has 'Referrer' restrictions. You may need to add your Vercel domain.");
  }
  
  if (joinedErrors.includes("429") || joinedErrors.includes("quota")) {
      throw new Error("Quota Exceeded (429). Your API key has exhausted its free tier limits on all available models.");
  }

  if (joinedErrors.includes("Timeout")) {
      throw new Error("Network Timeout. Connection to Google AI blocked or too slow.");
  }

  throw new Error(`Connection Failed. Google AI refused connection. (Last error: ${errors[0]})`);
};

export const streamOsintData = async (
    target: string, 
    type: TargetType, 
    additionalInfo: string, 
    onUpdate: (chunk: string) => void,
    customApiKey?: string,
    modelId: string = 'gemini-2.0-flash-exp'
): Promise<void> => {
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

  try {
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

  } catch (error: any) {
    console.error(`Error on model ${modelId}:`, error);
    
    const isQuotaError = error.message?.includes("429") || error.message?.includes("quota") || error.status === 429;
    const isOverload = error.message?.includes("503") || error.message?.includes("overloaded");
    
    // Fallback Chain Logic
    if (isQuotaError || isOverload) {
        let backupModel = '';
        
        if (modelId === 'gemini-3-pro-preview') backupModel = 'gemini-2.0-flash-exp';
        else if (modelId === 'gemini-2.0-flash-exp') backupModel = 'gemini-1.5-flash';
        else if (modelId === 'gemini-1.5-flash') backupModel = 'gemini-1.5-flash-8b';

        if (backupModel) {
            console.warn(`Rerouting from ${modelId} to ${backupModel}...`);
            onUpdate(`\n\n> **[SYSTEM ALERT]:** UPLINK ${modelId.toUpperCase()} UNSTABLE (ERROR ${isQuotaError ? '429' : '503'}).\n> **[ACTION]:** REROUTING TO ${backupModel.toUpperCase()}...\n\n---\n\n`);
            return streamOsintData(target, type, additionalInfo, onUpdate, apiKey, backupModel);
        }
    }

    throw error;
  }
};