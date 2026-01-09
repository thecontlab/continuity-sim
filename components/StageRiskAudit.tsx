import React, { useState } from 'react';
import { Button } from './Button';
import { RiskInput, RiskCategory } from '../types';
import { RISK_CARDS } from '../constants';
import { ProgressBar } from './ProgressBar';

interface StageRiskAuditProps {
  onComplete: (inputs: RiskInput[]) => void;
}

export const StageRiskAudit: React.FC<StageRiskAuditProps> = ({ onComplete }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [inputs, setInputs] = useState<RiskInput[]>([]);
  
  // Slider states for current card
  const [severity, setSeverity] = useState(5);
  const [latency, setLatency] = useState(5);

  // State for pop-over details
  const [activeDetail, setActiveDetail] = useState<string | null>(null);

  const currentCard = RISK_CARDS[currentCardIndex];

  // Logic 1: Card Border Styling
  const isHighRisk = severity > 7 || latency > 7;
  const cardBorderColor = isHighRisk ? 'border-[#E8830C]' : 'border-[#374151]';
  const shadowColor = isHighRisk ? 'shadow-[0_0_15px_rgba(232,131,12,0.15)]' : 'shadow-2xl';

  // Logic 2: Reactive Slider Labels
  const getRiskMeta = (value: number) => {
    if (value <= 3) return { label: "OPTIMIZED (Low Latency)", color: "text-emerald-400" };
    if (value <= 7) return { label: "STRAINED (Moderate Latency)", color: "text-yellow-500" };
    return { label: "CRITICAL (High Latency)", color: "text-red-500" };
  };

  const severityMeta = getRiskMeta(severity);
  const latencyMeta = getRiskMeta(latency);

  const handleNext = (skipped: boolean) => {
    const newInput: RiskInput = {
      category: currentCard.id,
      severity: skipped ? 7 : severity, // Shadow score logic
      latency: skipped ? 7 : latency,   // Shadow score logic
      skipped
    };

    const newInputs = [...inputs, newInput];
    setInputs(newInputs);
    setActiveDetail(null); // Close any open details

    // Reset sliders for next card
    setSeverity(5);
    setLatency(5);

    if (currentCardIndex < RISK_CARDS.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      onComplete(newInputs);
    }
  };

  const toggleDetail = (id: string) => {
    if (activeDetail === id) {
      setActiveDetail(null);
    } else {
      setActiveDetail(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-4">
      <ProgressBar current={currentCardIndex + 1} total={RISK_CARDS.length} />
      
      <div className="flex justify-between items-end mb-4">
        <span className="text-[#E8830C] font-mono text-xs tracking-widest">
          NODE {currentCardIndex + 1} / {RISK_CARDS.length}
        </span>
        <Button variant="outline" onClick={() => handleNext(true)} className="text-xs py-2 px-3 border-dashed">
          SKIP_NODE
        </Button>
      </div>

      <div className={`bg-[#161B22] border-2 transition-colors duration-500 ease-in-out ${cardBorderColor} ${shadowColor} overflow-hidden`}>
        
        {/* Rich Media Header */}
        <div className="relative h-32 w-full overflow-hidden border-b border-[#374151]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/70 to-transparent z-10" />
          <img 
            src={currentCard.imageUrl} 
            alt={currentCard.title} 
            className="w-full h-full object-cover grayscale opacity-80"
          />
          <div className="absolute bottom-0 left-0 p-6 z-20">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight leading-none">
              {currentCard.title}
            </h2>
            <p className="text-[#9CA3AF] text-[10px] font-mono mt-1 hidden sm:block">
              {currentCard.description}
            </p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Audit Context Block */}
          <div>
             <div className="font-mono text-[10px] text-gray-500 uppercase mb-2 tracking-wider">
               AUDIT PROTOCOL:
             </div>
             <p className="text-xs text-gray-400 font-sans italic pl-3 border-l-2 border-[#E8830C] leading-relaxed">
               "{currentCard.context}"
             </p>
          </div>

          {/* Slider 1: Severity Proxy */}
          <div className="group relative">
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <label className="text-sm font-bold text-[#E8830C] uppercase tracking-wide font-mono flex-1">
                  Input 01: {currentCard.q1}
                </label>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs font-bold ${severityMeta.color} animate-pulse hidden sm:inline-block`}>
                    {severityMeta.label}
                  </span>
                  <span className="font-mono text-white text-xl font-bold bg-[#0B0E14] px-3 py-1 border border-[#374151]">
                    {severity}
                  </span>
                </div>
              </div>

              {/* Question Paragraph + Pop-out Trigger */}
              <div className="flex items-start gap-2">
                <p className="text-sm text-white leading-relaxed font-semibold">
                  {currentCard.q1Question}
                </p>
                <button 
                  onClick={() => toggleDetail('q1')}
                  className="text-[#9CA3AF] hover:text-[#E8830C] transition-colors focus:outline-none"
                  aria-label="More details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </button>
              </div>

              {/* Pop-out Detail */}
              {activeDetail === 'q1' && (
                <div className="mt-3 p-3 bg-[#0B0E14] border border-[#374151] text-xs text-[#9CA3AF] leading-relaxed animate-fade-in">
                  {currentCard.q1Detail}
                </div>
              )}
            </div>

            <div className="relative pt-2">
               <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full h-2 bg-[#0B0E14] rounded-none appearance-none cursor-pointer accent-[#E8830C] border border-[#374151] focus:outline-none"
              />
               <div className="flex justify-between mt-2 text-[10px] font-mono tracking-wider text-[#6B7280]">
                <span>LOW EXPOSURE (1)</span>
                <span>CRITICAL FAILURE (10)</span>
              </div>
            </div>
             {/* Mobile only label */}
             <div className={`sm:hidden mt-2 font-mono text-xs font-bold ${severityMeta.color} text-right`}>
                {severityMeta.label}
             </div>
          </div>

          {/* Slider 2: Latency Proxy */}
          <div className="group border-t border-[#374151] border-dashed pt-8 relative">
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <label className="text-sm font-bold text-[#E8830C] uppercase tracking-wide font-mono flex-1">
                  Input 02: {currentCard.q2}
                </label>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs font-bold ${latencyMeta.color} animate-pulse hidden sm:inline-block`}>
                    {latencyMeta.label}
                  </span>
                  <span className="font-mono text-white text-xl font-bold bg-[#0B0E14] px-3 py-1 border border-[#374151]">
                    {latency}
                  </span>
                </div>
              </div>

              {/* Question Paragraph + Pop-out Trigger */}
              <div className="flex items-start gap-2">
                <p className="text-sm text-white leading-relaxed font-semibold">
                  {currentCard.q2Question}
                </p>
                <button 
                  onClick={() => toggleDetail('q2')}
                  className="text-[#9CA3AF] hover:text-[#E8830C] transition-colors focus:outline-none"
                  aria-label="More details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </button>
              </div>

               {/* Pop-out Detail */}
               {activeDetail === 'q2' && (
                <div className="mt-3 p-3 bg-[#0B0E14] border border-[#374151] text-xs text-[#9CA3AF] leading-relaxed animate-fade-in">
                  {currentCard.q2Detail}
                </div>
              )}
            </div>

            <div className="relative pt-2">
              <input
                type="range"
                min="1"
                max="10"
                value={latency}
                onChange={(e) => setLatency(parseInt(e.target.value))}
                className="w-full h-2 bg-[#0B0E14] rounded-none appearance-none cursor-pointer accent-[#E8830C] border border-[#374151] focus:outline-none"
              />
               <div className="flex justify-between mt-2 text-[10px] font-mono tracking-wider text-[#6B7280]">
                <span>AGILE RECOVERY (1)</span>
                <span>FROZEN (10)</span>
              </div>
            </div>
             {/* Mobile only label */}
             <div className={`sm:hidden mt-2 font-mono text-xs font-bold ${latencyMeta.color} text-right`}>
                {latencyMeta.label}
             </div>
          </div>
        </div>

        <div className="bg-[#0B0E14] p-6 border-t border-[#374151] flex justify-end">
          <Button onClick={() => handleNext(false)} className="min-w-[200px]">
            Confirm & Continue_
          </Button>
        </div>
      </div>
    </div>
  );
};