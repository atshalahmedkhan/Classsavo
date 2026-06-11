import { useCallback, useMemo, useState } from 'react';
import type { Value } from 'platejs';
import {
  Plate,
  PlateContent,
  useEditorRef,
  useEditorSelector,
  usePlateEditor,
  useSelectionVersion,
} from 'platejs/react';
import { Bold } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiAssistantPanel } from './editor/AiAssistantPanel';
import { createEditorPlugins } from './editor/plate-plugins';

const DEFAULT_VALUE: Value = [
  {
    type: 'p',
    children: [{ text: '' }],
  },
];

const CONTENT_CLASSNAME =
  'min-h-[200px] cursor-text px-4 py-3 outline-none [&_[data-slate-editor]]:outline-none [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#2c1810] [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#2c1810] [&_h3]:text-lg [&_h3]:font-semibold [&_strong]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-[#e8ddd0] [&_blockquote]:pl-4 [&_blockquote]:italic';

interface PlateEditorProps {
  value: Value;
  onChange: (value: Value) => void;
  readOnly?: boolean;
  editorKey?: string | number;
}

function useBoldToggle(onValueChange: (value: Value) => void) {
  const editor = useEditorRef();

  return () => {
    editor.tf.focus();
    editor.tf.toggleMark('bold');
    onValueChange(editor.children as Value);
  };
}

function PlateToolbar({ onValueChange }: { onValueChange: (value: Value) => void }) {
  const selectionVersion = useSelectionVersion();
  const isBold = useEditorSelector(
    (ed) => ed.api.mark('bold') === true,
    [selectionVersion],
  );
  const toggleBold = useBoldToggle(onValueChange);

  return (
    <div className="flex items-center gap-1 border-b border-[#e8ddd0] px-2 py-1.5">
      <button
        type="button"
        aria-label="Bold"
        title="Bold (Ctrl+B)"
        aria-pressed={isBold}
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBold();
        }}
        className={cn(
          'rounded p-1.5 text-[#6b5c52] transition-colors hover:bg-[#faf6f1]',
          isBold && 'bg-[#faf6f1] text-[#2c1810] ring-1 ring-[#e8ddd0]',
        )}
      >
        <Bold className="h-4 w-4" />
      </button>
    </div>
  );
}

function PlateEditable({
  readOnly,
  onValueChange,
  onOpenAi,
}: {
  readOnly: boolean;
  onValueChange: (value: Value) => void;
  onOpenAi: () => void;
}) {
  const toggleBold = useBoldToggle(onValueChange);

  return (
    <PlateContent
      readOnly={readOnly}
      data-testid="plate-editor-content"
      className={CONTENT_CLASSNAME}
      placeholder="Write chapter content... Type / for blocks or Ctrl+J for AI"
      onKeyDown={(event) => {
        if (readOnly) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
          event.preventDefault();
          toggleBold();
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
          event.preventDefault();
          onOpenAi();
        }
      }}
    />
  );
}

export function PlateEditor({
  value,
  onChange,
  readOnly = false,
  editorKey = 'default',
}: PlateEditorProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const openAi = useCallback(() => setAiOpen(true), []);
  const closeAi = useCallback(() => setAiOpen(false), []);

  const plugins = useMemo(() => createEditorPlugins(openAi), [openAi]);

  const editor = usePlateEditor(
    {
      id: `plate-${editorKey}`,
      plugins,
      value: value.length > 0 ? value : DEFAULT_VALUE,
    },
    [editorKey, plugins],
  );

  return (
    <div className="relative overflow-visible rounded-lg border border-[#e8ddd0] bg-white">
      <Plate
        editor={editor}
        onChange={({ value: nextValue }) => {
          if (!readOnly) {
            onChange(nextValue);
          }
        }}
      >
        {!readOnly && <PlateToolbar onValueChange={onChange} />}
        <PlateEditable readOnly={readOnly} onValueChange={onChange} onOpenAi={openAi} />
        {!readOnly && <AiAssistantPanel open={aiOpen} onClose={closeAi} />}
      </Plate>
    </div>
  );
}
