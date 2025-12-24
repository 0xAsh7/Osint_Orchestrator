import React, { useState, useRef, useCallback } from 'react';
import { TargetType, AppState, LogEntry, OsintResult } from './types';
import { InputConsole } from './components/InputConsole';
import { TerminalLog } from './components/TerminalLog';
import { ResultViewer } from './components/ResultViewer';
import { generateOsintData } from './services/geminiService';
import { Shield, Activity, Lock, Database } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<OsintResult | null>(null);
  
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const handleStart = async (target: string, type: TargetType) => {
    setAppState(AppState.ANALYZING);
    setLogs([]);
    setResult(null);

    // Initial Classification Sequence
    addLog(`INITIALIZING ORCHESTRATOR v3.0...`, 'system');
    addLog(`TARGET ACQUIRED: ${target}`, 'info');
    addLog(`SELECTOR CLASSIFICATION: ${type}`, 'success');

    try {
      // Show progress logs (No fake data)
      await runProgressSequence(type);

      setAppState(AppState.GENERATING);
      addLog('ESTABLISHING SECURE UPLINK TO INTELLIGENCE CORE...', 'system');
      
      // Actual Gemini API Call with Search Grounding
      const data = await generateOsintData(target, type);
      
      addLog('PAYLOAD RECEIVED. DECRYPTING...', 'success');
      setResult(data);
      setAppState(AppState.COMPLETE);
      addLog('OPERATION COMPLETE. DISPLAYING REAL-TIME INTELLIGENCE.', 'success');

    } catch (error) {
      console.error(error);
      addLog('CRITICAL FAILURE: UPLINK TERMINATED.', 'error');
      addLog(error instanceof Error ? error.message : 'Unknown error', 'error');
      setAppState(AppState.ERROR);
    } finally {
        if (appState === AppState.ERROR) {
            setTimeout(() => setAppState(AppState.IDLE), 3000);
        }
    }
  };

  const runProgressSequence = async (type: TargetType) => {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    addLog('PHASE 1: INGESTION COMPLETE.', 'info');
    await delay(600);
    addLog('PHASE 2: REAL-TIME RECONNAISSANCE INITIATED...', 'warning');
    await delay(800);

    const steps = [
        "Initializing public registry scanners...",
        "Querying global search indices...",
        "Analyzing digital footprint patterns...",
        "Cross-referencing available social data...",
        "Synthesizing intelligence dossier..."
    ];
    
    for (const step of steps) {
        addLog(`> EXEC: ${step}`, 'system');
        await delay(Math.random() * 600 + 400);
    }

    addLog('PHASE 3: COMPILING DATA...', 'warning');
    await delay(500);
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-osint-green selection:text-black flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-osint-green" />
                <h1 className="text-xl font-bold font-mono tracking-tighter text-white">
                    OSINT<span className="text-osint-green">ORCHESTRATOR</span>
                </h1>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono text-gray-500">
                <div className="flex items-center gap-2">
                    <Activity className={`w-3 h-3 ${appState === AppState.ANALYZING ? 'text-osint-green animate-pulse' : ''}`} />
                    <span>SYSTEM: {appState === AppState.IDLE ? 'READY' : 'BUSY'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Database className="w-3 h-3" />
                    <span>LIVE CONNECT</span>
                </div>
                <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-osint-green" />
                    <span>OPSEC: ENFORCED</span>
                </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col">
        
        <InputConsole onStart={handleStart} appState={appState} />

        {/* Workspace Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
            {/* Left: Live Terminal Log */}
            <div className="lg:col-span-1 h-full flex flex-col">
                <div className="mb-2 flex items-center justify-between text-xs font-mono text-gray-500 uppercase tracking-widest">
                    <span>Execution Log</span>
                    <span className="text-osint-dim">Live Feed</span>
                </div>
                <TerminalLog logs={logs} />
            </div>

            {/* Right: Results / Visualization */}
            <div className="lg:col-span-2 h-full flex flex-col">
                <div className="mb-2 flex items-center justify-between text-xs font-mono text-gray-500 uppercase tracking-widest">
                    <span>Intelligence Output</span>
                    {appState === AppState.COMPLETE && <span className="text-osint-green">Active</span>}
                </div>
                
                {result ? (
                    <ResultViewer result={result} />
                ) : (
                    <div className="flex-1 bg-gray-900/30 border border-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                        {appState !== AppState.IDLE && (
                           <div className="absolute inset-0 bg-[url('https://assets.codepen.io/13471/sparkle.gif')] opacity-5 mix-blend-screen pointer-events-none"></div>
                        )}
                        <div className="text-center p-8">
                            {appState === AppState.IDLE && (
                                <>
                                    <Shield className="w-16 h-16 text-gray-800 mx-auto mb-4" />
                                    <p className="text-gray-600 font-mono text-sm">AWAITING TARGET INPUT</p>
                                    <p className="text-gray-700 text-xs mt-2 max-w-sm mx-auto">
                                        Enter a selector above to initiate real-time reconnaissance.
                                    </p>
                                </>
                            )}
                            {(appState === AppState.ANALYZING || appState === AppState.GENERATING) && (
                                <>
                                     <div className="w-16 h-16 border-4 border-osint-dim/30 border-t-osint-green rounded-full animate-spin mx-auto mb-6"></div>
                                     <p className="text-osint-green font-mono animate-pulse">
                                        {appState === AppState.ANALYZING ? 'GATHERING INTELLIGENCE...' : 'COMPILING DOSSIER...'}
                                     </p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-black py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-600 text-xs font-mono">
                UNIVERSAL OSINT ORCHESTRATOR // EDUCATIONAL PURPOSES ONLY // DO NOT USE FOR ILLEGAL ACTIVITIES
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;