import {
  BasicBlocksPlugin,
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react';
import {
  FontFamilyPlugin,
  TextAlignPlugin,
} from '@platejs/basic-styles/react';
import { CalloutPlugin } from '@platejs/callout/react';
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from '@platejs/code-block/react';
import { DatePlugin } from '@platejs/date/react';
import { ExcalidrawPlugin } from '@platejs/excalidraw/react';
import {
  FootnoteDefinitionPlugin,
  FootnoteReferencePlugin,
} from '@platejs/footnote/react';
import { ColumnItemPlugin, ColumnPlugin } from '@platejs/layout/react';
import { EquationPlugin, InlineEquationPlugin } from '@platejs/math/react';
import { ListPlugin } from '@platejs/list/react';
import { SlashInputPlugin, SlashPlugin } from '@platejs/slash-command/react';
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from '@platejs/table/react';
import { TocPlugin } from '@platejs/toc/react';
import { TogglePlugin } from '@platejs/toggle/react';
import { createLowlight, common } from 'lowlight';
import { KEYS } from 'platejs';
import { ParagraphPlugin } from 'platejs/react';
import { BlockquoteElement } from './nodes/blockquote-node';
import { CalloutElement } from './nodes/callout-node';
import { CodeBlockElement, CodeLineElement } from './nodes/code-block-node';
import { CodeSyntaxLeaf } from './nodes/code-syntax-leaf';
import { ColumnElement, ColumnGroupElement } from './nodes/column-node';
import { DateElement } from './nodes/date-node';
import {
  EquationElement,
  InlineEquationElement,
} from './nodes/equation-node';
import { ExcalidrawElement } from './nodes/excalidraw-node';
import {
  FootnoteDefinitionElement,
  FootnoteReferenceElement,
} from './nodes/footnote-node';
import { ParagraphElement } from './nodes/todo-list-node';
import {
  TableCellElement,
  TableElement,
  TableRowElement,
} from './nodes/table-node';
import { TocElement } from './nodes/toc-node';
import { ToggleElement } from './nodes/toggle-node';
import { SlashInputElement } from './slash-node';

const lowlight = createLowlight(common);

const textBlockTargets = [KEYS.p, KEYS.h1, KEYS.h2, KEYS.h3];

export function createEditorPlugins(openAi: () => void) {
  return [
    ParagraphPlugin.withComponent(ParagraphElement),
    BasicBlocksPlugin,
    BlockquotePlugin.withComponent(BlockquoteElement),
    H1Plugin,
    H2Plugin,
    H3Plugin,
    ListPlugin,
    CodeBlockPlugin.configure({
      options: { defaultLanguage: 'plaintext', lowlight },
      plugins: [
        CodeLinePlugin.withComponent(CodeLineElement),
        CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
      ],
    }).withComponent(CodeBlockElement),
    DatePlugin.withComponent(DateElement),
    TogglePlugin.withComponent(ToggleElement),
    TablePlugin.withComponent(TableElement),
    TableRowPlugin.withComponent(TableRowElement),
    TableCellPlugin.withComponent(TableCellElement),
    TableCellHeaderPlugin.withComponent(TableCellElement),
    CalloutPlugin.withComponent(CalloutElement),
    ColumnPlugin.configure({
      plugins: [ColumnItemPlugin.withComponent(ColumnElement)],
    }).withComponent(ColumnGroupElement),
    ExcalidrawPlugin.withComponent(ExcalidrawElement),
    TocPlugin.withComponent(TocElement),
    EquationPlugin.withComponent(EquationElement),
    InlineEquationPlugin.withComponent(InlineEquationElement),
    FootnoteDefinitionPlugin.withComponent(FootnoteDefinitionElement),
    FootnoteReferencePlugin.withComponent(FootnoteReferenceElement),
    FontFamilyPlugin,
    TextAlignPlugin.configure({
      inject: {
        nodeProps: {
          defaultNodeValue: 'start',
          nodeKey: 'align',
          styleKey: 'textAlign',
          validNodeValues: ['start', 'left', 'center', 'right', 'end', 'justify'],
        },
        targetPlugins: textBlockTargets,
      },
    }),
    BoldPlugin,
    ItalicPlugin,
    UnderlinePlugin,
    StrikethroughPlugin,
    SubscriptPlugin,
    SuperscriptPlugin,
    CodePlugin,
    SlashPlugin,
    SlashInputPlugin.withComponent((props) => (
      <SlashInputElement {...props} openAi={openAi} />
    )),
  ];
}
