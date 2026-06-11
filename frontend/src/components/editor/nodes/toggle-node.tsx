import { ChevronRight } from 'lucide-react';
import { useToggleButton, useToggleButtonState } from '@platejs/toggle/react';
import { PlateElement, type PlateElementProps } from 'platejs/react';
import { cn } from '@/lib/utils';

export function ToggleElement(props: PlateElementProps) {
  const { element } = props;
  const state = useToggleButtonState(element.id as string);
  const { buttonProps, open } = useToggleButton(state);

  return (
    <PlateElement {...props} className="my-2">
      <div className="flex items-start gap-1">
        <button
          type="button"
          aria-label={open ? 'Collapse toggle' : 'Expand toggle'}
          className="mt-0.5 rounded p-0.5 text-[#6b5c52] hover:bg-[#faf6f1]"
          {...buttonProps}
        >
          <ChevronRight
            className={cn('h-4 w-4 transition-transform', open && 'rotate-90')}
          />
        </button>
        <div className="min-w-0 flex-1">{props.children}</div>
      </div>
    </PlateElement>
  );
}
