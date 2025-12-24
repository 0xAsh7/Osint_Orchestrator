import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-64 md:h-full bg-black/80 border border-osint-dim/30 rounded-lg p-4 font-mono text-xs md:text-sm overflow-hidden flex flex-col relative shadow-[0_0_15px_rgba(0,255,65,0.1)]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-osint-green to-transparent opacity-50"></div>
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
            <span className={`
              ${log.type === 'error' ? 'text-red-500' : ''}
              ${log.type === 'warning' ? 'text-yellow-500' : ''}
              ${log.type === 'success' ? 'text-osint-green font-bold' : ''}
              ${log.type === 'info' ? 'text-cyan-400' : ''}
              ${log.type === 'system' ? 'text-gray-400' : ''}
            `}>
              {log.type === 'success' && '>> '}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-2 text-osint-dim animate-pulse">_</div>
    </div>
  );
};