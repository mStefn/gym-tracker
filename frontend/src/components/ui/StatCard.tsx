import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  glowColor?: 'lime' | 'blue' | 'rose';
}

const glowVariants = {
  lime: 'bg-[#ccff00]/10 group-hover:bg-[#ccff00]/20',
  blue: 'bg-blue-500/10 group-hover:bg-blue-500/20',
  rose: 'bg-rose-500/10 group-hover:bg-rose-500/20',
} as const;

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  glowColor = 'lime',
}) => {
  return (
    <Card className="relative flex flex-col justify-between overflow-hidden p-4 sm:p-5 group">
      <div
        aria-hidden="true"
        className={`
          absolute
          top-0
          right-0
          w-16
          h-16
          rounded-full
          blur-[20px]
          transition-all
          duration-300
          ${glowVariants[glowColor]}
        `}
      />

      <span className="
        relative
        z-10
        mb-2
        text-[10px]
        sm:text-xs
        font-bold
        uppercase
        tracking-widest
        text-zinc-500
      ">
        {title}
      </span>

      <span className="
        relative
        z-10
        text-3xl
        sm:text-4xl
        font-black
        tracking-tight
        text-zinc-100
      ">
        {value}
      </span>
    </Card>
  );
};