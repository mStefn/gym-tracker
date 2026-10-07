import React from 'react';
import { theme } from '../../constants/theme';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`${theme.bg.card} ${className}`} {...props}>
      {children}
    </div>
  );
};