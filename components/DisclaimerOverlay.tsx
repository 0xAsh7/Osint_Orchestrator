import React from 'react';
import { AlertTriangle, ShieldCheck, Scale, FileWarning, Eye } from 'lucide-react';

interface DisclaimerOverlayProps {
  onAcknowledge: () => void;
}

export const DisclaimerOverlay: React.FC<DisclaimerOverlayProps> = ({ onAcknowledge }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-osint-black/95 backdrop-blur-md animate-blur-in border border-osint-green/30 rounded-lg">
        {/* Header - Compact */}
        <div className="py-3 px-4 border-b border-osint-green/20 bg-black/40 text-center shrink-0">
            <h3 className="text-osint-green font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] animate-pulse">Compliance Check</h3>
            <h2 className="text-base md:text-lg font-bold text-white font-mono tracking-tighter">OPERATIONAL PROTOCOLS</h2>
        </div>

        {/* Content - Centered and Constrained */}
        <div className="flex-1 flex flex-col justify-center p-3 md:p-6 gap-2 md:gap-4 overflow-hidden w-full max-w-3xl mx-auto">
             {/* Point 1 */}
            <div className="flex gap-3 items-start group/item p-2 hover:bg-white/5 rounded transition-colors">
                <div className="mt-0.5 text-osint-green shrink-0">
                    <Scale className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                    <h4 className="text-white font-mono text-xs md:text-sm font-bold leading-tight">LEGAL & ETHICAL COMPLIANCE</h4>
                    <p className="text-gray-400 text-[10px] md:text-xs leading-tight md:leading-relaxed font-mono mt-0.5">
                        System aggregates <strong className="text-gray-300">public open source data (OSINT)</strong> only. No private access or exploits. Operations adhere to privacy laws (GDPR/CCPA).
                    </p>
                </div>
            </div>

             {/* Point 2 */}
            <div className="flex gap-3 items-start group/item p-2 hover:bg-white/5 rounded transition-colors">
                <div className="mt-0.5 text-yellow-500 shrink-0">
                    <FileWarning className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                    <h4 className="text-white font-mono text-xs md:text-sm font-bold leading-tight">NON-DETERMINISTIC OUTPUT</h4>
                    <p className="text-gray-400 text-[10px] md:text-xs leading-tight md:leading-relaxed font-mono mt-0.5">
                        AI synthesis may produce <strong className="text-yellow-500">hallucinations</strong>. This is a <span className="underline decoration-dotted">lead generation tool</span>, not confirmed evidence. Verify all data.
                    </p>
                </div>
            </div>

            {/* Point 3 */}
            <div className="flex gap-3 items-start group/item p-2 hover:bg-white/5 rounded transition-colors">
                <div className="mt-0.5 text-blue-400 shrink-0">
                    <Eye className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                    <h4 className="text-white font-mono text-xs md:text-sm font-bold leading-tight">IDENTITY RESOLUTION</h4>
                    <p className="text-gray-400 text-[10px] md:text-xs leading-tight md:leading-relaxed font-mono mt-0.5">
                        Common names create amalgamated profiles. Analyst must verify attribution via unique selectors (Location, Employer).
                    </p>
                </div>
            </div>

            {/* Point 4 */}
            <div className="flex gap-3 items-start group/item p-2 hover:bg-white/5 rounded transition-colors">
                <div className="mt-0.5 text-osint-alert shrink-0">
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                    <h4 className="text-white font-mono text-xs md:text-sm font-bold leading-tight">RESTRICTED USE</h4>
                    <p className="text-gray-400 text-[10px] md:text-xs leading-tight md:leading-relaxed font-mono mt-0.5">
                        For <strong className="text-white">Educational & Research Only</strong>. Malicious use (doxxing/stalking) is prohibited.
                    </p>
                </div>
            </div>
        </div>

        {/* Footer - Compact */}
        <div className="p-3 md:p-4 border-t border-osint-green/20 bg-black/40 shrink-0 pb-safe">
            <button 
                onClick={onAcknowledge}
                className="w-full max-w-xl mx-auto bg-white text-black font-mono font-bold py-2.5 md:py-3 rounded hover:bg-osint-green hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all uppercase tracking-widest flex items-center justify-center gap-2 text-[10px] md:text-xs group"
            >
                <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>I ACKNOWLEDGE THE RISKS</span>
            </button>
        </div>
    </div>
  );
};