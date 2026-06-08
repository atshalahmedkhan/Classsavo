import { AccountSettingsForm } from '@/components/AccountSettingsForm';
import { StudentHeader } from '@/components/student/StudentHeader';

export function StudentSettingsPage() {
  return (
    <>
      <StudentHeader title="Settings" subtitle="Manage your account preferences." showSearch={false} />
      <main className="flex-1 p-6">
        <AccountSettingsForm roleLabel="Student" />
      </main>
    </>
  );
}
