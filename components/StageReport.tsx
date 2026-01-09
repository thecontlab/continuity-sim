import React from 'react';
import { GeminiAuditResponse, IdentityData } from '../types';
import { Button } from './Button';
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

        {/* Right Col: Priority List */}
        <div className="lg:col-span-1">
          <div className="bg-[#161B22] border border-[#374151] h-full">
            <div className="p-4 border-b border-[#374151] bg-[#0B0E14]">
              <h3 className="text-sm font-bold text-white uppercase">90-Day Priority Fix</h3>
            </div>
            
            <div className="divide-y divide-[#374151]">
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
              <Button fullWidth variant="primary" onClick={() => window.print()}>
                Download PDF Report
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};