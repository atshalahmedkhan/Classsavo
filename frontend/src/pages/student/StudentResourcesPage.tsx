import { StudentHeader } from '@/components/student/StudentHeader';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';

export function StudentResourcesPage() {
  return (
    <>
      <StudentHeader title="Resources" subtitle="Study materials and helpful links." />
      <main className="flex-1 p-6">
        <Card className="border-[#e8ddd0] py-16 text-center shadow-sm">
          <CardTitle>Resources coming soon</CardTitle>
          <CardDescription className="mt-2">
            Additional learning resources will be available here in a future update.
          </CardDescription>
        </Card>
      </main>
    </>
  );
}
