import type { TCalloutElement } from 'platejs';
import { PlateElement, type PlateElementProps } from 'platejs/react';

export function CalloutElement({
  children,
  element,
  ...props
}: PlateElementProps<TCalloutElement>) {
  return (
    <PlateElement
      {...props}
      element={element}
      className="my-2 flex gap-3 rounded-lg border border-[#e8ddd0] bg-[#faf6f1] p-4"
    >
      <span className="text-lg leading-none" contentEditable={false}>
        {element.icon ?? '💡'}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </PlateElement>
  );
}
