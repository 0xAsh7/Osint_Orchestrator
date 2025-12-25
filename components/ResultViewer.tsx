import React, { useState, useEffect, useRef } from 'react';
import { OsintResult } from '../types';
import ReactMarkdown from 'react-markdown';
import { FileText, Copy, Check, RefreshCw, Edit, Server, Download, Loader2 } from 'lucide-react';

interface ResultViewerProps {
  result: OsintResult;
  onRetry: () => void;
  onRefine: () => void;
  isStreaming: boolean;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ result, onRetry, onRefine, isStreaming }) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPdf = async () => {
    if (isExporting || !contentRef.current) return;
    setIsExporting(true);

    try {
        // @ts-ignore
        const html2pdf = window.html2pdf;
        if (!html2pdf) throw new Error("PDF Library missing");

        // 1. Get the content HTML
        // We clone the current view to preserve the rendered markdown
        const contentHtml = contentRef.current.innerHTML;

        // 2. Create a temporary container for the PDF generation
        // We make this container visible on screen but cover it with a loading overlay
        const container = document.createElement('div');
        
        // Inline styles to force appearance regardless of Tailwind
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            min-height: 100vh;
            background-color: #0a0a0a;
            z-index: 9998; /* Just below the loader */
            display: flex;
            justify-content: center;
        `;

        // 3. Inject content with specific PDF-friendly styles
        // Set width to 210mm (A4) and padding to 20mm to simulate margins INSIDE the black canvas
        container.innerHTML = `
            <div id="pdf-content-root" style="width: 210mm; min-height: 297mm; background-color: #0a0a0a; padding: 20mm; color: #e0e0e0; box-sizing: border-box;">
                <div style="border-bottom: 2px solid #00ff41; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #00ff41 !important; font-size: 24px; margin: 0; font-family: 'Courier New', Courier, monospace; text-transform: uppercase;">OSINT DOSSIER</h1>
                    <p style="color: #008F11 !important; font-size: 12px; margin: 5px 0 0 0; font-family: 'Courier New', Courier, monospace;">CONFIDENTIAL // ${new Date().toISOString().split('T')[0]}</p>
                </div>
                
                <div class="pdf-body">
                    ${contentHtml}
                </div>
            </div>

            <style>
                /* Force High Contrast for PDF */
                #pdf-content-root {
                    font-family: 'Courier New', Courier, monospace !important;
                    background-color: #0a0a0a !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .pdf-body {
                    font-size: 12px;
                    line-height: 1.5;
                    color: #e0e0e0 !important;
                }

                .pdf-body h1, .pdf-body h2, .pdf-body h3 { 
                    color: #00ff41 !important; 
                    margin-top: 25px; 
                    margin-bottom: 10px; 
                    border-bottom: 1px solid #333; 
                    font-weight: bold;
                    page-break-after: avoid;
                    text-transform: uppercase;
                }
                
                .pdf-body p { 
                    color: #ccc !important; 
                    margin-bottom: 10px; 
                }
                
                .pdf-body strong { 
                    color: #fff !important; 
                    font-weight: bold;
                }
                
                .pdf-body a { 
                    color: #00ff41 !important; 
                    text-decoration: underline; 
                }
                
                .pdf-body ul, .pdf-body ol { 
                    padding-left: 20px; 
                    color: #ccc !important; 
                    margin-bottom: 10px;
                }
                
                .pdf-body li { 
                    margin-bottom: 4px; 
                }
                
                .pdf-body code { 
                    background-color: #111 !important; 
                    color: #00ff41 !important; 
                    padding: 2px 4px; 
                    border: 1px solid #333;
                    border-radius: 3px;
                    font-family: 'Courier New', Courier, monospace; 
                }
                
                .pdf-body pre { 
                    background-color: #050505 !important; 
                    padding: 15px; 
                    border: 1px solid #333; 
                    color: #00ff41 !important; 
                    overflow-x: hidden;
                    white-space: pre-wrap;
                    margin: 15px 0;
                    border-radius: 4px;
                }

                .pdf-body blockquote {
                    border-left: 3px solid #008F11;
                    padding-left: 15px;
                    margin: 10px 0;
                    color: #888 !important;
                    font-style: italic;
                }
                
                /* Hide any screen-only elements that might have been cloned */
                .pdf-body .screen-only {
                    display: none !important;
                }
            </style>
        `;

        document.body.appendChild(container);

        // 4. Wait for images/fonts (brief delay)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 5. Generate PDF
        const opt = {
            margin: 0, // Set margin to 0 to eliminate white borders
            filename: `OSINT_REPORT_${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#0a0a0a', 
                windowWidth: 1024,
                scrollY: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const element = container.querySelector('#pdf-content-root');
        await html2pdf().set(opt).from(element).save();

        // 6. Cleanup
        document.body.removeChild(container);

    } catch (error) {
        console.error("Export failed:", error);
    } finally {
        setIsExporting(false);
    }
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
    <>
        {/* Full Screen Loader Overlay for PDF Export */}
        {isExporting && (
            <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
                <Loader2 className="w-12 h-12 text-osint-green animate-spin mb-4" />
                <h3 className="text-osint-green font-mono text-lg tracking-widest animate-pulse">ENCRYPTING DOSSIER...</h3>
                <p className="text-gray-500 font-mono text-xs mt-2">Generating PDF Binary</p>
            </div>
        )}

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
                        
                        <button 
                            onClick={handleDownloadPdf}
                            disabled={isExporting}
                            className="flex items-center gap-1 text-[10px] md:text-xs font-mono text-osint-green hover:text-white transition-colors uppercase border border-osint-green/30 hover:border-osint-green px-2 py-1 rounded bg-osint-green/10 hover:bg-osint-green/20"
                            title="Download PDF"
                        >
                            <Download className="w-3 h-3" />
                            <span className="hidden sm:inline">PDF</span>
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
                    <div ref={contentRef} className="prose prose-invert prose-xs md:prose-sm max-w-none font-mono min-h-full animate-blur-in p-2">
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
                            .prose hr { border-color: #003300; border-top-width: 1px; border-style: dashed; margin-top: 2rem; margin-bottom: 2rem; opacity: 0.5; }
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
    </>
  );
};