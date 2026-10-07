import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'interactive';
}

const variants = {
  default: `
    bg-zinc-900/80
    backdrop-blur-md
    border
    border-zinc-800
    shadow-xl
  `,

  muted: `
    bg-zinc-900/50
    border
    border-zinc-800/50
  `,

  interactive: `
    bg-zinc-900/80
    backdrop-blur-md
    border
    border-zinc-800
    shadow-xl
    transition-all
    duration-200
    hover:border-zinc-700
    hover:bg-zinc-900
  `,
} as const;

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`
        rounded-2xl
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};