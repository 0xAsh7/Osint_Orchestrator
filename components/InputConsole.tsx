import React, { useState, useEffect } from 'react';
import { Search, Globe, ShieldAlert, Cpu, ChevronDown, Scan } from 'lucide-react';
import { TargetType, AppState } from '../types';

interface InputConsoleProps {
  onStart: (target: string, type: TargetType, additionalInfo: string) => void;
  appState: AppState;
  initialInput?: string;
  initialInfo?: string;
  autoExpand?: boolean;
}

export const InputConsole: React.FC<InputConsoleProps> = ({ 
    onStart, 
    appState, 
    initialInput = '', 
    initialInfo = '',
    autoExpand = false 
}) => {
  const [input, setInput] = useState(initialInput);
  const [additionalInfo, setAdditionalInfo] = useState(initialInfo);
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [detectedType, setDetectedType] = useState<TargetType>(TargetType.UNKNOWN);
  const [hasTyped, setHasTyped] = useState(false);

  useEffect(() => {
    setInput(initialInput);
    if (initialInput) setHasTyped(true);
  }, [initialInput]);

  useEffect(() => {
    setAdditionalInfo(initialInfo);
  }, [initialInfo]);

  useEffect(() => {
    if (autoExpand) setIsExpanded(true);
  }, [autoExpand]);

  useEffect(() => {
    if (input.length > 0) {
        setHasTyped(true);
    } else {
        setHasTyped(false);
    }

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
      onStart(input, detectedType, additionalInfo);
    }
  };

  const isLocked = appState === AppState.ANALYZING || appState === AppState.GENERATING;
  const isIdle = appState === AppState.IDLE;

  // Dynamic Layout Classes
  // IDLE: Centered, max-w-4xl, scaled up slightly on desktop
  // ACTIVE: Full width, no scale, matching the workspace width below
  const containerClasses = isIdle 
    ? 'max-w-4xl scale-100 lg:scale-105' 
    : 'max-w-full scale-100';

  return (
    <div className={`w-full mx-auto transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${containerClasses}`} id="input-console">
      <div className={`bg-osint-black border transition-all duration-500 ${hasTyped ? 'border-osint-green/50 shadow-[0_0_30px_rgba(0,255,65,0.15)]' : 'border-gray-800 shadow-none'} p-0.5 md:p-1 rounded-lg`}>
        <div className="bg-black/90 p-4 md:p-6 lg:p-8 rounded relative overflow-hidden transition-all duration-500">
            {/* Background Grid Decoration */}
            <div className={`absolute inset-0 scan-overlay pointer-events-none transition-opacity duration-1000 ${hasTyped ? 'opacity-30' : 'opacity-10'}`}></div>

            <div className="flex items-center justify-between mb-6 md:mb-8 text-[10px] md:text-xs font-mono text-osint-dim transition-opacity duration-500">
                <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="tracking-widest hidden sm:inline">UNIVERSAL OSINT ORCHESTRATOR v3.5</span>
                    <span className="tracking-widest sm:hidden">OSINT ORCHESTRATOR v3.5</span>
                </div>
                <div className={`flex items-center gap-2 transition-opacity duration-500 ${hasTyped ? 'opacity-100' : 'opacity-0'}`}>
                    <ShieldAlert className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">SECURE UPLINK: READY</span>
                    <span className="sm:hidden">READY</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10">
                <div className="flex flex-col gap-4 md:gap-6">
                    {/* Main Input Area */}
                    <div className="relative group">
                        <div className={`absolute top-1/2 -translate-y-1/2 left-3 md:left-4 transition-all duration-500 ${hasTyped ? 'text-osint-green scale-100' : 'text-gray-600 scale-90'}`}>
                            {hasTyped ? <span className="font-mono text-lg md:text-xl">{'>'}</span> : <Scan className="w-4 h-4 md:w-5 md:h-5" />}
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLocked}
                            className={`
                                w-full bg-gray-900/30 border text-gray-100 font-mono text-base md:text-lg lg:text-xl rounded py-3 md:py-4 pl-10 md:pl-12 pr-20 md:pr-32 
                                focus:outline-none focus:ring-1 transition-all duration-500
                                ${hasTyped ? 'border-gray-700 focus:border-osint-green focus:ring-osint-green' : 'border-transparent focus:border-gray-700 focus:ring-gray-700'}
                                placeholder-gray-700 uppercase tracking-wider
                            `}
                            placeholder="ENTER TARGET..."
                            spellCheck={false}
                        />
                        
                        {/* Detected Type Tag - Animates In */}
                        <div className={`
                            absolute top-1/2 -translate-y-1/2 right-2 md:right-4 pointer-events-none
                            transition-all duration-700 ease-out
                            ${hasTyped && detectedType !== TargetType.UNKNOWN ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                        `}>
                             <span className="px-2 py-0.5 md:px-3 md:py-1 rounded bg-osint-dim/20 text-osint-green border border-osint-dim text-[10px] md:text-xs font-mono tracking-widest shadow-[0_0_10px_rgba(0,255,65,0.2)]">
                                {detectedType}
                            </span>
                        </div>
                    </div>

                    {/* Controls & Context - Collapsible */}
                    <div className={`
                        grid transition-all duration-700 ease-in-out overflow-hidden will-change-transform
                        ${hasTyped ? 'grid-rows-[1fr] opacity-100 mt-0 md:mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}
                    `}>
                        <div className="min-h-0 flex flex-col gap-4">
                            
                            {/* Context Parameters */}
                            <div className="border-t border-gray-800/50 pt-3 md:pt-4 animate-in fade-in slide-in-from-top-4 duration-700 delay-100 fill-mode-backwards">
                                <button 
                                    type="button"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-gray-500 hover:text-osint-green transition-colors mb-2 group w-full md:w-auto"
                                >
                                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                        <ChevronDown className="w-3 h-3" />
                                    </div>
                                    <span className="group-hover:tracking-widest transition-all duration-300">CONTEXT PARAMETERS (OPTIONAL)</span>
                                </button>
                                
                                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <textarea
                                        value={additionalInfo}
                                        onChange={(e) => setAdditionalInfo(e.target.value)}
                                        disabled={isLocked}
                                        placeholder="PROVIDE ADDITIONAL CONTEXT (e.g. 'Software Engineer in London')..."
                                        className="w-full bg-gray-900/30 border border-gray-800 text-gray-300 font-mono text-xs md:text-sm rounded p-3 focus:outline-none focus:border-osint-green/50 focus:ring-1 focus:ring-osint-green/50 transition-all h-20 md:h-24 resize-none placeholder-gray-600 backdrop-blur-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLocked || detectedType === TargetType.UNKNOWN}
                                    className={`
                                        w-full md:w-auto px-6 md:px-10 py-3 rounded font-mono font-bold tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 uppercase text-xs md:text-base
                                        ${isLocked || detectedType === TargetType.UNKNOWN
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                            : 'bg-osint-green text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,255,65,0.6)] transform hover:-translate-y-1'}
                                    `}
                                >
                                    {isLocked ? <Cpu className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Search className="w-4 h-4 md:w-5 md:h-5" />}
                                    {isLocked ? 'EXECUTING' : 'INITIALIZE SCAN'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};