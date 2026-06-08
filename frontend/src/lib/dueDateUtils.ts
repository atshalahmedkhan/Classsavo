export type DueDateStatus = 'overdue' | 'dueSoon' | 'normal';

const MS_PER_HOUR = 60 * 60 * 1000;

export function parseDueDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatShortDatePart(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function formatTimePart(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getDueDateStatus(iso: string | null | undefined): DueDateStatus | null {
  const due = parseDueDate(iso);
  if (!due) return null;

  const now = new Date();
  if (due.getTime() < now.getTime()) return 'overdue';
  if (due.getTime() - now.getTime() <= 24 * MS_PER_HOUR) return 'dueSoon';
  return 'normal';
}

export function formatInstructorDueDate(iso: string): string {
  const date = parseDueDate(iso);
  if (!date) return '';
  return `${date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })} · ${formatTimePart(date)}`;
}

export function formatStudentDueDate(iso: string): string {
  const date = parseDueDate(iso);
  if (!date) return '';
  return `Due ${formatShortDatePart(date)} · ${formatTimePart(date)}`;
}

export function formatOverdueDueDate(iso: string): string {
  const date = parseDueDate(iso);
  if (!date) return '';
  return `Overdue · ${formatShortDatePart(date)}`;
}

export function formatDueSoonDueDate(iso: string): string {
  const date = parseDueDate(iso);
  if (!date) return '';
  const now = new Date();
  if (isSameCalendarDay(date, now)) {
    return `Due Soon · Today ${formatTimePart(date)}`;
  }
  return `Due Soon · ${formatShortDatePart(date)} · ${formatTimePart(date)}`;
}

export function buildDueDateIso(
  year: number,
  month: number,
  day: number,
  hour12: number,
  minute: number,
  period: 'AM' | 'PM',
): string {
  let hour24 = hour12 % 12;
  if (period === 'PM') hour24 += 12;
  const date = new Date(year, month, day, hour24, minute, 0, 0);
  return date.toISOString();
}

export function extractDueDateParts(iso: string | null | undefined): {
  year: number;
  month: number;
  day: number;
  hour12: number;
  minute: number;
  period: 'AM' | 'PM';
} {
  const date = parseDueDate(iso) ?? new Date();
  const hours = date.getHours();
  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour12,
    minute: date.getMinutes(),
    period,
  };
}
