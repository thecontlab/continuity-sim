import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-8 border-b border-[#1F2937] flex justify-between items-center bg-[#0B0E14] sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-[#E8830C] rounded-sm animate-pulse" />
        <h1 className="text-sm font-mono tracking-[0.2em] uppercase text-white">
          The Continuity Advisor
        </h1>
      </div>
      <div className="text-xs font-mono text-[#9CA3AF]">
        SECURE CONNECTION_
      </div>
    </header>
  );
};