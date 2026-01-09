import React, { useEffect, useState } from 'react';

export const TerminalLoader: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  
  const SEQUENCE = [
    "INITIALIZING VOLATILITY PROBE...",
    "ESTABLISHING SECURE CONNECTION...",
    "INGESTING REVENUE VECTORS...",
    "TRIANGULATING SECTOR RISK...",
    "ANALYZING LATENCY NODES...",
    "COMPILING HEATMAP ARTIFACTS...",
    "FINALIZING AUDIT PROTOCOLS...",
    "[COMPLETE]"
  ];

  useEffect(() => {
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < SEQUENCE.length) {
        setLines(prev => [...prev, SEQUENCE[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800); // Add a line every 800ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] font-mono text-sm">
      <div className="w-full max-w-md bg-[#0B0E14] border border-[#374151] p-6 shadow-2xl relative overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E8830C]/5 to-transparent animate-scan pointer-events-none" />
        
        <div className="space-y-2">
          {lines.map((line, idx) => (
            <div key={idx} className={`${idx === lines.length - 1 ? 'text-[#E8830C]' : 'text-[#9CA3AF]'}`}>
              <span className="mr-2">{'>'}</span>
              {line}
            </div>
          ))}
          <div className="animate-pulse text-[#E8830C]">_</div>
        </div>
      </div>
      <p className="mt-6 text-[#4B5563] text-xs tracking-[0.2em] uppercase">
        DO NOT CLOSE WINDOW
      </p>
    </div>
  );
};