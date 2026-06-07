import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-[#e8ddd0] bg-[#faf6f1] px-3 py-2 text-sm text-[#2c1810] outline-none placeholder:text-[#6b5c52]/70 focus:border-[#c2622a] focus:ring-2 focus:ring-[#c2622a]/20',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
