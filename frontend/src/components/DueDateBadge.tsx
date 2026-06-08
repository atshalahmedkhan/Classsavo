import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  formatDueSoonDueDate,
  formatInstructorDueDate,
  formatOverdueDueDate,
  formatStudentDueDate,
  getDueDateStatus,
} from '@/lib/dueDateUtils';

interface DueDateBadgeProps {
  dueDate: string;
  variant?: 'instructor' | 'student';
  className?: string;
}

export function DueDateBadge({ dueDate, variant = 'student', className }: DueDateBadgeProps) {
  if (variant === 'instructor') {
    return (
      <Badge className={cn('bg-[#c2622a]/10 text-[#c2622a]', className)}>
        <Calendar className="mr-1 inline h-3.5 w-3.5" />
        {formatInstructorDueDate(dueDate)}
      </Badge>
    );
  }

  const status = getDueDateStatus(dueDate);

  if (status === 'overdue') {
    return (
      <Badge className={cn('bg-red-100 text-red-700', className)}>
        <Calendar className="mr-1 inline h-3.5 w-3.5" />
        {formatOverdueDueDate(dueDate)}
      </Badge>
    );
  }

  if (status === 'dueSoon') {
    return (
      <Badge className={cn('animate-pulse bg-[#c2622a]/10 text-[#c2622a]', className)}>
        <Calendar className="mr-1 inline h-3.5 w-3.5" />
        {formatDueSoonDueDate(dueDate)}
      </Badge>
    );
  }

  return (
    <Badge className={cn('bg-[#c2622a]/10 text-[#c2622a]', className)}>
      <Calendar className="mr-1 inline h-3.5 w-3.5" />
      {formatStudentDueDate(dueDate)}
    </Badge>
  );
}
