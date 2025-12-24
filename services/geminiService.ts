import { TargetType } from "../types";

// FREE MODELS CONFIGURATION
export const FREE_MODELS = [
    { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite (Free)' },
    { id: 'xiaomi/mimo-v2-flash:free', name: 'Xiaomi Mimo V2 Flash (Free)' },
    { id: 'mistralai/devstral-2512:free', name: 'Mistral Devstral 2512 (Free)' },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1-T2 Chimera (Free)' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)' },
    { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini (Free)' },
];

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

export const checkModelAvailability = async (apiKey: string, modelId: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.href,
        "X-Title": "Universal OSINT Orchestrator",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `Status ${response.status}`);
    }

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
    modelId: string = 'google/gemini-2.0-flash-lite-preview-02-05:free'
): Promise<void> => {
  // Prefer Vite env var, then generic env var, then custom key
  // Fix: use process.env instead of import.meta.env
  const apiKey = customApiKey || process.env.VITE_OPENROUTER_API_KEY || process.env.API_KEY;
    
  if (!apiKey) {
      throw new Error("No OpenRouter API Key Found. Please set a Custom API Key.");
  }

  const timestamp = new Date().toISOString();
  
  let contextPrompt = "";
  if (additionalInfo) {
      contextPrompt = `\nADDITIONAL CONTEXT PROVIDED BY INTELLIGENCE OFFICER:\n"${additionalInfo}"\nUse this context to filter false positives and find the correct individual.\n`;
  }

  const userPrompt = `
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
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.href,
            "X-Title": "Universal OSINT Orchestrator",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            stream: true
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenRouter API Error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    if (!reader) throw new Error("Response body is null");

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim() !== "");

        for (const line of lines) {
            if (line.includes("[DONE]")) return;
            
            if (line.startsWith("data: ")) {
                try {
                    const json = JSON.parse(line.replace("data: ", ""));
                    const content = json.choices[0]?.delta?.content;
                    if (content) {
                        onUpdate(content);
                    }
                } catch (e) {
                    console.warn("Error parsing chunk", e);
                }
            }
        }
    }

  } catch (error: any) {
    console.error("OpenRouter API Error:", error);
    throw error;
  }
};