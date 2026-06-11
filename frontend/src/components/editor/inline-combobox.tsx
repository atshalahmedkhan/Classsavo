import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import {
  Combobox,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxItem,
  ComboboxPopover,
  ComboboxProvider,
  ComboboxRow,
  Portal,
  useComboboxContext,
  useComboboxStore,
  type ComboboxItemProps,
} from '@ariakit/react';
import { filterWords } from '@platejs/combobox';
import {
  useComboboxInput,
  type UseComboboxInputResult,
} from '@platejs/combobox/react';
import type { ComboboxInputCursorState } from '@platejs/combobox';
import type { PointRef, TElement } from 'platejs';
import { useComposedRef, useEditorRef } from 'platejs/react';
import { cn } from '@/lib/utils';

type FilterFn = (
  item: { value: string; group?: string; keywords?: string[]; label?: string },
  search: string,
) => boolean;

type InlineComboboxContextValue = {
  filter: FilterFn | false;
  inputProps: UseComboboxInputResult['props'];
  inputRef: React.RefObject<HTMLSpanElement | null>;
  removeInput: UseComboboxInputResult['removeInput'];
  showTrigger: boolean;
  trigger: string;
  setHasEmpty: (hasEmpty: boolean) => void;
};

const InlineComboboxContext = createContext<InlineComboboxContextValue | null>(null);

const defaultFilter: FilterFn = ({ group, keywords = [], label, value }, search) => {
  const uniqueTerms = new Set([value, ...keywords, group, label].filter(Boolean));
  return Array.from(uniqueTerms).some((keyword) => filterWords(keyword!, search));
};

function useContentEditableCursorState(
  ref: React.RefObject<HTMLElement | null>,
): ComboboxInputCursorState {
  const [atStart, setAtStart] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  const recompute = useCallback(() => {
    setTimeout(() => {
      const el = ref.current;
      if (!el) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) return;

      const text = el.textContent ?? '';
      const startRange = range.cloneRange();
      startRange.selectNodeContents(el);
      startRange.setEnd(range.startContainer, range.startOffset);
      const start = startRange.toString().length;

      const endRange = range.cloneRange();
      endRange.selectNodeContents(el);
      endRange.setEnd(range.endContainer, range.endOffset);
      const end = endRange.toString().length;

      setAtStart(start === 0);
      setAtEnd(end === text.length);
    });
  }, [ref]);

  useEffect(() => {
    recompute();
    const el = ref.current;
    if (!el) return;

    el.addEventListener('input', recompute);
    el.addEventListener('keydown', recompute);
    el.addEventListener('pointerdown', recompute);
    el.addEventListener('pointerup', recompute);
    document.addEventListener('selectionchange', recompute);

    return () => {
      el.removeEventListener('input', recompute);
      el.removeEventListener('keydown', recompute);
      el.removeEventListener('pointerdown', recompute);
      el.removeEventListener('pointerup', recompute);
      document.removeEventListener('selectionchange', recompute);
    };
  }, [recompute, ref]);

  return { atStart, atEnd };
}

type InlineComboboxProps = {
  children: ReactNode;
  element: TElement;
  trigger: string;
  filter?: FilterFn | false;
  hideWhenNoValue?: boolean;
  showTrigger?: boolean;
  value?: string;
  setValue?: (value: string) => void;
};

export function InlineCombobox({
  children,
  element,
  filter = defaultFilter,
  hideWhenNoValue = false,
  setValue: setValueProp,
  showTrigger = true,
  trigger,
  value: valueProp,
}: InlineComboboxProps) {
  const editor = useEditorRef();
  const inputRef = useRef<HTMLSpanElement>(null);
  const cursorState = useContentEditableCursorState(inputRef);
  const [valueState, setValueState] = useState('');
  const hasValueProp = valueProp !== undefined;
  const value = hasValueProp ? valueProp : valueState;

  const setValue = useCallback(
    (newValue: string) => {
      setValueProp?.(newValue);
      if (!hasValueProp) setValueState(newValue);
    },
    [hasValueProp, setValueProp],
  );

  const insertPointRef = useRef<PointRef | null>(null);

  useEffect(() => {
    insertPointRef.current?.unref();
    insertPointRef.current = null;

    const path = editor.api.findPath(element);
    if (!path) return;

    const point = editor.api.before(path);
    if (!point) return;

    const pointRef = editor.api.pointRef(point);
    insertPointRef.current = pointRef;

    return () => {
      if (insertPointRef.current === pointRef) insertPointRef.current = null;
      pointRef.unref();
    };
  }, [editor, element]);

  const { props: inputProps, removeInput } = useComboboxInput({
    cancelInputOnBlur: true,
    cursorState,
    autoFocus: true,
    ref: inputRef,
    onCancelInput: (cause) => {
      if (cause !== 'backspace') {
        editor.tf.insertText(trigger + value, {
          at: insertPointRef.current?.current ?? undefined,
        });
      }
      if (cause === 'arrowLeft' || cause === 'arrowRight') {
        editor.tf.move({
          distance: 1,
          reverse: cause === 'arrowLeft',
        });
      }
    },
  });

  const [hasEmpty, setHasEmpty] = useState(false);

  const contextValue = useMemo<InlineComboboxContextValue>(
    () => ({
      filter,
      inputProps,
      inputRef,
      removeInput,
      setHasEmpty,
      showTrigger,
      trigger,
    }),
    [filter, inputProps, removeInput, showTrigger, trigger],
  );

  const store = useComboboxStore({
    setValue: (newValue) => setValue(newValue),
  });

  const items = store.useState('items');

  useEffect(() => {
    if (!store.getState().activeId) {
      store.setActiveId(store.first());
    }
  }, [items, store]);

  return (
    <InlineComboboxContext.Provider value={contextValue}>
      <ComboboxProvider
        open={
          (items.length > 0 || hasEmpty) && (!hideWhenNoValue || value.length > 0)
        }
        store={store}
      >
        <span className="relative inline-block">
          <Combobox autoSelect showOnClick={false} className="inline-block" />
          {children}
        </span>
      </ComboboxProvider>
    </InlineComboboxContext.Provider>
  );
}

export function InlineComboboxInput({
  className,
  ref: propRef,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { ref?: React.RefObject<HTMLSpanElement | null> }) {
  const context = useContext(InlineComboboxContext);
  const store = useComboboxContext();
  const comboboxValue = store?.useState('value') ?? '';
  const fallbackRef = useRef<HTMLSpanElement>(null);
  const ref = useComposedRef(propRef, context?.inputRef ?? fallbackRef);

  if (!context) return null;

  const { inputProps, showTrigger, trigger } = context;

  return (
    <>
      {showTrigger && <span className="text-[#6b5c52]">{trigger}</span>}
      <span className="relative inline-block min-w-[1ch]">
        <span className="invisible whitespace-pre">{comboboxValue || '\u200B'}</span>
        <span
          ref={ref}
          className={cn('absolute top-0 left-0 outline-none', className)}
          contentEditable
          suppressContentEditableWarning
          {...inputProps}
          {...props}
        />
      </span>
    </>
  );
}

export function InlineComboboxContent({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxPopover>) {
  const store = useComboboxContext();

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!store) return;
    const { items, activeId } = store.getState();
    if (!items.length) return;

    const currentIndex = items.findIndex((item) => item.id === activeId);
    if (event.key === 'ArrowUp' && currentIndex <= 0) {
      event.preventDefault();
      store.setActiveId(store.last());
    } else if (event.key === 'ArrowDown' && currentIndex >= items.length - 1) {
      event.preventDefault();
      store.setActiveId(store.first());
    }
  }

  return (
    <Portal>
      <ComboboxPopover
        data-testid="slash-command-menu"
        className={cn(
          'z-[100] max-h-80 w-72 overflow-y-auto rounded-lg border border-[#e8ddd0] bg-white py-1 shadow-xl',
          className,
        )}
        onMouseDown={(event) => event.preventDefault()}
        onKeyDown={handleKeyDown}
        gutter={8}
        sameWidth={false}
        {...props}
      />
    </Portal>
  );
}

export function InlineComboboxEmpty({ children, className }: HTMLAttributes<HTMLDivElement>) {
  const context = useContext(InlineComboboxContext);
  const store = useComboboxContext()!;
  const items = store.useState('items');

  useEffect(() => {
    context?.setHasEmpty(true);
    return () => context?.setHasEmpty(false);
  }, [context]);

  if (items.length > 0) return null;

  return (
    <div className={cn('px-3 py-2 text-sm text-[#6b5c52]', className)}>{children}</div>
  );
}

export function InlineComboboxGroup({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxGroup>) {
  return <ComboboxGroup className={cn('py-1', className)} {...props} />;
}

export function InlineComboboxGroupLabel({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxGroupLabel>) {
  return (
    <ComboboxGroupLabel
      className={cn('px-3 pb-1 pt-2 text-xs font-medium text-[#9a8b82]', className)}
      {...props}
    />
  );
}

export function InlineComboboxItem({
  className,
  focusEditor = true,
  group,
  keywords,
  label,
  onClick,
  ...props
}: {
  focusEditor?: boolean;
  group?: string;
  keywords?: string[];
  label?: string;
} & ComboboxItemProps &
  Required<Pick<ComboboxItemProps, 'value'>>) {
  const context = useContext(InlineComboboxContext);
  const { value } = props;
  const store = useComboboxContext()!;
  const search = context?.filter && store.useState('value');

  const visible = useMemo(() => {
    if (!context?.filter) return true;
    return context.filter({ group, keywords, label, value }, search as string);
  }, [context, group, keywords, label, value, search]);

  if (!visible || !context) return null;

  return (
    <ComboboxItem
      data-testid={`slash-item-${value}`}
      className={cn(
        'mx-1 flex h-8 cursor-pointer select-none items-center gap-2 rounded-md px-2 text-sm text-[#2c1810] outline-none transition-colors',
        'hover:bg-[#f3ece3] data-[active-item=true]:bg-[#f3ece3]',
        className,
      )}
      onMouseDown={(event) => {
        event.preventDefault();
        if (focusEditor === false) {
          onClick?.(event);
        }
        context.removeInput(focusEditor);
        if (focusEditor !== false) {
          onClick?.(event);
        }
      }}
      {...props}
    />
  );
}

export const InlineComboboxRow = ComboboxRow;
