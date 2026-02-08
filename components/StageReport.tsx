import React from 'react';
import { GeminiAuditResponse, IdentityData } from '../types';
import { HeatmapChart } from './HeatmapChart';

interface StageReportProps {
  data: GeminiAuditResponse;
  identity: IdentityData;
}

export const StageReport: React.FC<StageReportProps> = ({ data, identity }) => {
  return (
    <div className="max-w-5xl mx-auto pt-4 pb-20 animate-fade-in">
      
      {/* Header Info */}
      <div className="flex justify-between items-end border-b border-[#374151] pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white uppercase">{identity.companyName}</h1>
          <div className="text-[#E8830C] font-mono text-sm mt-1">VOLATILITY AUDIT // COMPLETED</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#9CA3AF]">VOLATILITY INDEX</div>
          <div className="text-2xl font-mono text-white">{data.audit_results.volatility_index}/100</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Heatmap & Risks */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-xs font-mono text-[#9CA3AF] uppercase mb-4">Risk Topography</h3>
            <HeatmapChart data={data.heatmap_coordinates} />
          </div>

          <div className="bg-[#161B22] border border-[#374151] p-6">
             <h3 className="text-sm font-bold text-white mb-4 uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-[#DC2626] rounded-full"></span>
                Primary Exposure
             </h3>
             <p className="text-[#9CA3AF] mb-4 text-sm">{data.teaser_summary.critical_finding}</p>
             
             {data.audit_results.unknown_vulnerabilities.length > 0 && (
               <div className="mt-4 pt-4 border-t border-[#374151]">
                 <h4 className="text-xs font-mono text-[#E8830C] mb-2">SHADOW VULNERABILITIES DETECTED</h4>
                 <ul className="list-disc list-inside text-sm text-[#9CA3AF]">
                   {data.audit_results.unknown_vulnerabilities.map((v, i) => (
                     <li key={i}>{v}</li>
                   ))}
                 </ul>
               </div>
             )}
          </div>
        </div>

        {/* Right Col: Priority List & Confirmation */}
        <div className="lg:col-span-1">
          <div className="bg-[#161B22] border border-[#374151] h-full flex flex-col">
            <div className="p-4 border-b border-[#374151] bg-[#0B0E14]">
              <h3 className="text-sm font-bold text-white uppercase">90-Day Priority Fix</h3>
            </div>
            
            <div className="divide-y divide-[#374151] flex-grow">
              {data.priority_fix_list.map((fix, idx) => (
                <div key={idx} className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#E8830C] font-mono text-xs font-bold">{fix.timeline}</span>
                    <span className="text-[10px] bg-[#1F2937] text-[#9CA3AF] px-2 py-1 rounded">
                      {fix.target}
                    </span>
                  </div>
                  <p className="text-white text-sm leading-snug">
                    {fix.task}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-[#0B0E14] border-t border-[#374151]">
              {/* CONCIERGE CONFIRMATION CARD */}
              <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded p-6 text-center animate-fade-in">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                     <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                  </div>
                </div>
                <h3 className="text-white font-bold text-base uppercase mb-2">Analysis Underway</h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4">
                  Your risk profile has been securely transmitted. Our expert team is now reviewing your data to generate your bespoke <strong>Continuity Roadmap</strong>.
                </p>
                <div className="bg-[#0B0E14]/50 rounded p-3 inline-block border border-[#374151] mb-2">
                  <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-wide mb-1">
                    Estimated Delivery
                  </p>
                  <p className="text-[#E8830C] font-mono text-sm font-bold">
                    Within 24 Hours
                  </p>
                </div>
                <p className="text-xs text-[#6B7280] mt-2">
                  Check your inbox at <span className="text-white font-mono">{identity.email}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};