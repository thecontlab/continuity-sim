import React from 'react';
import { COLORS } from '../constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyle = "px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0E14] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: `bg-[#E8830C] text-white hover:bg-[#C26D0A] focus:ring-[#E8830C]`,
    secondary: `bg-[#1F2937] text-white hover:bg-[#374151] focus:ring-[#374151]`,
    outline: `bg-transparent border border-[#374151] text-[#9CA3AF] hover:border-[#E8830C] hover:text-[#E8830C] focus:ring-[#374151]`
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};