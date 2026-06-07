import { useRef, useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { chaptersApi } from '@/api/chapters';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/apiError';
import type { ChapterFile } from '@/types';

const ACCEPTED_EXTENSIONS = new Set(['.pdf', '.docx', '.png', '.jpg', '.jpeg']);
const ACCEPT_ATTR = '.pdf,.docx,.png,.jpg,.jpeg';
const INVALID_TYPE_MESSAGE = 'Only PDF, DOCX, PNG, and JPG files are allowed.';

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

function validateFiles(fileList: FileList | File[]): { valid: File[]; error: string | null } {
  const valid: File[] = [];
  for (const file of Array.from(fileList)) {
    if (!ACCEPTED_EXTENSIONS.has(getExtension(file.name))) {
      return { valid: [], error: INVALID_TYPE_MESSAGE };
    }
    valid.push(file);
  }
  return { valid, error: null };
}

interface ChapterFileUploadProps {
  chapterId: number;
  files: ChapterFile[];
  onFileUploaded: (file: ChapterFile) => void;
  onFileDeleted: (fileId: number) => void;
  label?: string;
}

export function ChapterFileUpload({
  chapterId,
  files,
  onFileUploaded,
  onFileDeleted,
  label = 'Chapter files',
}: ChapterFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const uploadFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;

    const { valid, error: validationError } = validateFiles(fileList);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploading(true);
    try {
      for (const file of valid) {
        const uploaded = await chaptersApi.uploadFile(chapterId, file);
        onFileUploaded(uploaded);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Upload failed. Please try again.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm('Remove this file?')) return;
    setDeletingId(fileId);
    setError('');
    try {
      await chaptersApi.deleteFile(fileId);
      onFileDeleted(fileId);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete file.'));
    } finally {
      setDeletingId(null);
    }
  };

  const openFilePicker = () => {
    if (!uploading) inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">{label}</label>
      <div
        role="button"
        tabIndex={0}
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragging ? 'border-[#c2622a] bg-[#c2622a]/5' : 'border-[#e8ddd0] bg-[#faf6f1]'
        } ${uploading ? 'pointer-events-none opacity-70' : 'cursor-pointer hover:border-primary/50'}`}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          uploadFiles(e.dataTransfer.files);
        }}
      >
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <Upload className="mx-auto mb-2 h-8 w-8 text-[#c2622a]" />
        <p className="text-sm text-muted-foreground">
          Drag and drop PDF, DOCX, PNG, or JPG here
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={uploading}
          onClick={(e) => {
            e.stopPropagation();
            openFilePicker();
          }}
        >
          {uploading ? 'Uploading...' : 'Browse files'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPT_ATTR}
          multiple
          onChange={(e) => uploadFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2"
            >
              <span className="truncate text-sm">{file.file_name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deletingId === file.id || uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.id);
                }}
                aria-label={`Delete ${file.file_name}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
