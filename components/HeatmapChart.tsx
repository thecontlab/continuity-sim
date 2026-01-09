import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { HeatmapPoint } from '../types';
import { COLORS, getRiskColor } from '../constants';

interface HeatmapChartProps {
  data: HeatmapPoint[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = getRiskColor(data.x, data.y);
    return (
      <div className="bg-[#161B22] border border-[#374151] p-3 text-xs shadow-xl backdrop-blur-sm bg-opacity-90 z-50 relative">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
          <p className="font-bold text-white font-mono">{data.label}</p>
        </div>
        <p className="text-[#9CA3AF]">Severity: <span className="text-[#E8830C] font-mono">{data.x}</span></p>
        <p className="text-[#9CA3AF]">Latency: <span className="text-[#E8830C] font-mono">{data.y}</span></p>
        {data.status === 'Unknown' && <p className="text-[#DC2626] font-mono mt-1">UNVERIFIED</p>}
      </div>
    );
  }
  return null;
};

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
  // 1. Safety Check
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-[400px] bg-[#0B0E14] border border-[#374151] flex items-center justify-center text-[#9CA3AF] font-mono text-xs">
        WAITING FOR DATA...
      </div>
    );
  }

  // 2. Helper to safely get score from a point
  const getScore = (p: HeatmapPoint) => {
    if (!p) return 0;
    const x = typeof p.x === 'number' ? p.x : 0;
    const y = typeof p.y === 'number' ? p.y : 0;
    return x + y;
  };
  
  // 3. Calculate Extremes
  const scores = data.map(getScore);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  // 4. Custom Label Renderer: Only labels Min and Max points
  const renderCustomLabel = (props: any) => {
    const { x, y, payload } = props;
    
    if (!payload) return null;

    const score = getScore(payload);
    
    // Logic: Only show label if it matches absolute max or min
    const isMax = Math.abs(score - maxScore) < 0.01;
    const isMin = Math.abs(score - minScore) < 0.01;

    if (!isMax && !isMin) return null;

    return (
      <text 
        x={x} 
        y={y} 
        dy={isMax ? -15 : 25} // Push max up, min down
        dx={0}
        fill="#9CA3AF" 
        fontSize={10} 
        fontFamily="monospace"
        textAnchor="middle"
        fontWeight="bold"
      >
        {payload.label}
      </text>
    );
  };

  return (
    <div className="w-full h-[400px] bg-[#0B0E14] border border-[#374151] p-4 relative overflow-hidden">
       {/* Decorative grid overlay for texture */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(18,21,28,1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,21,28,1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} horizontal={false} />
          
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Severity" 
            domain={[0, 10]} 
            tickCount={11}
            stroke="#4B5563"
            tick={{fontSize: 10, fill: '#6B7280', fontFamily: 'monospace'}}
            label={{ value: 'EXPOSURE SEVERITY', position: 'bottom', offset: 0, fill: '#4B5563', fontSize: 10, dy: 10, fontFamily: 'monospace' }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Latency" 
            domain={[0, 10]} 
            tickCount={11}
            stroke="#4B5563"
            tick={{fontSize: 10, fill: '#6B7280', fontFamily: 'monospace'}}
            label={{ value: 'REACTION LATENCY', angle: -90, position: 'left', fill: '#4B5563', fontSize: 10, fontFamily: 'monospace' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#E8830C' }} />
          
          <ReferenceLine x={5} stroke="#374151" strokeDasharray="3 3" opacity={0.5} />
          <ReferenceLine y={5} stroke="#374151" strokeDasharray="3 3" opacity={0.5} />

          <Scatter name="Risk Nodes" data={data} label={renderCustomLabel}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getRiskColor(entry.x, entry.y)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};