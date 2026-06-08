import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import type { FirstChapter } from '@/types';

interface StartCourseCardProps {
  courseId: number;
  firstChapter: FirstChapter;
}

export function StartCourseCard({ courseId, firstChapter }: StartCourseCardProps) {
  const buttonLabel =
    firstChapter.type === 'assignment' ? 'Go to First Assignment' : 'Go to First Reading';

  return (
    <Card className="mt-8 border-[#e8ddd0] bg-[#faf6f1] shadow-sm">
      <div className="p-6 text-center">
        <CardTitle className="font-serif text-2xl text-[#2c1810]">Ready to begin?</CardTitle>
        <CardDescription className="mt-2 text-base text-[#6b5c52]">
          Your first chapter: <span className="font-medium text-[#2c1810]">{firstChapter.title}</span>
        </CardDescription>
        <Link
          to={`/student/courses/${courseId}/chapters/${firstChapter.chapter_id}`}
          className="mt-5 inline-block"
        >
          <Button className="ghibli-gradient-primary hover:brightness-95">
            {buttonLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
