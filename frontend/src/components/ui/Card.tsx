import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'interactive';
}

const variants = {
  default: `
    bg-surface/80
    backdrop-blur-md
    border
    border-border
    shadow-card
  `,

  muted: `
    bg-surface/50
    border
    border-border/50
  `,

  interactive: `
    bg-surface/80
    backdrop-blur-md
    border
    border-border
    shadow-card
    transition-all
    duration-200
    hover:border-border-light
    hover:bg-surface
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