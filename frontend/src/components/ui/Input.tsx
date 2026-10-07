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
          className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted"
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
          bg-surface/60
          px-4
          py-3
          text-sm
          font-medium
          text-foreground
          placeholder:text-disabled
          transition-all
          focus:outline-none
          focus:ring-1
          ${
            error
              ? 'border-danger/50 focus:border-danger focus:ring-danger'
              : 'border-border focus:border-accent focus:ring-accent'
          }
          ${className}
        `}
        {...props}
      />

      {error && (
        <span className="ml-1 text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
};