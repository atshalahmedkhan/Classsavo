import { insertCallout } from '@platejs/callout';
import { insertEmptyCodeBlock } from '@platejs/code-block';
import { insertDate } from '@platejs/date';
import { TablePlugin } from '@platejs/table/react';
import type { PlateEditor } from 'platejs/react';
import { KEYS, PathApi, type TElement } from 'platejs';

const insertList = (editor: PlateEditor, type: string) => {
  editor.tf.insertNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    { select: true },
  );
};

const inPlaceBlockInserts = new Set<string>([KEYS.codeBlock]);

const insertBlockMap: Record<string, (editor: PlateEditor) => void> = {
  [KEYS.listTodo]: (editor) => insertList(editor, KEYS.listTodo),
  [KEYS.ol]: (editor) => insertList(editor, KEYS.ol),
  [KEYS.ul]: (editor) => insertList(editor, KEYS.ul),
  [KEYS.codeBlock]: (editor) =>
    insertEmptyCodeBlock(editor, { insertNodesOptions: { select: true } }),
  [KEYS.blockquote]: (editor) => insertBlockquote(editor),
  [KEYS.toggle]: (editor) => insertToggle(editor),
  [KEYS.table]: (editor) => insertTableBlock(editor),
  [KEYS.callout]: (editor) => insertCallout(editor, { select: true }),
};

function insertBlockquote(editor: PlateEditor) {
  editor.tf.insertNodes(
    editor.api.create.block({
      type: KEYS.blockquote,
      children: [{ text: '' }],
    }),
    { select: true },
  );
}

function insertToggle(editor: PlateEditor) {
  editor.tf.insertNodes(
    editor.api.create.block({
      type: KEYS.toggle,
      children: [editor.api.create.block({ type: KEYS.p, children: [{ text: '' }] })],
    }),
    { select: true },
  );
}

function insertTableBlock(editor: PlateEditor) {
  editor.getTransforms(TablePlugin).insert.table({ rowCount: 3, colCount: 3 }, { select: true });
}

type InsertBlockOptions = {
  upsert?: boolean;
};

export function insertBlock(
  editor: PlateEditor,
  type: string,
  options: InsertBlockOptions = {},
) {
  const { upsert = false } = options;

  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();
    if (!block) return;

    const [currentNode, path] = block;
    const isCurrentBlockEmpty = editor.api.isEmpty(currentNode);
    const currentBlockType = getBlockType(currentNode);
    const isSameBlockType = type === currentBlockType;

    if (upsert && isCurrentBlockEmpty && isSameBlockType) {
      return;
    }

    if (type in insertBlockMap) {
      insertBlockMap[type](editor);
      if (!isSameBlockType && isCurrentBlockEmpty && !inPlaceBlockInserts.has(type)) {
        editor.tf.removeNodes({ at: path });
      }
    } else if (isCurrentBlockEmpty) {
      editor.tf.setNodes({ type }, { at: path });
    } else {
      editor.tf.insertNodes(editor.api.create.block({ type }), {
        at: PathApi.next(path),
        select: true,
      });
    }

    if (!isSameBlockType && !isCurrentBlockEmpty) {
      editor.tf.removeNodes({ previousEmptyBlock: true });
    }

    editor.tf.focus();
  });
}

export function insertInlineDate(editor: PlateEditor) {
  insertDate(editor, { select: true });
  editor.tf.focus();
}

export function insertInlinePlaceholder(editor: PlateEditor, label: string) {
  editor.tf.insertText(`${label}: `);
  editor.tf.focus();
}

export function getBlockType(block: TElement) {
  if (block[KEYS.listType]) {
    if (block[KEYS.listType] === KEYS.ol) return KEYS.ol;
    if (block[KEYS.listType] === KEYS.listTodo) return KEYS.listTodo;
    return KEYS.ul;
  }
  return block.type;
}
