import React from 'react';

interface ErrorTerminalProps {
  message: string;
}

export const ErrorTerminal: React.FC<ErrorTerminalProps> = ({ message }) => {
  return (
    <div className="bg-[#450A0A] border border-[#DC2626] p-4 flex items-start gap-3 mt-4 animate-pulse">
      <span className="font-mono text-[#FECACA] font-bold shrink-0">[ERROR]</span>
      <span className="font-mono text-[#FECACA] text-sm leading-relaxed tracking-wide">
        {message}
      </span>
    </div>
  );
};