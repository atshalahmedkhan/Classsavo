import { useExcalidrawElement } from '@platejs/excalidraw/react';
import type { TExcalidrawElement } from '@platejs/excalidraw';
import { PlateElement, useReadOnly, type PlateElementProps } from 'platejs/react';

export function ExcalidrawElement({
  children,
  element,
  ...props
}: PlateElementProps<TExcalidrawElement>) {
  const readOnly = useReadOnly();
  const { Excalidraw, excalidrawProps } = useExcalidrawElement({ element });

  return (
    <PlateElement {...props} element={element} className="my-2">
      <div
        data-testid="excalidraw-block"
        className="aspect-video max-h-[600px] w-full overflow-hidden rounded-lg border border-[#e8ddd0] bg-white"
        contentEditable={false}
      >
        {Excalidraw ? (
          <Excalidraw {...excalidrawProps} viewModeEnabled={readOnly} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#9a8b82]">
            Loading canvas...
          </div>
        )}
      </div>
      {children}
    </PlateElement>
  );
}
