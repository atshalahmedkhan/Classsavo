import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-[#faf6f1] px-2.5 py-0.5 text-xs font-medium text-[#6b5c52]',
        className,
      )}
      {...props}
    />
  );
}
