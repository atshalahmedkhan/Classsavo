import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { SlashCommandItem } from './slash-command-items';

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  activeIndex: number;
  onSelect: (item: SlashCommandItem) => void;
  onActiveIndexChange: (index: number) => void;
}

export function SlashCommandMenu({
  items,
  activeIndex,
  onSelect,
  onActiveIndexChange,
}: SlashCommandMenuProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeItem = listRef.current?.querySelector('[data-active="true"]');
    activeItem?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, items]);

  if (items.length === 0) {
    return (
      <div className="w-72 rounded-lg border border-[#e8ddd0] bg-white p-3 text-sm text-[#6b5c52] shadow-lg">
        No results
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Slash commands"
      className="max-h-80 w-72 overflow-y-auto rounded-lg border border-[#e8ddd0] bg-white py-1 shadow-lg"
    >
      {items.map((item, index) => {
        const showGroupHeader = index === 0 || items[index - 1]?.group !== item.group;
        const Icon = item.icon;
        const isActive = index === activeIndex;

        return (
          <div key={item.id}>
            {showGroupHeader && (
              <div className="px-3 pb-1 pt-2 text-xs font-medium text-[#9a8b82]">{item.group}</div>
            )}
            <button
              type="button"
              role="option"
              aria-selected={isActive}
              data-active={isActive ? 'true' : 'false'}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#2c1810] transition-colors',
                isActive && 'bg-[#f3ece3]',
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(item);
              }}
              onMouseEnter={() => onActiveIndexChange(index)}
            >
              <Icon className="h-4 w-4 shrink-0 text-[#6b5c52]" />
              <span>{item.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
