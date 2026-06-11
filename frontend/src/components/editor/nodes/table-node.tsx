import { PlateElement, type PlateElementProps } from 'platejs/react';
import { cn } from '@/lib/utils';

export function TableElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} as="table" className="my-2 w-full table-fixed border-collapse">
      <tbody>{props.children}</tbody>
    </PlateElement>
  );
}

export function TableRowElement(props: PlateElementProps) {
  return <PlateElement {...props} as="tr" />;
}

export function TableCellElement(props: PlateElementProps) {
  const isHeader = props.element.type === 'th';

  return (
    <PlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        'border border-[#e8ddd0] p-2 align-top',
        isHeader && 'bg-[#faf6f1] font-medium',
      )}
    />
  );
}
