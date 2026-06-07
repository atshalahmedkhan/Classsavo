import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export function InstructorSettingsPage() {
  const { user } = useAuth();

  return (
    <>
      <InstructorHeader
        title="Settings"
        breadcrumbs={[{ label: 'Dashboard', to: '/instructor' }, { label: 'Settings' }]}
        showSearch={false}
      />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <Card className="border-[#e8ddd0] shadow-sm">
            <CardTitle>Profile</CardTitle>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-[#6b5c52]">Username:</span> {user?.username}</p>
              <p><span className="text-[#6b5c52]">Email:</span> {user?.email}</p>
              <p><span className="text-[#6b5c52]">Role:</span> Instructor</p>
            </div>
          </Card>
          <Card className="border-[#e8ddd0] shadow-sm">
            <CardTitle>Notifications</CardTitle>
            <CardDescription className="mt-2">
              Email notifications for new enrollments and student activity will be available soon.
            </CardDescription>
          </Card>
        </div>
      </main>
    </>
  );
}
