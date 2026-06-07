import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  default:
    'ghibli-gradient-primary text-white shadow-sm hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[#c2622a]/30',
  outline:
    'border border-[#c2622a] bg-transparent text-[#c2622a] hover:bg-[#c2622a]/5',
  ghost: 'text-[#6b5c52] hover:bg-[#faf6f1]',
  destructive: 'bg-destructive text-white hover:brightness-95',
};

const sizes = {
  sm: 'h-8 px-4 text-sm',
  md: 'h-10 px-5',
  lg: 'h-11 px-6',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium transition-all disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
