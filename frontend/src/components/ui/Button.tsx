import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

const variants = {
  primary: `
    w-full
    bg-accent
    text-background
    font-bold
    py-3
    px-4
    rounded-xl
    transition-all
    duration-200
    hover:bg-accent-hover
    hover:shadow-glow-strong
    active:scale-[0.98]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-accent
    disabled:opacity-40
    disabled:cursor-not-allowed
    disabled:pointer-events-none
    disabled:active:scale-100
    flex
    items-center
    justify-center
    gap-2
  `,

  secondary: `
    w-full
    bg-surface-muted
    text-foreground
    font-bold
    py-3
    px-4
    rounded-xl
    border
    border-border-light
    transition-all
    duration-200
    hover:bg-border-light
    hover:border-border-light
    active:scale-[0.98]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-muted
    disabled:opacity-40
    disabled:cursor-not-allowed
    disabled:pointer-events-none
    disabled:active:scale-100
    flex
    items-center
    justify-center
    gap-2
  `,

  ghost: `
    text-muted
    hover:text-accent
    transition-colors
    duration-200
    rounded-lg
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-accent
    disabled:opacity-40
    disabled:cursor-not-allowed
    disabled:pointer-events-none
  `,

  danger: `
    w-full
    bg-danger/10
    text-danger
    font-bold
    py-3
    px-4
    rounded-xl
    border
    border-danger/20
    transition-all
    duration-200
    hover:bg-danger/20
    hover:border-danger/30
    active:scale-[0.98]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-danger
    disabled:opacity-40
    disabled:cursor-not-allowed
    disabled:pointer-events-none
    disabled:active:scale-100
    flex
    items-center
    justify-center
    gap-2
  `,
} as const;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      type="button"
      className={`${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};