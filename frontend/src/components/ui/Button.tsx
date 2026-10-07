import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

const variants = {
  primary: `
    w-full
    bg-[#ccff00]
    text-zinc-950
    font-bold
    py-3
    px-4
    rounded-xl
    transition-all
    duration-200
    hover:bg-[#b3e600]
    hover:shadow-[0_0_15px_rgba(204,255,0,0.4)]
    active:scale-[0.98]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[#ccff00]
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
    bg-zinc-800
    text-zinc-100
    font-bold
    py-3
    px-4
    rounded-xl
    border
    border-zinc-700
    transition-all
    duration-200
    hover:bg-zinc-700
    hover:border-zinc-600
    active:scale-[0.98]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-zinc-500
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
    text-zinc-400
    hover:text-[#ccff00]
    transition-colors
    duration-200
    rounded-lg
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[#ccff00]
    disabled:opacity-40
    disabled:cursor-not-allowed
    disabled:pointer-events-none
  `,

  danger: `
    w-full
    bg-red-500/10
    text-red-500
    font-bold
    py-3
    px-4
    rounded-xl
    border
    border-red-500/20
    transition-all
    duration-200
    hover:bg-red-500/20
    hover:border-red-500/30
    active:scale-[0.98]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-red-500
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