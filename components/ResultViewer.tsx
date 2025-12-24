import React, { useState } from 'react';
import { OsintResult } from '../types';
import ReactMarkdown from 'react-markdown';
import { FileText, Copy, Check } from 'lucide-react';

interface ResultViewerProps {
  result: OsintResult;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-osint-black border border-osint-green/30 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,65,0.05)] relative group">
      {/* Decorative Border Lines */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-osint-green z-20"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-osint-green z-20"></div>

      {/* Tab Header */}
      <div className="flex border-b border-gray-800 bg-black/60 backdrop-blur-sm z-10">
        <div
          className="flex items-center gap-2 px-6 py-4 font-mono text-xs md:text-sm tracking-wider transition-all bg-osint-green/10 text-osint-green border-r border-osint-green/30"
        >
          <FileText className="w-4 h-4" />
          INTELLIGENCE_DOSSIER
        </div>
        <div className="ml-auto flex items-center pr-4">
            <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs font-mono text-osint-dim hover:text-osint-green transition-colors uppercase tracking-widest"
            >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'BUFFER_COPIED' : 'COPY_BUFFER'}
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-[#050505] p-6 custom-scrollbar relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
        
        <div className="relative z-10">
            <div className="prose prose-invert prose-sm md:prose-base max-w-none font-mono">
                {/* Custom Styling via Tailwind Typography classes didn't cover everything, so using custom classes for markdown elements */}
                <style>{`
                    .prose h1, .prose h2, .prose h3 { color: #00ff41; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #003300; padding-bottom: 0.5rem; }
                    .prose strong { color: #fff; }
                    .prose a { color: #008F11; text-decoration: none; border-bottom: 1px dotted #008F11; }
                    .prose a:hover { background-color: #003300; color: #00ff41; }
                    .prose ul { list-style-type: square; marker: #00ff41; }
                    .prose blockquote { border-left-color: #00ff41; background: #001100; font-style: normal; padding: 0.5rem 1rem; }
                    .prose code { color: #00ff41; background: #002200; padding: 0.1em 0.3em; border-radius: 2px; }
                    .prose p { margin-bottom: 1rem; color: #a0a0a0; }
                `}</style>
                <div className="mb-6 pb-2 border-b border-osint-green/20 flex justify-between items-end">
                    <span className="text-osint-dim text-xs">CLASSIFICATION: UNRESTRICTED // OPEN SOURCE</span>
                    <span className="text-osint-dim text-xs">SOURCE: LIVE SEARCH</span>
                </div>
                <ReactMarkdown>{result.reportMarkdown}</ReactMarkdown>
            </div>
        </div>
      </div>
    </div>
  );
};