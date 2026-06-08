import { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import client from '@/api/client';
import { CardDescription } from '@/components/ui/Card';

type PreviewKind = 'pdf' | 'image' | 'other';

interface SubmissionFilePreviewProps {
  submissionId: number;
  fileType: 'submitted' | 'annotated';
  downloadLabel?: string;
  className?: string;
}

function detectKind(contentType: string, blobType: string): PreviewKind {
  const type = (contentType || blobType).toLowerCase();
  if (type.includes('pdf')) return 'pdf';
  if (type.startsWith('image/')) return 'image';
  return 'other';
}

export function SubmissionFilePreview({
  submissionId,
  fileType,
  downloadLabel = 'Download file',
  className = 'h-96',
}: SubmissionFilePreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [kind, setKind] = useState<PreviewKind>('other');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const path =
          fileType === 'annotated'
            ? `/submissions/${submissionId}/annotated-file/`
            : `/submissions/${submissionId}/submitted-file/`;
        const { data, headers } = await client.get<Blob>(path, { responseType: 'blob' });
        if (!data.size) {
          throw new Error('Empty file response');
        }
        const contentType = (headers['content-type'] as string | undefined) ?? data.type;
        url = URL.createObjectURL(data);
        if (!revoked) {
          setObjectUrl(url);
          setKind(detectKind(contentType, data.type));
        }
      } catch {
        if (!revoked) setError('Unable to load this file for preview.');
      } finally {
        if (!revoked) setLoading(false);
      }
    };

    void load();

    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [submissionId, fileType]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-[#e8ddd0] bg-[#faf6f1] ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#c2622a]" />
      </div>
    );
  }

  if (error || !objectUrl) {
    return <CardDescription className="text-destructive">{error || 'Preview unavailable.'}</CardDescription>;
  }

  return (
    <div className="space-y-3">
      {kind === 'pdf' && (
        <iframe
          src={objectUrl}
          title="Submission preview"
          className={`w-full rounded-xl border border-[#e8ddd0] bg-white ${className}`}
        />
      )}
      {kind === 'image' && (
        <img
          src={objectUrl}
          alt="Submission preview"
          className={`w-full rounded-xl border border-[#e8ddd0] object-contain ${className}`}
        />
      )}
      {kind === 'other' && (
        <div className="flex items-center gap-2 rounded-xl border border-[#e8ddd0] bg-white px-4 py-3 text-sm text-[#2c1810]">
          <FileText className="h-5 w-5 text-[#c2622a]" />
          File ready to download
        </div>
      )}
      <a
        href={objectUrl}
        download
        className="inline-flex items-center gap-1 text-sm font-medium text-[#c2622a] hover:underline"
      >
        <Download className="h-4 w-4" />
        {downloadLabel}
      </a>
    </div>
  );
}
