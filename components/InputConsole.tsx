import React, { useState, useEffect } from 'react';
import { Search, Globe, ShieldAlert, Cpu } from 'lucide-react';
import { TargetType, AppState } from '../types';

interface InputConsoleProps {
  onStart: (target: string, type: TargetType) => void;
  appState: AppState;
}

export const InputConsole: React.FC<InputConsoleProps> = ({ onStart, appState }) => {
  const [input, setInput] = useState('');
  const [detectedType, setDetectedType] = useState<TargetType>(TargetType.UNKNOWN);

  useEffect(() => {
    const detect = (val: string) => {
      if (!val) return TargetType.UNKNOWN;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[0-9\s\-\(\)]{7,}$/;
      const usernameRegex = /^@[a-zA-Z0-9_]+$/;
      
      if (emailRegex.test(val)) return TargetType.EMAIL;
      if (phoneRegex.test(val)) return TargetType.PHONE;
      if (usernameRegex.test(val)) return TargetType.USERNAME;
      if (val.length > 3) return TargetType.NAME; // Fallback
      return TargetType.UNKNOWN;
    };
    setDetectedType(detect(input));
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input && detectedType !== TargetType.UNKNOWN && !isLocked) {
      onStart(input, detectedType);
    }
  };

  // Only lock during active processing
  const isLocked = appState === AppState.ANALYZING || appState === AppState.GENERATING;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-osint-black border border-osint-green/30 p-1 rounded-lg shadow-[0_0_20px_rgba(0,255,65,0.15)]">
        <div className="bg-black/90 p-6 rounded relative overflow-hidden">
            {/* Background Grid Decoration */}
            <div className="absolute inset-0 scan-overlay opacity-30 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 text-xs font-mono text-osint-dim">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>UNIVERSAL OSINT ORCHESTRATOR v3.0</span>
                </div>
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span>SECURE CONNECTION: ACTIVE</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10">
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                             <span className="text-osint-green font-mono text-lg">{'>'}</span>
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLocked}
                            className="w-full bg-gray-900/50 border border-gray-700 text-gray-100 font-mono text-lg rounded py-3 pl-10 pr-4 focus:outline-none focus:border-osint-green focus:ring-1 focus:ring-osint-green transition-all placeholder-gray-600 uppercase tracking-wider"
                            placeholder="ENTER TARGET (PHONE, EMAIL, USERNAME, NAME)"
                            spellCheck={false}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLocked || detectedType === TargetType.UNKNOWN}
                        className={`
                            px-8 py-3 rounded font-mono font-bold tracking-widest transition-all flex items-center justify-center gap-2
                            ${isLocked || detectedType === TargetType.UNKNOWN
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : 'bg-osint-green text-black hover:bg-white hover:shadow-[0_0_15px_rgba(0,255,65,0.8)]'}
                        `}
                    >
                        {isLocked ? <Cpu className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        {isLocked ? 'EXECUTING' : 'INITIALIZE'}
                    </button>
                </div>
            </form>

            <div className="mt-4 flex items-center gap-4 text-xs font-mono h-6">
                <span className="text-gray-500">DETECTED SELECTOR:</span>
                <span className={`px-2 py-0.5 rounded ${detectedType !== TargetType.UNKNOWN ? 'bg-osint-dim/20 text-osint-green border border-osint-dim' : 'text-gray-600'}`}>
                    {detectedType}
                </span>
                
                {detectedType === TargetType.PHONE && <span className="text-cyan-600 ml-auto">MODULES: PhoneInfoga, HLR Lookup</span>}
                {detectedType === TargetType.EMAIL && <span className="text-cyan-600 ml-auto">MODULES: HIBP, Holehe, Hunter</span>}
                {detectedType === TargetType.USERNAME && <span className="text-cyan-600 ml-auto">MODULES: Maigret, Sherlock</span>}
            </div>
        </div>
      </div>
    </div>
  );
};