import React from 'react';
import { theme } from '../../constants/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof theme.button;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  ...props 
}) => {
  return (
    <button className={`${theme.button[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};