import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  glowColor?: 'lime' | 'blue' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, glowColor = 'lime' }) => {
  const glowClasses = {
    lime: 'bg-[#ccff00]/10 group-hover:bg-[#ccff00]/20',
    blue: 'bg-blue-500/10 group-hover:bg-blue-500/20',
    rose: 'bg-rose-500/10 group-hover:bg-rose-500/20'
  };

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-16 h-16 blur-[20px] rounded-full transition-all ${glowClasses[glowColor]}`} />
      <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{title}</span>
      <span className="text-3xl sm:text-4xl font-black text-white">{value}</span>
    </Card>
  );
};