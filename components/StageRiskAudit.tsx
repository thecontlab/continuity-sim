import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { RiskInput, RiskCategory } from '../types';
import { ProgressBar } from './ProgressBar';
import { INDUSTRY_RbBS } from '../constants/scenarios'; 

interface StageRiskAuditProps {
  industry: string;
  onComplete: (inputs: RiskInput[]) => void;
}

const CATEGORIES = [
  RiskCategory.SUPPLY_CHAIN,
  RiskCategory.CASH_FLOW,
  RiskCategory.WORKFORCE,
  RiskCategory.INFRASTRUCTURE_TOOLS,
  RiskCategory.WEATHER_PHYSICAL
];

export const StageRiskAudit: React.FC<StageRiskAuditProps> = ({ industry, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputs, setInputs] = useState<RiskInput[]>([]);
  
  // Local answers for the current card
  const [answer1, setAnswer1] = useState<any>(null);
  const [answer2, setAnswer2] = useState<any>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Resolve Scenario
  const activeScenarioGroup = INDUSTRY_RbBS[industry] || INDUSTRY_RbBS['default'];
  const currentCategory = CATEGORIES[currentIndex];
  const scenario = activeScenarioGroup[currentCategory] || INDUSTRY_RbBS['default'][currentCategory];

  // Reset local state when category changes
  useEffect(() => {
    setAnswer1(null);
    setAnswer2(null);
    setSelectedTags([]);
    
    if (scenario.q1.type === 'slider') setAnswer1(50);
  }, [currentIndex, industry]);

  const handleNext = () => {
    const { severity, latency } = scenario.calculateScore(answer1, answer2);
    
    const newInput: RiskInput = {
      category: currentCategory,
      severity: severity,
      latency: latency, 
      skipped: false
    };

    const newInputs = [...inputs, newInput];
    setInputs(newInputs);

    if (currentIndex < CATEGORIES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(newInputs);
    }
  };

  // --- RENDER HELPERS ---

  const renderQ1Input = () => {
    const { q1 } = scenario;
    
    if (q1.type === 'slider') {
      return (
        <div className="py-4">
           <input
            type="range"
            min="0"
            max="100"
            value={answer1 || 50}
            onChange={(e) => setAnswer1(parseInt(e.target.value))}
            className="w-full h-2 bg-[#1F2937] rounded-lg appearance-none cursor-pointer accent-[#E8830C]"
          />
          <div className="flex justify-between mt-2 text-xs font-mono text-[#9CA3AF]">
            <span>{q1.minLabel || 'Low Impact'}</span>
            <span>{q1.maxLabel || 'Critical'}</span>
          </div>
        </div>
      );
    }

    if (q1.type === 'picker') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {q1.options?.map((opt: string) => (
            <button
              key={opt}
              onClick={() => setAnswer1(opt)}
              className={`p-4 text-sm font-mono border transition-all ${
                answer1 === opt 
                  ? 'bg-[#E8830C] border-[#E8830C] text-white' 
                  : 'bg-[#0B0E14] border-[#374151] text-[#9CA3AF] hover:border-[#E8830C]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderQ2Input = () => {
    const q2 = scenario.q2(answer1);
    if (!q2) return null;

    return (
      <div className="mt-8 animate-fade-in border-t border-[#374151] pt-6">
        <label className="block text-sm font-bold text-white mb-4">
          {/* REMOVED: Step 02 label */}
          {q2.label}
        </label>
        
        {q2.type === 'binary' && (
          <div className="flex gap-4">
             {q2.options?.map((opt: string) => (
               <button
                key={opt}
                onClick={() => setAnswer2(opt)}
                className={`flex-1 py-3 px-6 text-sm font-bold uppercase tracking-wider border transition-all ${
                  answer2 === opt
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-[#9CA3AF] border-[#374151] hover:border-white'
                }`}
               >
                 {opt}
               </button>
             ))}
          </div>
        )}
        
        {q2.type === 'picker' && (
           <div className="grid grid-cols-1 gap-2">
             {q2.options?.map((opt: string) => (
               <button
                 key={opt}
                 onClick={() => setAnswer2(opt)}
                 className={`text-left px-4 py-3 text-sm border ${
                   answer2 === opt 
                     ? 'bg-[#1F2937] border-white text-white' 
                     : 'border-[#374151] text-[#9CA3AF] hover:bg-[#1F2937]'
                 }`}
               >
                 {opt}
               </button>
             ))}
           </div>
        )}
      </div>
    );
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const q2Config = scenario.q2(answer1);
  const isQ1Answered = answer1 !== null;
  const isQ2Answered = !q2Config || answer2 !== null;
  const canProceed = isQ1Answered && isQ2Answered;

  return (
    <div className="max-w-3xl mx-auto pt-8 pb-20">
      <ProgressBar current={currentIndex + 1} total={CATEGORIES.length} />

      <div className="bg-[#161B22] border border-[#374151] p-1 shadow-2xl">
        {/* Dynamic Header */}
        <div className="bg-[#0B0E14] p-6 border-b border-[#374151] flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
              {currentCategory}
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {scenario.contextTags.map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-[10px] font-mono uppercase px-2 py-1 border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-[#E8830C]/20 border-[#E8830C] text-[#E8830C]'
                      : 'border-[#374151] text-[#6B7280] hover:border-[#9CA3AF]'
                  }`}
                >
                  {selectedTags.includes(tag) ? '[x] ' : '[ ] '} {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[#E8830C] font-mono text-xs">
            {industry === 'Construction & Real Estate' ? 'IND: CONST' : 'IND: GENERIC'}
          </div>
        </div>

        {/* Interaction Zone */}
        <div className="p-8 min-h-[300px]">
          {/* Question 1 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-white mb-2">
              {/* REMOVED: Step 01 label */}
              {scenario.q1.label}
            </label>
            {scenario.q1.helperText && (
              <p className="text-xs text-[#9CA3AF] mb-4">{scenario.q1.helperText}</p>
            )}
            {renderQ1Input()}
          </div>

          {/* Question 2 (Reactive) */}
          {answer1 !== null && renderQ2Input()}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0B0E14] border-t border-[#374151] flex justify-end gap-4">
           {/* Skip Button */}
           <button 
             onClick={() => {
                const skipInput = { category: currentCategory, severity: 7, latency: 7, skipped: true };
                setInputs([...inputs, skipInput]);
                if (currentIndex < CATEGORIES.length - 1) setCurrentIndex(p => p + 1);
                else onComplete([...inputs, skipInput]);
             }}
             className="text-xs font-mono text-[#6B7280] hover:text-white px-4"
           >
             SKIP
           </button>

           <Button 
             onClick={handleNext} 
             disabled={!canProceed}
             className={!canProceed ? 'opacity-50 cursor-not-allowed' : ''}
           >
             NEXT &rarr;
           </Button>
        </div>
      </div>
    </div>
  );
};