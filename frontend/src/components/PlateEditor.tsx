import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { Value } from 'platejs';
import {
  Plate,
  PlateContent,
  useEditorRef,
  useEditorSelector,
  usePlateEditor,
  useSelectionVersion,
} from 'platejs/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { AiAssistantPanel } from './editor/AiAssistantPanel';
import { createEditorPlugins } from './editor/plate-plugins';

const DEFAULT_VALUE: Value = [
  {
    type: 'p',
    children: [{ text: '' }],
  },
];

const FONT_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: 'Courier New' },
] as const;

type TextAlignValue = 'left' | 'center' | 'right' | 'justify';

const CONTENT_CLASSNAME =
  'min-h-[200px] cursor-text px-4 py-3 outline-none [&_[data-slate-editor]]:outline-none [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#2c1810] [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#2c1810] [&_h3]:text-lg [&_h3]:font-semibold [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_sub]:align-sub [&_sub]:text-[0.8em] [&_sup]:align-super [&_sup]:text-[0.8em] [&_blockquote]:border-l-4 [&_blockquote]:border-[#e8ddd0] [&_blockquote]:pl-4 [&_blockquote]:italic';

interface PlateEditorProps {
  value: Value;
  onChange: (value: Value) => void;
  readOnly?: boolean;
  editorKey?: string | number;
}

type MarkName = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'subscript' | 'superscript';

function useMarkToggle(mark: MarkName, onValueChange: (value: Value) => void) {
  const editor = useEditorRef();

  return () => {
    editor.tf.focus();
    editor.tf.toggleMark(mark);
    onValueChange(editor.children as Value);
  };
}

function MarkToolbarButton({
  mark,
  label,
  shortcut,
  pressed,
  onToggle,
  children,
}: {
  mark: MarkName;
  label: string;
  shortcut?: string;
  pressed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={pressed}
      data-testid={`plate-mark-${mark}`}
      onMouseDown={(event) => {
        event.preventDefault();
        onToggle();
      }}
      className={cn(
        'rounded p-1.5 text-[#6b5c52] transition-colors hover:bg-[#faf6f1]',
        pressed && 'bg-[#faf6f1] text-[#2c1810] ring-1 ring-[#e8ddd0]',
      )}
    >
      {children}
    </button>
  );
}

function AlignToolbarButton({
  align,
  label,
  pressed,
  onSelect,
  children,
}: {
  align: TextAlignValue;
  label: string;
  pressed: boolean;
  onSelect: (align: TextAlignValue) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      data-testid={`plate-align-${align}`}
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect(align);
      }}
      className={cn(
        'rounded p-1.5 text-[#6b5c52] transition-colors hover:bg-[#faf6f1]',
        pressed && 'bg-[#faf6f1] text-[#2c1810] ring-1 ring-[#e8ddd0]',
      )}
    >
      {children}
    </button>
  );
}

function PlateToolbar({ onValueChange }: { onValueChange: (value: Value) => void }) {
  const editor = useEditorRef();
  const selectionVersion = useSelectionVersion();
  const isBold = useEditorSelector((ed) => ed.api.mark('bold') === true, [selectionVersion]);
  const isItalic = useEditorSelector((ed) => ed.api.mark('italic') === true, [selectionVersion]);
  const isUnderline = useEditorSelector((ed) => ed.api.mark('underline') === true, [selectionVersion]);
  const isStrikethrough = useEditorSelector(
    (ed) => ed.api.mark('strikethrough') === true,
    [selectionVersion],
  );
  const isSubscript = useEditorSelector((ed) => ed.api.mark('subscript') === true, [selectionVersion]);
  const isSuperscript = useEditorSelector(
    (ed) => ed.api.mark('superscript') === true,
    [selectionVersion],
  );
  const currentFont = useEditorSelector(
    (ed) => (ed.api.mark('fontFamily') as string | undefined) ?? '',
    [selectionVersion],
  );
  const currentAlign = useEditorSelector((ed) => {
    const blockEntry = ed.api.block();
    if (!blockEntry) return 'left' as TextAlignValue;
    const [node] = blockEntry;
    const align = (node as { align?: string }).align;
    if (align === 'center' || align === 'right' || align === 'justify') return align;
    return 'left';
  }, [selectionVersion]);

  const toggleBold = useMarkToggle('bold', onValueChange);
  const toggleItalic = useMarkToggle('italic', onValueChange);
  const toggleUnderline = useMarkToggle('underline', onValueChange);
  const toggleStrikethrough = useMarkToggle('strikethrough', onValueChange);
  const toggleSubscript = useMarkToggle('subscript', onValueChange);
  const toggleSuperscript = useMarkToggle('superscript', onValueChange);

  const handleFontChange = (value: string) => {
    editor.tf.focus();
    editor.tf.selectAll();
    if (!value) {
      editor.tf.removeMark('fontFamily');
    } else {
      editor.tf.addMarks({ fontFamily: value });
    }
    onValueChange(editor.children as Value);
  };

  const setAlign = (value: TextAlignValue) => {
    editor.tf.focus();
    editor.getTransforms(TextAlignPlugin).textAlign.setNodes(value);
    onValueChange(editor.children as Value);
  };

  return (
    <div className="flex flex-col gap-1 border-b border-[#e8ddd0] px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <select
          aria-label="Font family"
          data-testid="plate-font-family"
          value={currentFont}
          onMouseDown={(event) => event.preventDefault()}
          onChange={(event) => handleFontChange(event.target.value)}
          className="rounded border border-[#e8ddd0] bg-white px-2 py-1 text-sm text-[#2c1810] outline-none focus:ring-1 focus:ring-[#e8ddd0]"
        >
          {FONT_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mx-1 h-5 w-px bg-[#e8ddd0]" aria-hidden />
        <MarkToolbarButton mark="bold" label="Bold" shortcut="Ctrl+B" pressed={isBold} onToggle={toggleBold}>
          <Bold className="h-4 w-4" />
        </MarkToolbarButton>
        <MarkToolbarButton mark="italic" label="Italic" shortcut="Ctrl+I" pressed={isItalic} onToggle={toggleItalic}>
          <Italic className="h-4 w-4" />
        </MarkToolbarButton>
        <MarkToolbarButton mark="underline" label="Underline" shortcut="Ctrl+U" pressed={isUnderline} onToggle={toggleUnderline}>
          <Underline className="h-4 w-4" />
        </MarkToolbarButton>
        <MarkToolbarButton mark="strikethrough" label="Strikethrough" pressed={isStrikethrough} onToggle={toggleStrikethrough}>
          <Strikethrough className="h-4 w-4" />
        </MarkToolbarButton>
        <MarkToolbarButton mark="subscript" label="Subscript" pressed={isSubscript} onToggle={toggleSubscript}>
          <Subscript className="h-4 w-4" />
        </MarkToolbarButton>
        <MarkToolbarButton mark="superscript" label="Superscript" pressed={isSuperscript} onToggle={toggleSuperscript}>
          <Superscript className="h-4 w-4" />
        </MarkToolbarButton>
        <span className="mx-1 h-5 w-px bg-[#e8ddd0]" aria-hidden />
        <AlignToolbarButton align="left" label="Align left" pressed={currentAlign === 'left'} onSelect={setAlign}>
          <AlignLeft className="h-4 w-4" />
        </AlignToolbarButton>
        <AlignToolbarButton align="center" label="Align center" pressed={currentAlign === 'center'} onSelect={setAlign}>
          <AlignCenter className="h-4 w-4" />
        </AlignToolbarButton>
        <AlignToolbarButton align="right" label="Align right" pressed={currentAlign === 'right'} onSelect={setAlign}>
          <AlignRight className="h-4 w-4" />
        </AlignToolbarButton>
        <AlignToolbarButton align="justify" label="Align justify" pressed={currentAlign === 'justify'} onSelect={setAlign}>
          <AlignJustify className="h-4 w-4" />
        </AlignToolbarButton>
      </div>
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
  const toggleBold = useMarkToggle('bold', onValueChange);
  const toggleItalic = useMarkToggle('italic', onValueChange);
  const toggleUnderline = useMarkToggle('underline', onValueChange);

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
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
          event.preventDefault();
          toggleItalic();
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'u') {
          event.preventDefault();
          toggleUnderline();
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
