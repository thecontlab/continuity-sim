import React, { useState } from 'react';
import { Button } from './Button';
import { ErrorTerminal } from './ErrorTerminal';
import { FoundationData } from '../types';
import { INDUSTRIES } from '../constants';

interface StageFoundationProps {
  onComplete: (data: FoundationData) => void;
}

// Custom Icon Components
const Icons = {
  Construction: (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="32" 
      height="32" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="mb-2 text-current"
    >
      <path d="M4 22V6a2 2 0 0 1 2-2h5" />
      <path d="M14 22V14h-3v8" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
      <path d="M8 18h.01" />
      <path d="M17 22V2" />
      <path d="M11 2h8" />
      <path d="M19 2l3 3-3 3" /> 
      <path d="M13 2v4" />
      <path d="M13 6l-1 1" />
    </svg>
  ),
  SkilledTrades: (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="32" 
      height="32" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="mb-2 text-current"
    >
      <path d="M8 3v18" />
      <path d="M16 3v18" />
      <path d="M6 3h12" />
      <path d="M6 21h12" />
      <path d="M6 7h12" opacity="0.3" />
      <path d="M6 17h12" opacity="0.3" />
      <path 
        d="M14 9l-2 4h3l-4 6v-5h-3l4-5" 
        fill="#0B0E14" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
    </svg>
  ),
  Healthcare: (
    <svg className="w-8 h-8 mb-2 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14l-1.5-4H6.5L5 8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8h18v9a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9.5v5m-2.5-2.5h5" />
    </svg>
  ),
  ProfessionalServices: (
    <svg className="w-8 h-8 mb-2 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

interface IndustryItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  sub?: string;
}

const KEY_INDUSTRIES: IndustryItem[] = [
  { id: 'Construction & Real Estate', label: 'Construction', icon: Icons.Construction },
  { id: 'Skilled Trades', label: 'Skilled Trades', icon: Icons.SkilledTrades },
  { id: 'Healthcare / MedTech', label: 'Healthcare', icon: Icons.Healthcare },
  { id: 'Professional Services', label: 'Prof. Services', icon: Icons.ProfessionalServices },
];

const REVENUE_PRESETS = [
  { label: '$1M', value: 1000000 },
  { label: '$5M', value: 5000000 },
  { label: '$10M', value: 10000000 },
  { label: '$25M', value: 25000000 },
  { label: '$50M+', value: 50000000 },
];

export const StageFoundation: React.FC<StageFoundationProps> = ({ onComplete }) => {
  const [industry, setIndustry] = useState('');
  const [displayRevenue, setDisplayRevenue] = useState<string>('');
  const [rawRevenue, setRawRevenue] = useState<number>(0);
  const [error, setError] = useState('');

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const updateRevenue = (val: number | string) => {
    let numVal = 0;
    
    if (typeof val === 'number') {
      numVal = val;
    } else {
      // Clean string input
      const raw = val.replace(/[^0-9]/g, '');
      if (!raw) {
        setRawRevenue(0);
        setDisplayRevenue('');
        return;
      }
      numVal = parseInt(raw, 10);
    }
    
    setRawRevenue(numVal);
    setDisplayRevenue(formatNumber(numVal));
  };

  const handleRevenueTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const val = e.target.value;

    // 1. Check for Shorthand (e.g. 10m, 5k, 2.5b)
    const shorthandRegex = /^(\d+(\.\d+)?)([kmb])$/i;
    const match = val.match(shorthandRegex);

    if (match) {
      const number = parseFloat(match[1]);
      const suffix = match[3].toLowerCase();
      let multiplier = 1;
      if (suffix === 'k') multiplier = 1000;
      if (suffix === 'm') multiplier = 1000000;
      if (suffix === 'b') multiplier = 1000000000;
      
      const calculated = number * multiplier;
      updateRevenue(calculated);
      return;
    }

    // 2. Standard Input logic via helper
    updateRevenue(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry) {
      setError('SECTOR_UNDEFINED: Please identify your operational vertical.');
      return;
    }
    
    if (rawRevenue === 0) {
      setError('VECTOR_MISSING: Annual revenue data required for risk triangulation.');
      return;
    }
    
    onComplete({ industry, revenue: rawRevenue });
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pt-12">
      <div className="mb-8 border-l-2 border-[#E8830C] pl-4">
        <h2 className="text-2xl font-bold text-white mb-2">SEQUENCE 01: FOUNDATION</h2>
        <p className="text-[#9CA3AF] leading-relaxed">
          We establish your baseline risk profile by normalizing against sector-specific volatility indices. 
          Your revenue magnitude determines the scale of potential daily loss ($RAR) during an operational outage.
          <br /><br />
          <span className="text-xs font-mono text-[#E8830C]">ALL DATA IS PROCESSED LOCALLY AND ANONYMIZED UNTIL THE FINAL GATE.</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-[#161B22] p-8 border border-[#374151]">
        
        {/* Industry Section */}
        <div>
          <label className="block text-xs font-mono text-[#9CA3AF] uppercase mb-4">
            Industry
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {KEY_INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => { setIndustry(ind.id); setError(''); }}
                className={`flex flex-col items-center justify-center p-4 border transition-all duration-200 group ${
                  industry === ind.id 
                    ? 'bg-[#E8830C]/10 border-[#E8830C] text-[#E8830C]' 
                    : 'bg-[#0B0E14] border-[#374151] text-[#9CA3AF] hover:border-[#9CA3AF] hover:bg-[#1F2937]'
                }`}
              >
                <div className={`transition-transform duration-200 ${industry === ind.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {ind.icon}
                </div>
                <span className="text-[10px] font-mono font-bold uppercase text-center leading-tight mt-2">{ind.label}</span>
                {ind.sub && <span className="text-[8px] font-mono mt-1 text-center opacity-70">{ind.sub}</span>}
              </button>
            ))}
          </div>

          <div className="relative">
            <select
              value={KEY_INDUSTRIES.some(k => k.id === industry) ? "" : industry}
              onChange={(e) => { setIndustry(e.target.value); setError(''); }}
              className="w-full bg-[#0B0E14] border border-[#374151] text-white p-3 text-sm focus:border-[#E8830C] focus:outline-none transition-colors appearance-none cursor-pointer font-mono"
            >
              <option value="" disabled>OR SELECT OTHER SECTOR...</option>
              {INDUSTRIES.filter(ind => !KEY_INDUSTRIES.some(k => k.id === ind)).map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#9CA3AF]">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Revenue Section - Replaced Slider with Quick Select Grid */}
        <div>
          <label className="block text-xs font-mono text-[#9CA3AF] uppercase mb-4">
            Est. Annual Revenue (USD)
          </label>
          
          <div className="bg-[#0B0E14] border border-[#374151] p-6 space-y-6">
            <div className="relative">
              <input
                type="text"
                value={displayRevenue}
                onChange={handleRevenueTextChange}
                className="w-full bg-transparent text-white text-3xl font-mono font-bold focus:outline-none border-b border-[#374151] focus:border-[#E8830C] pb-2 text-center"
                placeholder="$0"
              />
              <div className="text-center text-[10px] text-[#6B7280] mt-2 font-mono uppercase tracking-wider">
                Type directly (e.g. '15m') or select a tier below
              </div>
            </div>

            {/* Quick Select Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {REVENUE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateRevenue(preset.value)}
                  className={`py-3 px-2 text-xs font-mono border transition-all duration-200 hover:border-[#9CA3AF] ${
                    rawRevenue === preset.value
                      ? 'bg-[#E8830C] border-[#E8830C] text-white'
                      : 'bg-[#1F2937] border-[#374151] text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <ErrorTerminal message={error} />}

        <Button type="submit" fullWidth className="mt-4">
          Start Risk Audit &rarr;
        </Button>
      </form>
    </div>
  );
};