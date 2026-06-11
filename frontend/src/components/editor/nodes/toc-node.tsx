import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { useTocElement, useTocElementState } from '@platejs/toc/react';
import { cn } from '@/lib/utils';

const depthPadding: Record<number, string> = {
  1: 'pl-1',
  2: 'pl-6',
  3: 'pl-10',
  4: 'pl-14',
};

export function TocElement(props: PlateElementProps) {
  const state = useTocElementState();
  const { props: btnProps } = useTocElement(state);
  const { activeContentId, headingList } = state;

  return (
    <PlateElement {...props} className="my-2 rounded-lg border border-[#e8ddd0] bg-[#faf6f1] p-3">
      <div data-testid="toc-block">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9a8b82]">
          Table of contents
        </div>
        {headingList.length > 0 ? (
          <div className="space-y-0.5">
            {headingList.map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid={`toc-item-${item.id}`}
                className={cn(
                  'block w-full truncate rounded px-1 py-1 text-left text-sm underline decoration-[0.5px] underline-offset-4',
                  depthPadding[item.depth] ?? 'pl-1',
                  item.id === activeContentId
                    ? 'bg-[#f3ece3] text-[#2c1810] decoration-[#2c1810]'
                    : 'text-[#6b5c52] hover:bg-[#f3ece3] hover:text-[#2c1810]',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => btnProps.onClick(event, item, 'smooth')}
              >
                {item.title}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#9a8b82]">
            Create a heading to display the table of contents.
          </p>
        )}
      </div>
      {props.children}
    </PlateElement>
  );
}
