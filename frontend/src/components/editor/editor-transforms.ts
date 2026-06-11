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

const insertBlockMap: Record<string, (editor: PlateEditor, type: string) => void> = {
  [KEYS.listTodo]: insertList,
  [KEYS.ol]: insertList,
  [KEYS.ul]: insertList,
};

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
      insertBlockMap[type](editor, type);
      if (!isSameBlockType && isCurrentBlockEmpty) {
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
