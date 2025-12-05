import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  const variants = {
    primary: `
      bg-amber-600 text-stone-900 
      hover:bg-amber-500 
      focus:ring-amber-500
      active:bg-amber-700
    `,
    secondary: `
      bg-stone-700 text-stone-200 
      hover:bg-stone-600 
      focus:ring-stone-500
      active:bg-stone-800
      border border-stone-600
    `,
    danger: `
      bg-red-900/50 text-red-200 
      hover:bg-red-800/50 
      focus:ring-red-500
      active:bg-red-900/70
      border border-red-800/50
    `,
    ghost: `
      bg-transparent text-stone-300 
      hover:bg-stone-800 hover:text-stone-100
      focus:ring-stone-500
      active:bg-stone-700
    `,
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
