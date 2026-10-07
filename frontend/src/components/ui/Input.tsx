import React from 'react';

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="ml-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        className={`
          w-full
          rounded-xl
          border
          bg-zinc-900/60
          px-4
          py-3
          text-sm
          font-medium
          text-zinc-100
          placeholder:text-zinc-600
          transition-all
          focus:outline-none
          focus:ring-1
          ${
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
              : 'border-zinc-800 focus:border-[#ccff00] focus:ring-[#ccff00]'
          }
          ${className}
        `}
        {...props}
      />

      {error && (
        <span className="ml-1 text-xs text-red-400">
          {error}
        </span>
      )}
    </div>
  );
};