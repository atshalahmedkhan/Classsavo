import type { ReactNode } from 'react';
import type { PlateEditor, PlateElementProps } from 'platejs/react';
import { KEYS, type TComboboxInputElement } from 'platejs';
import { PlateElement } from 'platejs/react';
import {
  Calendar,
  Code2,
  Columns3,
  Footprints,
  Heading1,
  Heading2,
  Heading3,
  Info,
  List,
  ListOrdered,
  ListTodo,
  Pilcrow,
  Quote,
  Sigma,
  Sparkles,
  SquareRadical,
  Table,
  TableOfContents,
  ToggleLeft,
} from 'lucide-react';
import { insertBlock, insertFootnote, insertInlineDate, insertInlineEquationBlock, insertInlinePlaceholder } from './editor-transforms';
import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

type SlashGroup = {
  group: string;
  items: Array<{
    icon: ReactNode;
    value: string;
    label: string;
    keywords?: string[];
    focusEditor?: boolean;
    onSelect: (editor: PlateEditor) => void;
  }>;
};

function createSlashGroups(openAi: () => void): SlashGroup[] {
  return [
    {
      group: 'AI',
      items: [
        {
          icon: <Sparkles className="h-4 w-4" />,
          value: 'AI',
          label: 'AI',
          keywords: ['ai', 'assistant', 'generate'],
          focusEditor: false,
          onSelect: () => openAi(),
        },
      ],
    },
    {
      group: 'Basic blocks',
      items: [
        { icon: <Pilcrow className="h-4 w-4" />, value: KEYS.p, label: 'Text', keywords: ['paragraph'] },
        { icon: <Heading1 className="h-4 w-4" />, value: KEYS.h1, label: 'Heading 1', keywords: ['title', 'h1'] },
        { icon: <Heading2 className="h-4 w-4" />, value: KEYS.h2, label: 'Heading 2', keywords: ['subtitle', 'h2'] },
        { icon: <Heading3 className="h-4 w-4" />, value: KEYS.h3, label: 'Heading 3', keywords: ['subtitle', 'h3'] },
        { icon: <List className="h-4 w-4" />, value: KEYS.ul, label: 'Bulleted list', keywords: ['unordered', 'ul'] },
        { icon: <ListOrdered className="h-4 w-4" />, value: KEYS.ol, label: 'Numbered list', keywords: ['ordered', 'ol'] },
        { icon: <ListTodo className="h-4 w-4" />, value: KEYS.listTodo, label: 'To-do list', keywords: ['todo', 'task'] },
        { icon: <ToggleLeft className="h-4 w-4" />, value: KEYS.toggle, label: 'Toggle', keywords: ['collapse', 'accordion'] },
        { icon: <Code2 className="h-4 w-4" />, value: KEYS.codeBlock, label: 'Code Block', keywords: ['code', 'snippet'] },
        { icon: <Table className="h-4 w-4" />, value: KEYS.table, label: 'Table', keywords: ['grid', 'rows'] },
        { icon: <Quote className="h-4 w-4" />, value: KEYS.blockquote, label: 'Blockquote', keywords: ['quote'] },
        { icon: <Info className="h-4 w-4" />, value: KEYS.callout, label: 'Callout', keywords: ['note', 'info'] },
      ].map((item) => ({
        ...item,
        onSelect: (editor) => insertBlock(editor, item.value, { upsert: true }),
      })),
    },
    {
      group: 'Advanced',
      items: [
        {
          icon: <TableOfContents className="h-4 w-4" />,
          value: KEYS.toc,
          label: 'Table of contents',
          keywords: ['toc'],
          onSelect: (editor: PlateEditor) => insertBlock(editor, KEYS.toc, { upsert: true }),
        },
        { icon: <Columns3 className="h-4 w-4" />, value: KEYS.columnGroup, label: '3 columns', keywords: ['columns'], onSelect: (editor: PlateEditor) => insertBlock(editor, KEYS.columnGroup, { upsert: true }) },
        {
          icon: <SquareRadical className="h-4 w-4" />,
          value: KEYS.equation,
          label: 'Equation',
          keywords: ['math'],
          onSelect: (editor: PlateEditor) => insertBlock(editor, KEYS.equation, { upsert: true }),
        },
        { icon: <Footprints className="h-4 w-4" />, value: KEYS.excalidraw, label: 'Excalidraw', keywords: ['draw'], onSelect: (editor: PlateEditor) => insertBlock(editor, KEYS.excalidraw, { upsert: true }) },
        { icon: <Code2 className="h-4 w-4" />, value: KEYS.codeDrawing, label: 'Code Drawing', keywords: ['diagram'], onSelect: (editor: PlateEditor) => insertInlinePlaceholder(editor, 'Code Drawing') },
      ],
    },
    {
      group: 'Inline',
      items: [
        {
          icon: <Calendar className="h-4 w-4" />,
          value: KEYS.date,
          label: 'Date',
          keywords: ['calendar', 'today'],
          onSelect: (editor) => insertInlineDate(editor),
        },
        {
          icon: <Sigma className="h-4 w-4" />,
          value: KEYS.footnoteReference,
          label: 'Footnote',
          keywords: ['note'],
          onSelect: (editor) => insertFootnote(editor),
        },
        {
          icon: <SquareRadical className="h-4 w-4" />,
          value: KEYS.inlineEquation,
          label: 'Inline Equation',
          keywords: ['math'],
          onSelect: (editor) => insertInlineEquationBlock(editor),
        },
      ],
    },
  ];
}

interface SlashInputElementProps extends PlateElementProps<TComboboxInputElement> {
  openAi: () => void;
}

export function SlashInputElement({ openAi, ...props }: SlashInputElementProps) {
  const { editor, element } = props;
  const groups = createSlashGroups(openAi);

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>
              {items.map(({ focusEditor, icon, keywords, label, value, onSelect }) => (
                <InlineComboboxItem
                  key={value}
                  value={value}
                  label={label}
                  keywords={keywords}
                  focusEditor={focusEditor}
                  onClick={() => onSelect(editor)}
                >
                  {icon}
                  <span>{label}</span>
                </InlineComboboxItem>
              ))}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
