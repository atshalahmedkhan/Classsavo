import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#2c1810]/40"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl border border-[#e8ddd0] bg-white p-6 shadow-lg',
          className,
        )}
      >
        <h2 className="font-serif text-lg font-semibold text-[#2c1810]">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
