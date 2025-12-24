import React, { useState, useEffect, useRef } from 'react';
import { OsintResult } from '../types';
import ReactMarkdown from 'react-markdown';
import { FileText, Copy, Check, RefreshCw, Edit, Server } from 'lucide-react';

interface ResultViewerProps {
  result: OsintResult;
  onRetry: () => void;
  onRefine: () => void;
  isStreaming: boolean;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ result, onRetry, onRefine, isStreaming }) => {
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result.reportMarkdown, isStreaming]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cleaning function to strip code blocks if the model hallucinates them
  const cleanMarkdown = (text: string) => {
    if (!text) return '';
    return text
        .replace(/^```markdown\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/```\s*$/, '');
  };

  const isThinking = isStreaming && !result.reportMarkdown;

  return (
    <div className="w-full h-full flex flex-col bg-osint-black border border-osint-green/30 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,65,0.05)] relative group animate-blur-in origin-center">
      {/* Decorative Border Lines */}
      <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-t-2 border-l-2 border-osint-green z-20 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-b-2 border-r-2 border-osint-green z-20 pointer-events-none"></div>

      {/* Tab Header */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 bg-black/60 backdrop-blur-md z-10 p-2 items-center shrink-0">
        <div
          className="flex items-center gap-2 px-2 md:px-4 py-1.5 md:py-2 font-mono text-[10px] md:text-sm tracking-wider transition-all bg-osint-green/10 text-osint-green border-r border-osint-green/30"
        >
          <FileText className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">INTELLIGENCE_DOSSIER</span>
          <span className="sm:hidden">DOSSIER</span>
          {isStreaming && <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-osint-green rounded-full animate-pulse ml-2"></span>}
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-3 pr-2">
            {!isStreaming && (
                <>
                    <button 
                        onClick={onRetry}
                        className="flex items-center gap-1 text-[10px] md:text-xs font-mono text-gray-400 hover:text-white transition-colors uppercase border border-gray-800 hover:border-gray-600 px-2 py-1 rounded bg-gray-900"
                        title="Retry"
                    >
                        <RefreshCw className="w-3 h-3" />
                        <span className="hidden sm:inline">RETRY</span>
                    </button>
                    <button 
                        onClick={onRefine}
                        className="flex items-center gap-1 text-[10px] md:text-xs font-mono text-gray-400 hover:text-osint-green transition-colors uppercase border border-gray-800 hover:border-osint-green/50 px-2 py-1 rounded bg-gray-900"
                        title="Refine"
                    >
                        <Edit className="w-3 h-3" />
                        <span className="hidden sm:inline">REFINE</span>
                    </button>
                    <div className="h-4 w-[1px] bg-gray-800 mx-1"></div>
                </>
            )}

            <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-osint-dim hover:text-osint-green transition-colors uppercase tracking-widest"
            >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span className="hidden sm:inline">{copied ? 'COPIED' : 'COPY'}</span>
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-[#050505] p-4 md:p-6 custom-scrollbar relative gpu-accelerated">
        {/* Subtle Scanline Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-50"></div>
        
        <div className="relative z-10 h-full">
            {isThinking ? (
                 <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-90">
                    <div className="flex items-center gap-3 text-osint-green font-mono text-xs md:text-sm animate-flicker">
                        <Server className="w-4 h-4 md:w-5 md:h-5" />
                        <span>ESTABLISHING SECURE CONNECTION...</span>
                    </div>
                    
                    {/* OPTIMIZED PROGRESS BAR */}
                    {/* Using scaleX for GPU acceleration instead of width animation */}
                    <div className="w-48 md:w-72 h-1 bg-gray-900 rounded-full overflow-hidden border border-gray-800 relative">
                        <div className="absolute inset-0 bg-osint-green origin-left animate-progress-scale will-change-transform"></div>
                    </div>

                    <div className="font-mono text-[10px] md:text-xs text-gray-500 space-y-2 text-center">
                         <p className="animate-pulse">Grounding with Google Search...</p>
                         <p className="delay-[15000ms] animate-in fade-in fill-mode-backwards duration-1000">Processing Search Metadata...</p>
                         <p className="delay-[35000ms] animate-in fade-in fill-mode-backwards duration-1000">Synthesizing Dossier...</p>
                    </div>
                 </div>
            ) : (
                <div className="prose prose-invert prose-xs md:prose-sm max-w-none font-mono min-h-full animate-blur-in">
                    {/* Custom Styling via Tailwind Typography classes */}
                    <style>{`
                        .prose h1, .prose h2, .prose h3 { color: #00ff41; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #003300; padding-bottom: 0.5rem; }
                        .prose strong { color: #fff; }
                        .prose a { color: #008F11; text-decoration: none; border-bottom: 1px dotted #008F11; }
                        .prose a:hover { background-color: #003300; color: #00ff41; }
                        .prose ul { list-style-type: square; marker: #00ff41; }
                        .prose blockquote { border-left-color: #00ff41; background: #001100; font-style: normal; padding: 0.5rem 1rem; }
                        .prose code { color: #00ff41; background: #002200; padding: 0.1em 0.3em; border-radius: 2px; }
                        .prose p { margin-bottom: 0.75rem; color: #a0a0a0; }
                    `}</style>
                    <div className="mb-4 md:mb-6 pb-2 border-b border-osint-green/20 flex flex-col md:flex-row md:justify-between md:items-end gap-1">
                        <span className="text-osint-dim text-[10px] md:text-xs">CLASSIFICATION: UNRESTRICTED // OPEN SOURCE</span>
                        <span className="text-osint-dim text-[10px] md:text-xs">SOURCE: LIVE SEARCH</span>
                    </div>
                    {/* Sanitize Markdown Input */}
                    <ReactMarkdown>{cleanMarkdown(result.reportMarkdown)}</ReactMarkdown>
                    {isStreaming && (
                        <span className="inline-block w-1.5 h-3 md:w-2 md:h-4 bg-osint-green animate-pulse ml-1 align-middle"></span>
                    )}
                    <div ref={bottomRef} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};