import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';

export function InstructorAssignmentsPage() {
  return (
    <>
      <InstructorHeader
        title="Assignments"
        breadcrumbs={[{ label: 'Dashboard', to: '/instructor' }, { label: 'Assignments' }]}
      />
      <main className="flex-1 p-6">
        <Card className="border-[#e8ddd0] py-16 text-center shadow-sm">
          <CardTitle>Assignments coming soon</CardTitle>
          <CardDescription className="mt-2">
            Create and grade assignments for your courses. This feature will be available in a future update.
          </CardDescription>
        </Card>
      </main>
    </>
  );
}
