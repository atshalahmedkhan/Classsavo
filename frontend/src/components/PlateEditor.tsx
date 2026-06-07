import type { Value } from '@udecode/plate';
import { Plate, PlateContent, usePlateEditor } from '@udecode/plate/react';
import { BasicElementsPlugin } from '@udecode/plate-basic-elements/react';
import { BasicMarksPlugin } from '@udecode/plate-basic-marks/react';

const DEFAULT_VALUE: Value = [
  {
    type: 'p',
    children: [{ text: '' }],
  },
];

interface PlateEditorProps {
  value: Value;
  onChange: (value: Value) => void;
  readOnly?: boolean;
  /** Change this to reset the editor (e.g. chapter id when editing). */
  editorKey?: string | number;
}

export function PlateEditor({
  value,
  onChange,
  readOnly = false,
  editorKey = 'default',
}: PlateEditorProps) {
  const editor = usePlateEditor(
    {
      id: `plate-${editorKey}`,
      plugins: [BasicElementsPlugin, BasicMarksPlugin],
      value: value.length > 0 ? value : DEFAULT_VALUE,
    },
    [editorKey],
  );

  return (
    <div className="rounded-lg border border-[#e8ddd0] bg-white">
      <Plate
        editor={editor}
        onChange={({ value: nextValue }) => {
          if (!readOnly) {
            onChange(nextValue);
          }
        }}
      >
        <PlateContent
          readOnly={readOnly}
          className="min-h-[200px] cursor-text px-4 py-3 outline-none [&_[data-slate-editor]]:outline-none [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#2c1810] [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#2c1810] [&_h3]:text-lg [&_h3]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-[#e8ddd0] [&_blockquote]:pl-4 [&_blockquote]:italic"
          placeholder="Write chapter content..."
        />
      </Plate>
    </div>
  );
}
