import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold',
  };

  const variantStyles = {
    success: 'bg-orange-500/10 text-orange-400 border border-orange-500/30 shadow-sm shadow-orange-500/10',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/10',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-sm shadow-purple-500/10',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
