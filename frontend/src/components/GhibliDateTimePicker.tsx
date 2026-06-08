import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  buildDueDateIso,
  extractDueDateParts,
  formatInstructorDueDate,
} from '@/lib/dueDateUtils';

interface GhibliDateTimePickerProps {
  value: string | null;
  onChange: (iso: string | null) => void;
  disabled?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; key: string }> = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ day: null, key: `empty-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, key: `day-${day}` });
  }
  return cells;
}

export function GhibliDateTimePicker({ value, onChange, disabled = false }: GhibliDateTimePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const initial = extractDueDateParts(value);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState<number | null>(initial.day);
  const [hour12, setHour12] = useState(initial.hour12);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);

  const syncDraftFromValue = () => {
    const parts = extractDueDateParts(value);
    setViewYear(parts.year);
    setViewMonth(parts.month);
    setSelectedDay(parts.day);
    setHour12(parts.hour12);
    setMinute(parts.minute);
    setPeriod(parts.period);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const today = new Date();
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const grid = getMonthGrid(viewYear, viewMonth);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleOpen = () => {
    if (disabled) return;
    syncDraftFromValue();
    setOpen(true);
  };

  const handleConfirm = () => {
    if (selectedDay === null) return;
    const iso = buildDueDateIso(viewYear, viewMonth, selectedDay, hour12, minute, period);
    onChange(iso);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  const selectClass =
    'rounded-xl border border-[#e8ddd0] bg-[#faf6f1] px-3 py-2 text-sm text-[#2c1810] outline-none focus:border-[#c2622a]';

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#c2622a]">
        Due Date
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border border-[#e8ddd0] bg-[#faf6f1] px-4 py-3 text-left transition-colors',
          'hover:border-[#c2622a]/40 focus:border-[#c2622a] focus:outline-none focus:ring-2 focus:ring-[#c2622a]/20',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-[#c2622a]" />
        {value ? (
          <span className="font-serif text-[#2c1810]">{formatInstructorDueDate(value)}</span>
        ) : (
          <span className="text-[#6b5c52]">Select due date</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-[#e8ddd0] bg-[#faf6f1] p-4 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="rounded-full p-1.5 text-[#c2622a] hover:bg-[#c2622a]/10"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <p className="font-serif text-sm font-semibold text-[#2c1810]">{monthLabel}</p>
              <button
                type="button"
                onClick={goToNextMonth}
                className="rounded-full p-1.5 text-[#c2622a] hover:bg-[#c2622a]/10"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#6b5c52]">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="mb-4 grid grid-cols-7 gap-1">
              {grid.map((cell) => {
                if (cell.day === null) {
                  return <span key={cell.key} />;
                }

                const isToday =
                  today.getFullYear() === viewYear &&
                  today.getMonth() === viewMonth &&
                  today.getDate() === cell.day;
                const isSelected = selectedDay === cell.day;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDay(cell.day!)}
                    className={cn(
                      'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors',
                      isSelected
                        ? 'bg-[#c2622a] font-semibold text-white'
                        : 'text-[#2c1810] hover:bg-[#e8ddd0]/60',
                      isToday && !isSelected && 'ring-2 ring-[#c2622a]/50 ring-offset-1 ring-offset-[#faf6f1]',
                    )}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 border-t border-[#e8ddd0] pt-4">
              <select
                value={hour12}
                onChange={(e) => setHour12(Number(e.target.value))}
                className={selectClass}
                aria-label="Hour"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-[#6b5c52]">:</span>
              <select
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
                className={selectClass}
                aria-label="Minute"
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'AM' | 'PM')}
                className={selectClass}
                aria-label="AM or PM"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="ghibli-gradient-primary hover:brightness-95"
                disabled={selectedDay === null}
                onClick={handleConfirm}
              >
                Set Due Date
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
