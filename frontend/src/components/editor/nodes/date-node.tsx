import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { getDateDisplayLabel, formatDateValue, parseCanonicalDateValue } from '@platejs/date';
import type { TDateElement } from 'platejs';
import { PlateElement, useReadOnly, type PlateElementProps } from 'platejs/react';
import { cn } from '@/lib/utils';

export function DateElement({
  children,
  element,
  ...props
}: PlateElementProps<TDateElement>) {
  const readOnly = useReadOnly();
  const [open, setOpen] = useState(false);

  const label = useMemo(
    () =>
      getDateDisplayLabel({
        date: element.date,
        rawDate: element.date,
      }) ?? 'Pick a date',
    [element.date],
  );

  const selected = useMemo(() => {
    if (!element.date) return undefined;
    return parseCanonicalDateValue(element.date) ?? undefined;
  }, [element.date]);

  return (
    <PlateElement {...props} element={element} as="span" className="inline">
      <span className="relative inline-block">
        <button
          type="button"
          data-testid="date-pill"
          contentEditable={false}
          disabled={readOnly}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            'inline-flex items-center rounded-full border border-[#e8ddd0] bg-[#faf6f1] px-2.5 py-0.5 text-sm text-[#2c1810]',
            'hover:bg-[#f3ece3] disabled:cursor-default',
          )}
        >
          {label}
        </button>
        {open && !readOnly && (
          <div
            className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-[#e8ddd0] bg-white p-2 shadow-xl"
            contentEditable={false}
            data-testid="date-calendar"
            onMouseDown={(event) => event.preventDefault()}
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(date) => {
                if (!date) return;
                const path = props.editor.api.findPath(element);
                if (!path) return;
                props.editor.tf.setNodes(
                  { date: formatDateValue(date) },
                  { at: path },
                );
                setOpen(false);
              }}
            />
          </div>
        )}
      </span>
      {children}
    </PlateElement>
  );
}
