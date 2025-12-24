import React, { useState } from 'react';
import { Key, X, ExternalLink, ShieldAlert, Save, Loader2, CheckCircle2, Server } from 'lucide-react';
import { checkModelAvailability } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, shouldSave: boolean, modelId: string) => void;
  initialValue?: string;
  isErrorMode?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, initialValue = '', isErrorMode = false }) => {
  const [key, setKey] = useState(initialValue);
  const [shouldSave, setShouldSave] = useState(false);
  
  // Validation State
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [detectedModel, setDetectedModel] = useState<string | null>(null);

  const handleValidation = async () => {
    if (!key) return;

    setIsValidating(true);
    setValidationError(null);
    setDetectedModel(null);

    try {
        const modelId = await checkModelAvailability(key);
        setDetectedModel(modelId);
        
        // Slight delay to show the success state before auto-saving/closing
        setTimeout(() => {
            onSave(key, shouldSave, modelId);
        }, 1500);

    } catch (err: any) {
        setValidationError(err.message || "Failed to validate API Key");
        setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-blur-in">
      <div className="w-full max-w-md bg-osint-black border border-osint-green rounded-lg shadow-[0_0_50px_rgba(0,255,65,0.2)] relative overflow-hidden">
        {/* Scan line effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-osint-green to-transparent opacity-50 animate-scan-line"></div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2 text-osint-green font-mono font-bold text-lg">
                <Key className="w-5 h-5" />
                <span>API CONFIGURATION</span>
             </div>
             {/* Always allow closing, even during validation, to prevent getting stuck */}
             <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
             </button>
          </div>

          {isErrorMode && !validationError && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded flex gap-3 items-start animate-pulse">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-red-500 font-bold font-mono text-sm mb-1">CONNECTION FAILURE</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                        The default system uplink is overloaded or unresponsive. You must manually override with your own Neural Uplink (API Key).
                    </p>
                </div>
            </div>
          )}

          {validationError && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded flex gap-3 items-start">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="w-full">
                    <h4 className="text-red-500 font-bold font-mono text-sm mb-1">VALIDATION FAILED</h4>
                    <p className="text-gray-400 text-xs leading-relaxed break-words whitespace-pre-wrap">
                        {validationError}
                    </p>
                </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
                <label className="block text-xs font-mono text-osint-dim mb-2 uppercase tracking-wider">
                    Google Gemini API Key
                </label>
                <input 
                    type="password" 
                    value={key}
                    onChange={(e) => {
                        setKey(e.target.value);
                        setValidationError(null); // Clear error on typing
                    }}
                    disabled={isValidating}
                    placeholder="AIzaSy..."
                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white font-mono text-sm focus:border-osint-green focus:outline-none focus:ring-1 focus:ring-osint-green transition-all placeholder-gray-600 disabled:opacity-50"
                />
            </div>

            <div className="bg-gray-900/50 rounded p-4 border border-gray-800">
                <h4 className="text-gray-300 font-mono text-xs font-bold mb-2">HOW TO GENERATE A KEY:</h4>
                <ol className="text-gray-500 text-xs space-y-2 list-decimal list-inside font-mono">
                    <li>Access the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-osint-dim hover:text-osint-green underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3"/></a> console.</li>
                    <li>Sign in with your Google Account.</li>
                    <li>Click <strong>"Create API Key"</strong>.</li>
                    <li>Copy the string starting with <code>AIza</code> and paste it above.</li>
                </ol>
            </div>

            {/* Persistence Option */}
            <div className="flex items-center gap-3 pt-2">
                <div className="relative flex items-center">
                    <input 
                        type="checkbox" 
                        id="save-key" 
                        checked={shouldSave}
                        onChange={(e) => setShouldSave(e.target.checked)}
                        disabled={isValidating}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-600 bg-gray-900 transition-all checked:border-osint-green checked:bg-osint-green hover:border-gray-400"
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100">
                        <CheckIcon />
                    </div>
                </div>
                <label htmlFor="save-key" className="cursor-pointer select-none text-xs font-mono text-gray-400 hover:text-gray-300">
                    Save Key to Browser Storage (Cookies)
                </label>
            </div>

            <button 
                onClick={handleValidation}
                disabled={!key || isValidating}
                className={`
                    w-full font-mono font-bold py-3 rounded transition-all uppercase tracking-widest mt-2 flex items-center justify-center gap-2
                    ${key && !isValidating
                        ? 'bg-osint-green text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,255,65,0.6)]' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                `}
            >
                {isValidating ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        CHECKING AVAILABILITY...
                    </>
                ) : detectedModel ? (
                    <>
                        <CheckCircle2 className="w-4 h-4" />
                        UPLINK SECURE ({detectedModel.replace('gemini-', '')})
                    </>
                ) : (
                    <>
                         {shouldSave ? <Save className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                         {key ? 'ESTABLISH UPLINK' : 'ENTER KEY'}
                    </>
                )}
            </button>
            
            {detectedModel && (
                 <div className="text-center text-[10px] font-mono text-osint-green animate-pulse">
                    <div className="flex items-center justify-center gap-1">
                        <Server className="w-3 h-3" />
                        <span>OPTIMIZED ROUTE: {detectedModel.toUpperCase()}</span>
                    </div>
                 </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-3 w-3"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);