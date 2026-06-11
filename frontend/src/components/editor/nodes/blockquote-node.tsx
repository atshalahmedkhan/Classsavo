import { PlateElement, type PlateElementProps } from 'platejs/react';

export function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="blockquote"
      className="my-2 border-l-4 border-[#e8ddd0] pl-4 italic text-[#6b5c52]"
    />
  );
}
