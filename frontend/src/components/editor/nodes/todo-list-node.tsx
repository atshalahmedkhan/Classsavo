import { KEYS } from 'platejs';
import { PlateElement, type PlateElementProps } from 'platejs/react';
import { useTodoListElement, useTodoListElementState } from '@platejs/list/react';

export function ParagraphElement(props: PlateElementProps) {
  const { element } = props;
  const isTodo = element.listStyleType === KEYS.listTodo;

  if (!isTodo) {
    return <PlateElement {...props} />;
  }

  const state = useTodoListElementState({ element });
  const { checkboxProps } = useTodoListElement(state);

  return (
    <PlateElement {...props} className="flex items-start gap-2">
      <input
        type="checkbox"
        data-testid="todo-checkbox"
        className="mt-1 h-4 w-4 shrink-0 rounded border-[#e8ddd0] accent-[#c2622a]"
        checked={checkboxProps.checked}
        onChange={(event) => checkboxProps.onCheckedChange(event.target.checked)}
        onMouseDown={checkboxProps.onMouseDown}
        contentEditable={false}
      />
      <span className="min-w-0 flex-1">{props.children}</span>
    </PlateElement>
  );
}
