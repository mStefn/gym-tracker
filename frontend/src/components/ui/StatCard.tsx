import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  glowColor?: 'lime' | 'blue' | 'rose';
}

const glowVariants = {
  lime: 'bg-accent/10 group-hover:bg-accent/20',
  blue: 'bg-blue/10 group-hover:bg-blue/20',
  rose: 'bg-rose/10 group-hover:bg-rose/20',
} as const;

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  glowColor = 'lime',
}) => {
  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden p-4 sm:p-5">
      <div
        aria-hidden="true"
        className={`
          absolute
          top-0
          right-0
          h-16
          w-16
          rounded-full
          blur-[20px]
          transition-all
          duration-300
          ${glowVariants[glowColor]}
        `}
      />

      <span className="relative z-10 mb-2 text-[10px] font-bold uppercase tracking-widest text-subtle sm:text-xs">
        {title}
      </span>

      <span className="relative z-10 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        {value}
      </span>
    </Card>
  );
};