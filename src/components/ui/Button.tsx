import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5 font-bold shadow-lg',
  };

  const variantStyles = {
    primary: 'bg-[#0B1320] hover:bg-[#18283A] text-white shadow-slate-900/15 shadow-md focus:ring-orange-400 border border-slate-900/10',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-600',
    success: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/25 shadow-md focus:ring-orange-500 border border-orange-400/20',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25 shadow-md focus:ring-rose-500 border border-rose-400/20',
    outline: 'border border-orange-300 text-[#E65B00] hover:bg-orange-50 focus:ring-orange-300',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-white/70 focus:ring-slate-300',
    glow: 'bg-gradient-to-r from-[#FF6A00] via-[#F47A18] to-[#FFBA3D] hover:brightness-105 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transform hover:-translate-y-0.5',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Processando...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex items-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
