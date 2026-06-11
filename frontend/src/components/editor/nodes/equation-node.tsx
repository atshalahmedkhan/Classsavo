import { useEffect, useRef, useState } from 'react';
import { Radical } from 'lucide-react';
import type { TEquationElement } from 'platejs';
import {
  PlateElement,
  useReadOnly,
  useSelected,
  type PlateElementProps,
} from 'platejs/react';
import { useEquationElement, useEquationInput } from '@platejs/math/react';
import { cn } from '@/lib/utils';

const KATEX_OPTIONS = {
  errorColor: '#cc0000',
  throwOnError: false,
  strict: 'warn' as const,
  trust: false,
};

function EquationEditorPopover({
  isInline,
  open,
  setOpen,
}: {
  isInline: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const readOnly = useReadOnly();
  const { props: inputProps, onDismiss, onSubmit } = useEquationInput({
    isInline,
    open,
    onClose: () => setOpen(false),
  });

  if (!open || readOnly) return null;

  return (
    <div
      className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-[#e8ddd0] bg-white p-2 shadow-xl"
      contentEditable={false}
      data-testid={isInline ? 'inline-equation-editor' : 'equation-editor'}
      onMouseDown={(event) => event.preventDefault()}
    >
      <textarea
        {...inputProps}
        rows={isInline ? 2 : 4}
        placeholder="E = mc^2"
        className="w-full resize-none rounded-md border border-[#e8ddd0] bg-[#faf6f1] px-2 py-1.5 font-mono text-sm text-[#2c1810] outline-none focus:ring-1 focus:ring-[#c2622a]/30"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs text-[#6b5c52] hover:bg-[#faf6f1]"
          onClick={onDismiss}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md bg-[#c2622a] px-2 py-1 text-xs text-white hover:brightness-95"
          onClick={onSubmit}
        >
          Done
        </button>
      </div>
    </div>
  );
}

export function EquationElement(props: PlateElementProps<TEquationElement>) {
  const { element } = props;
  const selected = useSelected();
  const readOnly = useReadOnly();
  const [open, setOpen] = useState(selected && !readOnly);
  const katexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && !readOnly) setOpen(true);
  }, [selected, readOnly]);

  useEquationElement({
    element,
    katexRef,
    options: { ...KATEX_OPTIONS, displayMode: true },
  });

  return (
    <PlateElement {...props} className="my-2">
      <div className="relative inline-block w-full">
        <div
          role="button"
          tabIndex={0}
          data-testid="equation-block"
          contentEditable={false}
          className={cn(
            'flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg border border-[#e8ddd0] bg-[#faf6f1] px-4 py-3',
            selected && 'ring-1 ring-[#c2622a]/30',
          )}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => !readOnly && setOpen(true)}
        >
          {element.texExpression ? (
            <div ref={katexRef} />
          ) : (
            <span className="flex items-center gap-2 text-sm text-[#9a8b82]">
              <Radical className="h-4 w-4" />
              Add a TeX equation
            </span>
          )}
        </div>
        <EquationEditorPopover isInline={false} open={open} setOpen={setOpen} />
      </div>
      {props.children}
    </PlateElement>
  );
}

export function InlineEquationElement(props: PlateElementProps<TEquationElement>) {
  const { element } = props;
  const selected = useSelected();
  const readOnly = useReadOnly();
  const [open, setOpen] = useState(false);
  const katexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && !readOnly) setOpen(true);
  }, [selected, readOnly]);

  useEquationElement({
    element,
    katexRef,
    options: { ...KATEX_OPTIONS, displayMode: false },
  });

  return (
    <PlateElement {...props} as="span" className="inline">
      <span className="relative inline-block">
        <span
          role="button"
          tabIndex={0}
          data-testid="inline-equation"
          contentEditable={false}
          className={cn(
            'inline-flex cursor-pointer items-center rounded px-1 py-0.5',
            selected && 'bg-[#f3ece3] ring-1 ring-[#e8ddd0]',
            !element.texExpression && 'text-[#9a8b82]',
          )}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => !readOnly && setOpen(true)}
        >
          {element.texExpression ? (
            <div ref={katexRef} className="inline-block" />
          ) : (
            <span className="text-sm">New equation</span>
          )}
        </span>
        <EquationEditorPopover isInline open={open} setOpen={setOpen} />
      </span>
      {props.children}
    </PlateElement>
  );
}
