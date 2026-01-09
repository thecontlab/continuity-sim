import React, { useState } from 'react';
import { GeminiAuditResponse, IdentityData } from '../types';
import { HeatmapChart } from './HeatmapChart';
import { Button } from './Button';
import { getRiskColor } from '../constants';

interface StageTeaserProps {
  data: GeminiAuditResponse;
  onUnlock: (identity: IdentityData) => void;
}

export const StageTeaser: React.FC<StageTeaserProps> = ({ data, onUnlock }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(name && email) {
      onUnlock({ companyName: name, email });
    }
  };

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="max-w-4xl mx-auto pt-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="mb-6">
             <div className="text-xs font-mono text-[#DC2626] mb-2 animate-pulse">CRITICAL FINDING DETECTED</div>
             <h2 className="text-3xl font-bold text-white mb-4 leading-tight">{data.teaser_summary.headline}</h2>
             <p className="text-[#9CA3AF] text-sm leading-relaxed border-l border-[#E8830C] pl-4">
               {data.teaser_summary.critical_finding}
             </p>
          </div>
          
          <div className="bg-[#161B22] p-6 border border-[#374151] mb-6">
            <div className="text-xs text-[#9CA3AF] uppercase mb-1">Estimated Revenue-at-Risk (RAR)</div>
            <div className="text-4xl font-mono text-[#E8830C] font-bold">
              {currencyFormatter.format(data.audit_results.primary_rar)}
            </div>
            <div className="text-xs text-[#6B7280] mt-2">
              Primary Driver: {data.audit_results.primary_risk_category}
            </div>
          </div>

          {/* Dynamic Risk Legend */}
          <div className="border-t border-[#374151] pt-4">
            <h4 className="text-[10px] font-mono uppercase text-[#6B7280] mb-3">Detected Risk Vectors</h4>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {data.heatmap_coordinates.map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: getRiskColor(point.x, point.y) }} 
                  />
                  <span className="text-[10px] font-mono text-[#9CA3AF] truncate">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
           <HeatmapChart data={data.heatmap_coordinates} />
        </div>
      </div>

      {/* Identity Gate */}
      <div className="mt-12 bg-[#0B0E14] border border-[#E8830C] p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0B0E14] via-[#E8830C] to-[#0B0E14]" />
        
        <div className="relative z-10 text-center max-w-lg mx-auto">
          <h3 className="text-xl font-bold text-white mb-2">UNLOCK FULL DIAGNOSTIC REPORT</h3>
          <p className="text-[#9CA3AF] text-sm mb-6">
            Access the 90-day Fix-It Priority List and complete breakdown of the {data.audit_results.unknown_vulnerabilities.length > 0 ? `${data.audit_results.unknown_vulnerabilities.length} Unknown Vulnerabilities and ` : ''} 
            Volatility Gap analysis.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Company Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#161B22] border border-[#374151] text-white px-4 py-3 text-sm focus:border-[#E8830C] focus:outline-none"
            />
             <input
              type="email"
              placeholder="Professional Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#161B22] border border-[#374151] text-white px-4 py-3 text-sm focus:border-[#E8830C] focus:outline-none"
            />
            <Button type="submit" fullWidth>
              TRANSMIT FULL REPORT &rarr;
            </Button>
          </form>
          <p className="text-[10px] text-[#4B5563] mt-4">
            By proceeding, you accept the Continuity Auditor Terms of Engagement. Data is encrypted and confidential.
          </p>
        </div>
      </div>
    </div>
  );
};