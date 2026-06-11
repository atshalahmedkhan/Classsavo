import type { PlateLeafProps } from 'platejs/react';
import { PlateLeaf } from 'platejs/react';

export function CodeSyntaxLeaf({ className, ...props }: PlateLeafProps) {
  const tokenClass = props.leaf.className as string | undefined;

  return (
    <PlateLeaf
      {...props}
      className={tokenClass ? `token ${tokenClass}` : className}
    />
  );
}
