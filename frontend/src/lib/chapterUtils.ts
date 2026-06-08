import type { Chapter } from '@/types';

export function isSyllabusChapter(chapter: Chapter): boolean {
  const type = chapter.chapter_type ?? 'reading';
  return type === 'syllabus' || chapter.title.toLowerCase().includes('syllabus');
}

export function partitionChapters(chapters: Chapter[]) {
  const syllabusChapters = chapters.filter(isSyllabusChapter);
  const contentChapters = chapters.filter((ch) => !isSyllabusChapter(ch));
  return { syllabusChapters, contentChapters };
}
