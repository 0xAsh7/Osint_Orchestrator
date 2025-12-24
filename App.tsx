import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TargetType, AppState, LogEntry, OsintResult } from './types';
import { InputConsole } from './components/InputConsole';
import { TerminalLog } from './components/TerminalLog';
import { ResultViewer } from './components/ResultViewer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { DisclaimerOverlay } from './components/DisclaimerOverlay';
import { streamOsintData } from './services/geminiService';
import { Shield, Activity, Database, Key, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'osint_gemini_api_key';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<OsintResult | null>(null);
  
  // Disclaimer State
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  
  // State for Retry Logic
  const [lastTarget, setLastTarget] = useState<string>('');
  const [lastType, setLastType] = useState<TargetType>(TargetType.UNKNOWN);
  const [lastInfo, setLastInfo] = useState<string>('');
  const [expandInput, setExpandInput] = useState(false);

  // API Key Management
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isErrorMode, setIsErrorMode] = useState(false);

  // Refs for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize: Check for stored API Key
  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEY);
    if (storedKey) {
        setCustomApiKey(storedKey);
    } else {
        // If no key is saved, prompt the user immediately
        setIsKeyModalOpen(true);
    }
  }, []);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const handleStart = (target: string, type: TargetType, additionalInfo: string) => {
    // 1. Set Initial Data
    setLastTarget(target);
    setLastType(type);
    setLastInfo(additionalInfo);
    setExpandInput(false);
    
    // 2. Clear previous results explicitly to reset container height
    setResult(null);
    setLogs([]);

    // 3. Reveal the UI by transitioning state from IDLE
    // This unhides the result container where the disclaimer lives
    setAppState(AppState.ANALYZING);
    
    // 4. Show Disclaimer Immediately
    setShowDisclaimer(true);
  };

  const handleDisclaimerAcknowledge = () => {
    setShowDisclaimer(false);
    startScan(lastTarget, lastType, lastInfo);
  };

  const startScan = async (target: string, type: TargetType, additionalInfo: string) => {
    // Ensure state is ANALYZING
    setAppState(AppState.ANALYZING);
    
    // Initialize AbortController for this run
    abortControllerRef.current = new AbortController();

    try {
        // Check if we have a key before starting visual sequence
        if (!customApiKey && !process.env.API_KEY) {
            throw new Error("Missing API Key");
        }

        // Start the visual log sequence (Runs in background)
        const logPromise = runRealisticSequence();

        // Start the actual API call
        // Initialize empty result for streaming
        setResult({ reportMarkdown: '' });

        let streamBuffer = '';
        
        // Wait for the API
        await streamOsintData(
            target, 
            type, 
            additionalInfo, 
            (chunk) => {
                // When first chunk arrives, update state to GENERATING
                if (streamBuffer === '') {
                    setAppState(AppState.GENERATING);
                }
                streamBuffer += chunk;
                setResult({ reportMarkdown: streamBuffer });
            },
            customApiKey
        );
        
        // Ensure logs finish before showing complete? 
        // No, let them race, but typically API takes longer.
        await logPromise;

        setAppState(AppState.COMPLETE);
        addLog('Response stream closed successfully.', 'success');

    } catch (error) {
        console.error(error);
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        
        addLog('API REQUEST FAILED.', 'error');
        addLog(errMsg, 'error');
        setAppState(AppState.ERROR);
        
        if (errMsg.includes("API Key") || errMsg.includes("Key")) {
             setIsErrorMode(true);
             setIsKeyModalOpen(true);
        }
    }
  };

  const runRealisticSequence = async () => {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    // Total duration planned: ~55-60 seconds to match the "59s" observation
    
    addLog(`Initializing @google/genai client...`, 'system');
    await delay(1000);
    
    addLog(`Target: "${lastTarget}" (${lastType})`, 'info');
    if (lastInfo) addLog(`Injecting context parameters...`, 'info');
    
    await delay(1500);
    addLog(`Constructing prompt for 'gemini-3-pro-preview'...`, 'system');
    await delay(2000);
    
    addLog(`Dispatching payload to Google Cloud Vertex AI...`, 'warning');
    await delay(3000); // T+7.5s

    // The long wait starts here
    addLog(`Waiting for Server-Side Tool Execution (Google Search)...`, 'info');
    await delay(12000); // T+19.5s
    
    addLog(`Tool: Google Search Grounding active. Retrying query variations...`, 'system');
    await delay(10000); // T+29.5s
    
    addLog(`Model is processing search results...`, 'info');
    await delay(8000); // T+37.5s

    addLog(`Reasoning engine engaged. Filtering false positives...`, 'warning');
    await delay(10000); // T+47.5s

    addLog(`Synthesizing Markdown response stream...`, 'success');
    await delay(5000); // T+52.5s
    
    addLog(`Packet header received. Decrypting stream...`, 'system');
    // The loop ends, usually the stream starts right after this.
  };

  const handleSaveKey = (key: string, shouldSave: boolean) => {
    setCustomApiKey(key);
    
    if (shouldSave && key) {
        localStorage.setItem(STORAGE_KEY, key);
        addLog('Secure Uplink Established. Key Saved to Local Storage.', 'success');
    } else {
        localStorage.removeItem(STORAGE_KEY);
        if (key) addLog('Secure Uplink Established (Session Only).', 'success');
    }

    setIsKeyModalOpen(false);
    setIsErrorMode(false);
  };

  const handleRetry = () => {
    if (lastTarget) {
        handleStart(lastTarget, lastType, lastInfo);
    }
  };

  const handleRefine = () => {
    setExpandInput(true);
    const element = document.getElementById('input-console');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-osint-green selection:text-black flex flex-col overflow-x-hidden">
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)} 
        onSave={handleSaveKey}
        initialValue={customApiKey}
        isErrorMode={isErrorMode}
      />

      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-osint-green" />
                <h1 className="text-lg md:text-xl font-bold font-mono tracking-tighter text-white">
                    OSINT<span className="text-osint-green">ORCHESTRATOR</span>
                </h1>
            </div>
            <div className="flex items-center gap-3 md:gap-6 text-xs font-mono text-gray-500">
                <div className="hidden md:flex items-center gap-2">
                    <Activity className={`w-3 h-3 ${appState === AppState.ANALYZING || appState === AppState.GENERATING ? 'text-osint-green animate-pulse' : ''}`} />
                    <span>SYSTEM: {appState === AppState.IDLE ? 'READY' : 'BUSY'}</span>
                </div>
                <div className="hidden lg:flex items-center gap-2">
                    <Database className="w-3 h-3" />
                    <span>LIVE CONNECT</span>
                </div>
                <button 
                    onClick={() => { setIsErrorMode(false); setIsKeyModalOpen(true); }}
                    className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 rounded border transition-colors ${customApiKey ? 'border-osint-green text-osint-green bg-osint-green/10' : 'border-gray-700 hover:border-gray-500'}`}
                >
                    <Key className="w-3 h-3" />
                    <span className="hidden sm:inline">{customApiKey ? 'KEY: ACTIVE' : 'SET API KEY'}</span>
                    <span className="sm:hidden">{customApiKey ? 'API' : 'KEY'}</span>
                </button>
            </div>
        </div>
      </header>

      {/* Main Content with Hero Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 md:p-6 lg:p-8 flex flex-col relative pb-safe">
        
        {/* Input Section - Hero Mode Logic */}
        <div className={`
            flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform
            ${appState === AppState.IDLE ? 'flex-grow justify-center py-10 md:py-20' : 'flex-none pt-0 pb-4 md:pb-6'}
        `}>
            <InputConsole 
                onStart={handleStart} 
                appState={appState} 
                initialInput={lastTarget}
                initialInfo={lastInfo}
                autoExpand={expandInput}
            />
        </div>

        {/* Workspace Grid - Fades in/up when active */}
        <div className={`
            flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 min-h-[500px] transition-all duration-1000 delay-300 gpu-accelerated
            ${appState === AppState.IDLE ? 'opacity-0 translate-y-20 h-0 hidden' : 'opacity-100 translate-y-0 h-auto animate-blur-in'}
        `}>
            {/* Left: Live Terminal Log */}
            <div className="lg:col-span-1 h-48 lg:h-full flex flex-col order-2 lg:order-1">
                <div className="mb-2 flex items-center justify-between text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-widest">
                    <span>Execution Log</span>
                    <span className="text-osint-dim">Live Feed</span>
                </div>
                <TerminalLog logs={logs} />
            </div>

            {/* Right: Results / Visualization */}
            <div className="lg:col-span-2 h-[60vh] lg:h-full flex flex-col relative order-1 lg:order-2">
                <div className="mb-2 flex items-center justify-between text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-widest">
                    <span>Intelligence Output</span>
                    {appState === AppState.COMPLETE && <span className="text-osint-green">Active</span>}
                    {appState === AppState.GENERATING && <span className="text-osint-green animate-pulse">Streaming...</span>}
                </div>
                
                {/* Result Container with Overlay Logic */}
                <div className="relative flex-1 rounded-lg overflow-hidden min-h-[400px]">
                    {/* Disclaimer Overlay (State Controlled) */}
                    {showDisclaimer && (
                        <DisclaimerOverlay onAcknowledge={handleDisclaimerAcknowledge} />
                    )}

                    {result ? (
                        <ResultViewer 
                            result={result} 
                            onRetry={handleRetry}
                            onRefine={handleRefine}
                            isStreaming={appState === AppState.ANALYZING || appState === AppState.GENERATING}
                        />
                    ) : (
                        <div className="h-full bg-gray-900/30 border border-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden animate-blur-in">
                            {appState !== AppState.IDLE && appState !== AppState.ERROR && (
                            <div className="absolute inset-0 bg-[url('https://assets.codepen.io/13471/sparkle.gif')] opacity-5 mix-blend-screen pointer-events-none"></div>
                            )}
                            <div className="text-center p-4 md:p-8">
                                {(appState === AppState.ANALYZING) && (
                                    <>
                                        <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-osint-dim/30 border-t-osint-green rounded-full animate-spin mx-auto mb-4 md:mb-6"></div>
                                        <p className="text-osint-green font-mono animate-pulse tracking-widest text-xs md:text-base">
                                            AWAITING NEURAL HANDSHAKE...
                                        </p>
                                    </>
                                )}
                                {appState === AppState.ERROR && (
                                    <>
                                        <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-4 md:mb-6" />
                                        <p className="text-red-500 font-mono font-bold text-sm md:text-base">CONNECTION TERMINATED</p>
                                        <p className="text-gray-500 text-xs mt-2">Check logs for details.</p>
                                        <button onClick={() => setAppState(AppState.IDLE)} className="mt-4 text-xs text-gray-400 hover:text-white underline">RESET SYSTEM</button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-black py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
            <p className="text-gray-600 text-[10px] md:text-xs font-mono text-center md:text-left">
                UNIVERSAL OSINT ORCHESTRATOR // EDUCATIONAL PURPOSES ONLY
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;