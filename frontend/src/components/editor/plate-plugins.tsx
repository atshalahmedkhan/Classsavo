import {
  BasicBlocksPlugin,
  BasicMarksPlugin,
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
import { SlashInputElement } from './SlashInputElement';

export const EDITOR_PLUGINS = [
  ParagraphPlugin,
  BasicBlocksPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ListPlugin,
  BasicMarksPlugin.configure({
    plugins: [
      BoldPlugin.configure({
        node: {
          leafProps: { className: 'font-bold' },
        },
        render: {
          leaf: ({ children, ...props }) => (
            <strong className="font-bold" {...props.attributes}>
              {children}
            </strong>
          ),
        },
      }),
      CodePlugin,
      ItalicPlugin,
      StrikethroughPlugin,
      SubscriptPlugin,
      SuperscriptPlugin,
      UnderlinePlugin,
    ],
  }),
  SlashPlugin,
  SlashInputPlugin.withComponent(SlashInputElement),
];
