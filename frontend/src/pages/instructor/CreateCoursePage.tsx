import { useEffect, useRef, useState } from 'react';
import type { FormEvent, SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react';
import { coursesApi } from '@/api/courses';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { getApiErrorMessage } from '@/lib/apiError';
import { CourseThumbnail } from '@/components/CourseThumbnail';

const THUMBNAIL_ACCEPT = '.png,.jpg,.jpeg,.webp';
const THUMBNAIL_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const THUMBNAIL_ASPECT = 16 / 9;
const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 675;

const steps = ['Basic Info', 'Curriculum', 'Settings', 'Review'];

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

export function CreateCoursePage() {
  const navigate = useNavigate();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailDragging, setThumbnailDragging] = useState(false);
  const [thumbnailError, setThumbnailError] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [cropSourceName, setCropSourceName] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [cropping, setCropping] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    skillLevel: 'Beginner',
  });

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    };
  }, [thumbnailPreview, cropSourceUrl]);

  const setThumbnail = (file: File | null) => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    if (!file) {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      return;
    }
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!THUMBNAIL_EXTENSIONS.has(ext)) {
      setThumbnailError('Only PNG, JPG, and WebP images are allowed.');
      return;
    }
    setThumbnailError('');
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const closeCropModal = () => {
    setCropModalOpen(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCropSourceName('');
    setCropSourceUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const openCropModal = (file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!THUMBNAIL_EXTENSIONS.has(ext)) {
      setThumbnailError('Only PNG, JPG, and WebP images are allowed.');
      return;
    }
    setThumbnailError('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCropSourceName(file.name);
    setCropSourceUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setCropModalOpen(true);
  };

  const handleThumbnailSelect = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    openCropModal(fileList[0]);
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
    if (!image || !activeCrop?.width || !activeCrop?.height) {
      setThumbnailError('Select a crop area before continuing.');
      return;
    }

    setCropping(true);
    setThumbnailError('');
    try {
      const mimeType = getMimeType(cropSourceName);
      const blob = await getCroppedBlob(image, activeCrop, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, mimeType);
      const ext = cropSourceName.slice(cropSourceName.lastIndexOf('.')).toLowerCase();
      const baseName = cropSourceName.replace(/\.[^.]+$/, '') || 'course-thumbnail';
      const croppedFile = new File([blob], `${baseName}-cropped${ext}`, { type: mimeType });
      closeCropModal();
      setThumbnail(croppedFile);
    } catch {
      setThumbnailError('Could not crop image. Please try again.');
      closeCropModal();
    } finally {
      setCropping(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      const course = await coursesApi.create({
        title: form.title,
        description: form.description,
        thumbnail: thumbnailFile ?? undefined,
      });
      navigate(`/instructor/courses/${course.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create course.'));
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async (event?: FormEvent) => {
    event?.preventDefault();
    if (step === 0) {
      if (!form.title.trim() || !form.description.trim()) {
        setError('Title and description are required.');
        return;
      }
      setError('');
      setStep(1);
      return;
    }
    if (step === 1) {
      await handleCreate();
      return;
    }
    if (step < steps.length - 1) setStep(step + 1);
  };

  return (
    <>
      <InstructorHeader
        breadcrumbs={[
          { label: 'Dashboard', to: '/instructor' },
          { label: 'My Courses', to: '/instructor/courses' },
          { label: 'Create Course' },
        ]}
      />
      <main className="flex-1 p-6">
        <Link to="/instructor/courses" className="mb-4 inline-flex items-center gap-1 text-sm text-[#6b5c52] hover:text-[#c2622a]">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Link>

        <div className="mb-8 flex items-center gap-2">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  index <= step ? 'ghibli-gradient-primary text-white' : 'bg-[#e8ddd0] text-[#6b5c52]'
                }`}
              >
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`hidden text-sm sm:inline ${index === step ? 'font-semibold text-[#2c1810]' : 'text-[#6b5c52]'}`}>
                {label}
              </span>
              {index < steps.length - 1 && <div className="mx-2 hidden h-px w-8 bg-[#e8ddd0] sm:block" />}
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-[#e8ddd0] shadow-sm">
              {step === 0 && (
                <form onSubmit={handleNext} className="space-y-5">
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription className="mt-1">
                      Set the foundation for your new course by providing the essential details.
                    </CardDescription>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Course Title</label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Advanced Calculus for Engineering"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Category</label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="">Select a category</option>
                      <option value="math">Mathematics</option>
                      <option value="science">Science</option>
                      <option value="engineering">Engineering</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Skill Level</label>
                    <div className="flex gap-2">
                      {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setForm({ ...form, skillLevel: level })}
                          className={`rounded-lg px-4 py-2 text-sm font-medium ${
                            form.skillLevel === level
                              ? 'ghibli-gradient-primary text-white'
                              : 'border border-[#e8ddd0] text-[#6b5c52]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Course Description</label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe what students will learn..."
                      className="min-h-32"
                      maxLength={2000}
                      required
                    />
                    <p className="mt-1 text-right text-xs text-[#6b5c52]">{form.description.length} / 2000</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Course Thumbnail</label>
                    <div
                      role={thumbnailPreview ? undefined : 'button'}
                      tabIndex={thumbnailPreview ? undefined : 0}
                      className={`relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
                        thumbnailDragging
                          ? 'border-[#c2622a] bg-[#c2622a]/5'
                          : 'border-[#e8ddd0] hover:border-[#c2622a]/50'
                      } ${thumbnailPreview ? 'p-0' : 'p-8 text-center'}`}
                      onClick={thumbnailPreview ? undefined : () => thumbnailInputRef.current?.click()}
                      onKeyDown={
                        thumbnailPreview
                          ? undefined
                          : (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                thumbnailInputRef.current?.click();
                              }
                            }
                      }
                      onDragOver={(e) => {
                        e.preventDefault();
                        setThumbnailDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setThumbnailDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setThumbnailDragging(false);
                        handleThumbnailSelect(e.dataTransfer.files);
                      }}
                    >
                      {thumbnailPreview ? (
                        <img
                          src={thumbnailPreview}
                          alt="Course thumbnail preview"
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <>
                          <Upload className="mx-auto h-8 w-8 text-[#c2622a]" />
                          <p className="mt-2 text-sm text-[#6b5c52]">Click to upload or drag and drop</p>
                          <p className="text-xs text-[#6b5c52]">PNG, JPG or WebP (Recommended 1200x675px)</p>
                        </>
                      )}
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        className="hidden"
                        accept={THUMBNAIL_ACCEPT}
                        onChange={(e) => handleThumbnailSelect(e.target.files)}
                      />
                    </div>
                    {thumbnailPreview && (
                      <button
                        type="button"
                        className="mt-2 text-sm font-medium text-[#c2622a] underline-offset-2 hover:underline"
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        Change Image
                      </button>
                    )}
                    {thumbnailError && <p className="mt-2 text-sm text-destructive">{thumbnailError}</p>}
                  </div>
                </form>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <CardTitle>Curriculum</CardTitle>
                  <CardDescription>
                    Your course will be created and you can add chapters, upload files, and manage content on the
                    next screen.
                  </CardDescription>
                  <ul className="list-inside list-disc space-y-1 text-sm text-[#6b5c52]">
                    <li>Add chapters with the Plate.js rich text editor</li>
                    <li>Upload PDF, DOCX, and image resources</li>
                    <li>Toggle chapter visibility (public/private)</li>
                  </ul>
                </div>
              )}

              {step >= 2 && (
                <div className="space-y-4">
                  <CardTitle>Almost done!</CardTitle>
                  <CardDescription>
                    Click finish to open your course dashboard and start building curriculum.
                  </CardDescription>
                </div>
              )}

              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

              <div className="mt-6 flex justify-between border-t border-[#e8ddd0] pt-4">
                <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  {step === 0 && (
                    <Button type="button" variant="outline">
                      Save Draft
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="ghibli-gradient-primary hover:brightness-95"
                    disabled={saving}
                    onClick={() => handleNext()}
                  >
                    {saving ? 'Creating...' : step === 1 ? 'Create & Open Curriculum' : step === steps.length - 1 ? 'Finish' : 'Next'}
                    {step < 1 && <ArrowRight className="ml-1 h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <Card className="h-fit border-[#e8ddd0] bg-[#faf6f1] shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5c52]">Preview</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-[#e8ddd0] bg-white">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <CourseThumbnail className="aspect-video w-full" />
              )}
              <div className="p-4">
                <div className="flex gap-2">
                  <span className="rounded bg-[#c2622a]/10 px-2 py-0.5 text-xs text-[#c2622a]">
                    {form.category || 'Category'}
                  </span>
                  <span className="rounded bg-[#faf6f1] px-2 py-0.5 text-xs text-[#6b5c52]">{form.skillLevel}</span>
                </div>
                <p className="mt-2 font-semibold">{form.title || 'New Course Title'}</p>
                <p className="mt-1 text-sm text-[#6b5c52] line-clamp-3">
                  {form.description || 'Your course description will appear here as you type...'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {cropModalOpen && cropSourceUrl && (
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

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeCropModal} disabled={cropping}>
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
      )}
    </>
  );
}
