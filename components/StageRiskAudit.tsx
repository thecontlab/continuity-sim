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
  
  const [answer1, setAnswer1] = useState<any>(null);
  const [answer2, setAnswer2] = useState<any>(null); 
  const [isCustomInput, setIsCustomInput] = useState(false);
  
  // Tooltip State
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const activeScenarioGroup = INDUSTRY_RbBS[industry] || INDUSTRY_RbBS['default'];
  const currentCategory = CATEGORIES[currentIndex];
  const scenario = activeScenarioGroup[currentCategory] || INDUSTRY_RbBS['default'][currentCategory];

  useEffect(() => {
    setAnswer1(null);
    setAnswer2(null);
    setIsCustomInput(false);
    setActiveTooltip(null); 
    
    // Default to null to force a user selection
  }, [currentIndex, industry]);

  const handleNext = () => {
    const { severity, latency } = scenario.calculateScore(answer1, answer2);
    const q2Config = scenario.q2(answer1);
    
    const newInput: RiskInput = {
      category: currentCategory,
      severity: severity,
      latency: latency, 
      skipped: false,
      metadata: {
        question1_label: scenario.q1.label,
        answer1_value: answer1,
        question2_label: q2Config ? q2Config.label : 'N/A',
        answer2_value: answer2,
        selected_tags: [] // Tags removed from UI
      }
    };

    const newInputs = [...inputs, newInput];
    setInputs(newInputs);

    if (currentIndex < CATEGORIES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(newInputs);
    }
  };

  const TooltipButton = ({ text }: { text?: string }) => {
    if (!text) return null;
    return (
      <button
        onClick={() => setActiveTooltip(activeTooltip === text ? null : text)}
        className={`ml-2 w-5 h-5 rounded-full border text-xs font-mono transition-colors inline-flex items-center justify-center ${
          activeTooltip === text 
            ? 'border-[#E8830C] text-[#E8830C] bg-[#E8830C]/10' 
            : 'border-[#9CA3AF] text-[#9CA3AF] hover:border-[#E8830C] hover:text-[#E8830C]'
        }`}
      >
        ?
      </button>
    );
  };

  const renderQ1Input = () => {
    const { q1 } = scenario;
    
    if (q1.type === 'slider') {
      const segments = [10, 30, 50, 70, 90];
      
      return (
        <div className="py-2">
          <div className="flex justify-between text-[10px] font-mono uppercase text-[#9CA3AF] mb-3 tracking-wider">
            <span>{q1.minLabel || 'Low'}</span>
            <span>{q1.maxLabel || 'High'}</span>
          </div>

          <div className="grid grid-cols-5 gap-2 h-14">
            {segments.map((val, idx) => {
              const isSelected = answer1 === val;
              return (
                <button
                  key={val}
                  onClick={() => setAnswer1(val)}
                  className={`
                    relative group border transition-all duration-200 
                    flex flex-col items-center justify-center
                    ${isSelected 
                      ? 'bg-[#E8830C] border-[#E8830C] text-white shadow-[0_0_15px_rgba(232,131,12,0.4)]' 
                      : 'bg-[#0B0E14] border-[#374151] text-[#6B7280] hover:border-[#9CA3AF] hover:bg-[#1F2937]'
                    }
                  `}
                >
                  <div className={`w-1 h-1 rounded-full mb-1 transition-colors ${isSelected ? 'bg-white' : 'bg-[#374151] group-hover:bg-[#9CA3AF]'}`} />
                  <span className="text-[10px] font-mono opacity-80">{idx + 1}</span>
                </button>
              );
            })}
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
        <div className="flex items-center mb-2">
          <label className="block text-sm font-bold text-white">
            {q2.label}
          </label>
          <TooltipButton text={q2.tooltip} />
        </div>

        {activeTooltip === q2.tooltip && q2.tooltip && (
           <div className="mb-4 p-3 bg-[#161B22] border-l-2 border-[#E8830C] text-xs text-[#9CA3AF] italic animate-fade-in">
            <span className="font-bold text-[#E8830C] not-italic mr-2">HELP:</span>
            {q2.tooltip}
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 mb-4">
           {q2.options?.map((opt: string) => (
             <button
              key={opt}
              onClick={() => {
                setAnswer2(opt);
                setIsCustomInput(false);
              }}
              className={`py-2 px-4 text-xs font-mono border rounded-full transition-all ${
                answer2 === opt && !isCustomInput
                  ? 'bg-[#E8830C] border-[#E8830C] text-white'
                  : 'bg-[#1F2937] border-[#374151] text-[#9CA3AF] hover:border-white'
              }`}
             >
               {opt}
             </button>
           ))}
           
           <button
             onClick={() => {
               setAnswer2('');
               setIsCustomInput(true);
             }}
             className={`py-2 px-4 text-xs font-mono border rounded-full transition-all ${
                isCustomInput
                  ? 'bg-white border-white text-black'
                  : 'bg-transparent border-[#374151] text-[#6B7280] hover:text-white'
             }`}
           >
             Other / Custom...
           </button>
        </div>

        {isCustomInput && (
          <div className="animate-fade-in">
            <input 
              type="text"
              autoFocus
              placeholder="Describe your specific situation..."
              value={answer2 || ''}
              onChange={(e) => setAnswer2(e.target.value)}
              className="w-full bg-[#0B0E14] border-b-2 border-[#E8830C] text-white p-3 focus:outline-none font-mono text-sm"
            />
          </div>
        )}
      </div>
    );
  };

  const q2Config = scenario.q2(answer1);
  const isQ1Answered = answer1 !== null;
  const isQ2Answered = !q2Config || (answer2 !== null && answer2 !== ''); 
  const canProceed = isQ1Answered && isQ2Answered;

  return (
    <div className="max-w-3xl mx-auto pt-8 pb-20">
      
      <ProgressBar current={currentIndex + 1} total={CATEGORIES.length} />

      <div className="bg-[#161B22] border border-[#374151] p-1 shadow-2xl">
        <div className="bg-[#0B0E14] p-6 border-b border-[#374151] flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
              {currentCategory}
            </h2>
            {/* TAGS REMOVED FROM HERE */}
          </div>
          <div className="text-[#E8830C] font-mono text-xs">
            IND: {industry.length > 15 ? industry.substring(0, 12).toUpperCase() + '...' : industry.toUpperCase()}
          </div>
        </div>

        <div className="p-8 min-h-[300px]">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <label className="block text-sm font-bold text-white">
                {scenario.q1.label}
              </label>
              <TooltipButton text={scenario.q1.tooltip} />
            </div>

            {activeTooltip === scenario.q1.tooltip && scenario.q1.tooltip && (
               <div className="mb-4 p-3 bg-[#161B22] border-l-2 border-[#E8830C] text-xs text-[#9CA3AF] italic animate-fade-in">
                <span className="font-bold text-[#E8830C] not-italic mr-2">HELP:</span>
                {scenario.q1.tooltip}
              </div>
            )}

            {scenario.q1.helperText && (
              <p className="text-xs text-[#9CA3AF] mb-4">{scenario.q1.helperText}</p>
            )}
            {renderQ1Input()}
          </div>

          {answer1 !== null && renderQ2Input()}
        </div>

        <div className="p-4 bg-[#0B0E14] border-t border-[#374151] flex justify-end gap-4">
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