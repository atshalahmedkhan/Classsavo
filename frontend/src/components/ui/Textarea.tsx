import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-24 w-full rounded-lg border border-[#e8ddd0] bg-[#faf6f1] px-3 py-2 text-sm text-[#2c1810] outline-none placeholder:text-[#6b5c52]/70 focus:border-[#c2622a] focus:ring-2 focus:ring-[#c2622a]/20',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
