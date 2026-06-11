import {
  BasicBlocksPlugin,
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
import { ListPlugin } from '@platejs/list/react';
import { SlashInputPlugin, SlashPlugin } from '@platejs/slash-command/react';
import { ParagraphPlugin } from 'platejs/react';
import { SlashInputElement } from './slash-node';

export function createEditorPlugins(openAi: () => void) {
  return [
    ParagraphPlugin,
    BasicBlocksPlugin,
    H1Plugin,
    H2Plugin,
    H3Plugin,
    ListPlugin,
    BoldPlugin.configure({
      node: {
        leafProps: { className: 'font-bold' },
      },
    }),
    CodePlugin,
    ItalicPlugin,
    StrikethroughPlugin,
    SubscriptPlugin,
    SuperscriptPlugin,
    UnderlinePlugin,
    SlashPlugin,
    SlashInputPlugin.withComponent((props) => (
      <SlashInputElement {...props} openAi={openAi} />
    )),
  ];
}
