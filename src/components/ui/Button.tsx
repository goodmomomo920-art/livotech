import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'dark' | 'light' | 'outline' | 'white' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'dark', size = 'md', children, className = '', ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    dark: 'btn-dark',
    light: 'btn-light',
    outline: 'btn-outline',
    white: 'btn-white',
    ghost: 'btn-ghost',
  };
  const sizes: Record<string, string> = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };
  return (
    <button className={`btn ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
