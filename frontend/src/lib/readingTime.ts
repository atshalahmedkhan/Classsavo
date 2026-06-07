import type { Value } from '@udecode/plate';

const WORDS_PER_MINUTE = 200;
const READ_THRESHOLD = 0.7;
const MIN_WORDS_FOR_ESTIMATE = 50;
const MIN_SECONDS_SHORT_CHAPTER = 30;

function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const record = node as Record<string, unknown>;
  if (typeof record.text === 'string') return record.text;
  if (Array.isArray(record.children)) {
    return record.children.map(extractText).join(' ');
  }
  return '';
}

export function countWordsFromPlateContent(content: Value): number {
  const text = content.map(extractText).join(' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function getEstimatedReadingSeconds(wordCount: number): number {
  if (wordCount < MIN_WORDS_FOR_ESTIMATE) return MIN_SECONDS_SHORT_CHAPTER;
  return Math.ceil((wordCount / WORDS_PER_MINUTE) * 60);
}

/** Seconds the student must spend on the page to mark chapter as read. */
export function getRequiredReadSeconds(wordCount: number): number {
  const estimated = getEstimatedReadingSeconds(wordCount);
  if (wordCount < MIN_WORDS_FOR_ESTIMATE) return MIN_SECONDS_SHORT_CHAPTER;
  return Math.ceil(estimated * READ_THRESHOLD);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}
