import type { Value } from 'platejs';
import { PlateEditor } from './PlateEditor';

interface PlateViewerProps {
  content: Value;
  editorKey?: string | number;
}

export function PlateViewer({ content, editorKey = 'viewer' }: PlateViewerProps) {
  return (
    <div className="prose max-w-none">
      <PlateEditor
        editorKey={editorKey}
        value={content}
        onChange={() => {}}
        readOnly
      />
    </div>
  );
}
