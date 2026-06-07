import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/Button';

const THUMBNAIL_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const THUMBNAIL_ASPECT = 16 / 9;
const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 675;

function getMimeType(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  outputWidth = THUMBNAIL_WIDTH,
  outputHeight = THUMBNAIL_HEIGHT,
  mimeType = 'image/jpeg',
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Could not get canvas context'));
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Could not create cropped image'));
        else resolve(blob);
      },
      mimeType,
      mimeType === 'image/jpeg' ? 0.92 : undefined,
    );
  });
}

interface CourseThumbnailCropModalProps {
  file: File | null;
  onClose: () => void;
  onConfirm: (file: File) => void | Promise<void>;
}

export function CourseThumbnailCropModal({ file, onClose, onConfirm }: CourseThumbnailCropModalProps) {
  const cropImageRef = useRef<HTMLImageElement>(null);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [cropping, setCropping] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) {
      setCropSourceUrl(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setError('');
      return;
    }

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!THUMBNAIL_EXTENSIONS.has(ext)) {
      setError('Only PNG, JPG, and WebP images are allowed.');
      return;
    }

    setError('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    const url = URL.createObjectURL(file);
    setCropSourceUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleClose = () => {
    if (cropping) return;
    onClose();
  };

  const onCropImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, THUMBNAIL_ASPECT, width, height),
      width,
      height,
    );
    setCrop(initialCrop);
  };

  const handleCropConfirm = async () => {
    const image = cropImageRef.current;
    const activeCrop = completedCrop;
    if (!file || !image || !activeCrop?.width || !activeCrop?.height) {
      setError('Select a crop area before continuing.');
      return;
    }

    setCropping(true);
    setError('');
    try {
      const mimeType = getMimeType(file.name);
      const blob = await getCroppedBlob(image, activeCrop, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, mimeType);
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'course-thumbnail';
      const croppedFile = new File([blob], `${baseName}-cropped${ext}`, { type: mimeType });
      await onConfirm(croppedFile);
      onClose();
    } catch {
      setError('Could not crop image. Please try again.');
    } finally {
      setCropping(false);
    }
  };

  if (!file || !cropSourceUrl) {
    return error ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
        <div className="w-full max-w-md rounded-2xl border border-[#e8ddd0] bg-white p-6 shadow-xl">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    ) : null;
  }

  return (
    <>
      <style>{`
        .thumbnail-crop-modal {
          --rc-drag-handle-bg-colour: #c2622a;
          --rc-focus-color: #c2622a;
          --rc-border-color: #c2622a;
        }
      `}</style>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-thumbnail-title"
      >
        <div className="thumbnail-crop-modal w-full max-w-3xl rounded-2xl border border-[#e8ddd0] bg-white p-6 shadow-xl">
          <h2 id="crop-thumbnail-title" className="font-serif text-xl font-semibold text-[#2c1810]">
            Crop Your Thumbnail
          </h2>
          <p className="mt-1 text-sm text-[#6b5c52]">
            Drag and resize the crop area. Output is locked to 16:9 (1200×675px).
          </p>

          <div className="mt-5 flex justify-center overflow-hidden rounded-xl border border-[#e8ddd0] bg-[#faf6f1] p-3">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              aspect={THUMBNAIL_ASPECT}
              className="max-h-[60vh]"
            >
              <img
                ref={cropImageRef}
                src={cropSourceUrl}
                alt="Crop thumbnail"
                onLoad={onCropImageLoad}
                className="max-h-[60vh] max-w-full object-contain"
              />
            </ReactCrop>
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={cropping}>
              Cancel
            </Button>
            <Button
              type="button"
              className="ghibli-gradient-primary hover:brightness-95"
              disabled={cropping || !crop}
              onClick={() => void handleCropConfirm()}
            >
              {cropping ? 'Cropping...' : 'Crop & Use'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
