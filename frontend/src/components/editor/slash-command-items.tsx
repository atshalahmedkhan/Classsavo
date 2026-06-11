import type { TPlateEditor } from 'platejs/react';
import { KEYS } from 'platejs';
import {
  Calendar,
  Code2,
  Columns3,
  Footprints,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Pilcrow,
  Sigma,
  Sparkles,
  SquareRadical,
  TableOfContents,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SlashCommandItem = {
  id: string;
  label: string;
  keywords: string[];
  icon: LucideIcon;
  group: string;
  onSelect: (editor: TPlateEditor) => void;
};

function removeSlashInput(editor: TPlateEditor) {
  const slashEntry = editor.api.above({ match: { type: KEYS.slashInput } });
  if (slashEntry) {
    editor.tf.removeNodes({ at: slashEntry[1] });
  }
}

function setBlockType(editor: TPlateEditor, type: string) {
  removeSlashInput(editor);
  editor.tf.setNodes({ type }, { match: (node) => editor.api.isBlock(node) });
  editor.tf.focus();
}

function insertPlaceholderBlock(editor: TPlateEditor, label: string) {
  removeSlashInput(editor);
  editor.tf.setNodes(
    { type: KEYS.p },
    { match: (node) => editor.api.isBlock(node) },
  );
  editor.tf.insertText(`${label}: `);
  editor.tf.focus();
}

export const SLASH_COMMAND_GROUPS = ['AI', 'Basic blocks', 'Advanced', 'Inline'] as const;

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  {
    id: 'ai',
    label: 'AI',
    keywords: ['ai', 'assistant', 'generate'],
    icon: Sparkles,
    group: 'AI',
    onSelect: (editor) => insertPlaceholderBlock(editor, 'AI prompt'),
  },
  {
    id: 'text',
    label: 'Text',
    keywords: ['text', 'paragraph', 'p'],
    icon: Pilcrow,
    group: 'Basic blocks',
    onSelect: (editor) => setBlockType(editor, KEYS.p),
  },
  {
    id: 'h1',
    label: 'Heading 1',
    keywords: ['heading', 'h1', 'title'],
    icon: Heading1,
    group: 'Basic blocks',
    onSelect: (editor) => setBlockType(editor, KEYS.h1),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    keywords: ['heading', 'h2', 'subtitle'],
    icon: Heading2,
    group: 'Basic blocks',
    onSelect: (editor) => setBlockType(editor, KEYS.h2),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    keywords: ['heading', 'h3'],
    icon: Heading3,
    group: 'Basic blocks',
    onSelect: (editor) => setBlockType(editor, KEYS.h3),
  },
  {
    id: 'ul',
    label: 'Bulleted list',
    keywords: ['bullet', 'list', 'ul'],
    icon: List,
    group: 'Basic blocks',
    onSelect: (editor) => setBlockType(editor, KEYS.ul),
  },
  {
    id: 'ol',
    label: 'Numbered list',
    keywords: ['numbered', 'ordered', 'list', 'ol'],
    icon: ListOrdered,
    group: 'Basic blocks',
    onSelect: (editor) => setBlockType(editor, KEYS.ol),
  },
  {
    id: 'todo',
    label: 'To-do list',
    keywords: ['todo', 'task', 'checkbox'],
    icon: ListTodo,
    group: 'Basic blocks',
    onSelect: (editor) => setBlockType(editor, KEYS.listTodo),
  },
  {
    id: 'toc',
    label: 'Table of contents',
    keywords: ['toc', 'contents', 'table'],
    icon: TableOfContents,
    group: 'Advanced',
    onSelect: (editor) => insertPlaceholderBlock(editor, 'Table of contents'),
  },
  {
    id: 'columns',
    label: '3 columns',
    keywords: ['columns', 'layout', 'grid'],
    icon: Columns3,
    group: 'Advanced',
    onSelect: (editor) => insertPlaceholderBlock(editor, '3 columns'),
  },
  {
    id: 'equation',
    label: 'Equation',
    keywords: ['equation', 'math', 'latex'],
    icon: SquareRadical,
    group: 'Advanced',
    onSelect: (editor) => insertPlaceholderBlock(editor, 'Equation'),
  },
  {
    id: 'excalidraw',
    label: 'Excalidraw',
    keywords: ['draw', 'sketch', 'excalidraw'],
    icon: Footprints,
    group: 'Advanced',
    onSelect: (editor) => insertPlaceholderBlock(editor, 'Excalidraw'),
  },
  {
    id: 'code-drawing',
    label: 'Code Drawing',
    keywords: ['code', 'drawing', 'diagram'],
    icon: Code2,
    group: 'Advanced',
    onSelect: (editor) => insertPlaceholderBlock(editor, 'Code Drawing'),
  },
  {
    id: 'date',
    label: 'Date',
    keywords: ['date', 'calendar'],
    icon: Calendar,
    group: 'Inline',
    onSelect: (editor) => insertPlaceholderBlock(editor, 'Date'),
  },
  {
    id: 'footnote',
    label: 'Footnote',
    keywords: ['footnote', 'note', 'reference'],
    icon: Sigma,
    group: 'Inline',
    onSelect: (editor) => insertPlaceholderBlock(editor, 'Footnote'),
  },
  {
    id: 'inline-equation',
    label: 'Inline Equation',
    keywords: ['inline', 'equation', 'math'],
    icon: SquareRadical,
    group: 'Inline',
    onSelect: (editor) => insertPlaceholderBlock(editor, 'Inline equation'),
  },
];

export function filterSlashItems(query: string): SlashCommandItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return SLASH_COMMAND_ITEMS;

  return SLASH_COMMAND_ITEMS.filter((item) => {
    if (item.label.toLowerCase().includes(normalized)) return true;
    return item.keywords.some((keyword) => keyword.includes(normalized));
  });
}
