import React from 'react';
import { COLORS } from '../constants';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = Math.min(100, (current / total) * 100);

  return (
    <div className="w-full h-1 bg-[#1F2937] mt-8 mb-8">
      <div 
        className="h-full transition-all duration-500 ease-out"
        style={{ 
          width: `${percentage}%`,
          backgroundColor: COLORS.accent 
        }}
      />
    </div>
  );
};