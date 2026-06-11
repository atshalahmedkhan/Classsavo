import { useCallback } from 'react';
import { Copy } from 'lucide-react';
import type { TCodeBlockElement } from 'platejs';
import { PlateElement, type PlateElementProps } from 'platejs/react';
import { Button } from '@/components/ui/Button';

export function CodeBlockElement({
  children,
  element,
  ...props
}: PlateElementProps<TCodeBlockElement>) {
  const language = element.lang ?? 'plaintext';
  const label = language === 'plaintext' ? 'Plain Text' : language;

  const handleCopy = useCallback(() => {
    const text = element.children
      .map((line) => ('text' in line ? line.text : ''))
      .join('\n');
    void navigator.clipboard.writeText(text);
  }, [element.children]);

  return (
    <PlateElement
      {...props}
      element={element}
      className="my-2 overflow-hidden rounded-lg border border-[#e8ddd0] bg-[#f3ece3]"
    >
      <div
        className="flex items-center justify-between border-b border-[#e8ddd0] bg-[#faf6f1] px-3 py-1.5"
        contentEditable={false}
      >
        <span className="text-xs font-medium text-[#6b5c52]" data-testid="code-block-language">
          {label}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 rounded-md px-2 text-xs"
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleCopy}
          aria-label="Copy code"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-sm text-[#2c1810]">
        <code>{children}</code>
      </pre>
    </PlateElement>
  );
}

export function CodeLineElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} as="div" className="whitespace-pre">
      {props.children}
    </PlateElement>
  );
}
