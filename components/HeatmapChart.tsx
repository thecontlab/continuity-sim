import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { HeatmapPoint } from '../types';
import { getRiskColor } from '../constants';

interface HeatmapChartProps {
  data: HeatmapPoint[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const score = data.x + data.y; // Composite Score
    const color = getRiskColor(data.x, data.y);
    
    return (
      <div className="bg-[#161B22] border border-[#374151] p-3 text-xs shadow-xl backdrop-blur-sm bg-opacity-90 z-50">
        <div className="flex items-center gap-2 mb-2 border-b border-[#374151] pb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
          <p className="font-bold text-white font-mono uppercase">{data.label}</p>
        </div>
        <div className="space-y-1 font-mono">
          <p className="text-[#9CA3AF] flex justify-between gap-4">
            <span>MAGNITUDE:</span>
            <span className="text-white font-bold">{score}/20</span>
          </p>
          <p className="text-[#9CA3AF] flex justify-between gap-4">
            <span>SEVERITY:</span>
            <span className="text-[#E8830C]">{data.x}</span>
          </p>
          <p className="text-[#9CA3AF] flex justify-between gap-4">
            <span>LATENCY:</span>
            <span className="text-[#E8830C]">{data.y}</span>
          </p>
        </div>
        {data.status === 'Unknown' && (
          <div className="mt-2 text-[#DC2626] font-mono font-bold bg-[#450A0A] px-2 py-1 text-[10px] text-center">
            ⚠️ UNVERIFIED DATA
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] bg-[#0B0E14] border border-[#374151] flex items-center justify-center text-[#9CA3AF] font-mono text-xs">
        DATA STREAM OFFLINE...
      </div>
    );
  }

  // 1. Transform and Sort Data
  // We calculate a 'magnitude' score (Severity + Latency) and sort descending (Critical first)
  const chartData = [...data].map(point => ({
    ...point,
    magnitude: point.x + point.y, // Max 20
  })).sort((a, b) => b.magnitude - a.magnitude);

  return (
    <div className="w-full h-[350px] bg-[#0B0E14] border border-[#374151] p-4 relative overflow-hidden flex flex-col">
      {/* Texture Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,21,28,1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,21,28,1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />
      
      <div className="flex justify-between items-center mb-4 px-2 z-10">
        <h3 className="text-xs font-mono text-[#9CA3AF] uppercase tracking-wider">
          Threat Magnitude Index
        </h3>
        <div className="flex gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span>LOW</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EAB308]"></span>MED</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>CRITICAL</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            barSize={20}
          >
            <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" horizontal={false} />
            <XAxis 
              type="number" 
              domain={[0, 20]} 
              hide 
            />
            <YAxis 
              type="category" 
              dataKey="label" 
              width={140}
              tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#1F2937', opacity: 0.4}} />
            <Bar dataKey="magnitude" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColor(entry.x, entry.y)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};