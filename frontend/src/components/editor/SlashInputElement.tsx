import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useComboboxInput } from '@platejs/combobox/react';
import { KEYS } from 'platejs';
import {
  PlateElement,
  useEditorRef,
  useElement,
  type PlateElementProps,
} from 'platejs/react';
import { SlashCommandMenu } from './SlashCommandMenu';
import { filterSlashItems, type SlashCommandItem } from './slash-command-items';

export function SlashInputElement({ children, ...props }: PlateElementProps) {
  const editor = useEditorRef();
  const element = useElement();
  const inputRef = useRef<HTMLSpanElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const query = useMemo(() => {
    const text = element.children
      .map((child) => ('text' in child ? child.text : ''))
      .join('');
    return text.startsWith('/') ? text.slice(1) : text;
  }, [element.children]);

  const items = useMemo(() => filterSlashItems(query), [query]);

  const selectItem = (item: SlashCommandItem) => {
    item.onSelect(editor);
  };

  const { props: comboboxProps } = useComboboxInput({
    ref: inputRef,
    cancelInputOnBlur: false,
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % Math.max(items.length, 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        current === 0 ? Math.max(items.length - 1, 0) : current - 1,
      );
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) selectItem(item);
      return;
    }
    comboboxProps.onKeyDown(event);
  };

  return (
    <PlateElement {...props} as="span" className="relative inline-block">
      <span className="text-[#6b5c52]">/</span>
      <span
        ref={inputRef}
        contentEditable
        suppressContentEditableWarning
        className="text-[#6b5c52] outline-none"
        {...comboboxProps}
        onKeyDown={handleKeyDown}
      />
      <div
        contentEditable={false}
        className="absolute left-0 top-full z-50 mt-1"
        data-testid="slash-command-menu"
      >
        <SlashCommandMenu
          items={items}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          onSelect={selectItem}
        />
      </div>
      <span className="sr-only">{KEYS.slashInput}</span>
      {children}
    </PlateElement>
  );
}
