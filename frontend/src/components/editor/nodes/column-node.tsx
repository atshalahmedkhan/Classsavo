import { PlateElement, type PlateElementProps } from 'platejs/react';

export function ColumnGroupElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      className="my-2 rounded-lg border border-[#e8ddd0] bg-[#faf6f1] p-2"
    >
      <div data-testid="column-group" className="flex w-full gap-3">
        {children}
      </div>
    </PlateElement>
  );
}

export function ColumnElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      className="min-w-0 flex-1 rounded border border-[#e8ddd0] bg-white p-2"
    >
      <div data-testid="column-item" className="h-full w-full">
        {children}
      </div>
    </PlateElement>
  );
}
