import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { chaptersApi } from '@/api/chapters';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { ChapterFile } from '@/types';

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

type FileKind = 'pdf' | 'image' | 'docx' | 'other';

function getFileKind(filename: string): FileKind {
  const ext = getExtension(filename);
  if (ext === '.pdf') return 'pdf';
  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') return 'image';
  if (ext === '.docx') return 'docx';
  return 'other';
}

function getPreviewKind(file: ChapterFile): FileKind {
  const kind = getFileKind(file.file_name);
  if (kind === 'docx' && file.has_pdf_preview) return 'pdf';
  return kind;
}

interface CourseMaterialPanelProps {
  file: ChapterFile;
}

export function CourseMaterialPanel({ file }: CourseMaterialPanelProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const kind = getFileKind(file.file_name);
  const previewKind = getPreviewKind(file);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const blob = await chaptersApi.getPreviewBlob(file.id);
        url = URL.createObjectURL(blob);
        if (!revoked) setObjectUrl(url);
      } catch {
        if (!revoked) setError('Unable to load this file for preview.');
      } finally {
        if (!revoked) setLoading(false);
      }
    };

    load();

    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file.id]);

  const openInNewTab = () => {
    if (objectUrl) window.open(objectUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = () => {
    if (kind === 'docx' && file.file_url) {
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.file_name;
      link.click();
      return;
    }
    if (!objectUrl) return;
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.file_name;
    link.click();
  };

  return (
    <Card className="overflow-hidden border-[#e8ddd0] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e8ddd0] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-[#c2622a]" />
          <CardTitle className="truncate text-base">{file.file_name}</CardTitle>
        </div>
        {objectUrl && previewKind === 'pdf' && (
          <button
            type="button"
            onClick={openInNewTab}
            className="shrink-0 rounded p-1.5 text-[#6b5c52] hover:bg-[#faf6f1] hover:text-[#c2622a]"
            aria-label={`Open ${file.file_name} in new tab`}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="bg-[#faf6f1]/50 p-4">
        {loading && (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#c2622a]" />
          </div>
        )}

        {!loading && error && (
          <CardDescription className="text-destructive">{error}</CardDescription>
        )}

        {!loading && !error && objectUrl && previewKind === 'pdf' && (
          <iframe
            src={objectUrl}
            title={file.file_name}
            className="h-[600px] w-full rounded-lg border border-[#e8ddd0]"
          />
        )}

        {!loading && !error && objectUrl && previewKind === 'image' && (
          <img
            src={objectUrl}
            alt={file.file_name}
            className="max-h-[800px] w-full rounded-lg object-contain"
          />
        )}

        {!loading && !error && kind === 'docx' && !file.has_pdf_preview && (
          <div className="rounded-lg border border-[#d4845a]/30 bg-[#c2622a]/5 p-6 text-center">
            <CardDescription className="text-[#2c1810]">
              PDF preview is not available for this document yet. Download the original Word file
              to view it.
            </CardDescription>
            <Button type="button" variant="outline" className="mt-4" onClick={downloadFile}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        )}

        {!loading && !error && objectUrl && previewKind === 'other' && (
          <div className="rounded-lg border border-[#e8ddd0] bg-[#faf6f1] p-6 text-center">
            <CardDescription>Preview is not available for this file type.</CardDescription>
            <Button type="button" variant="outline" className="mt-4" onClick={downloadFile}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
