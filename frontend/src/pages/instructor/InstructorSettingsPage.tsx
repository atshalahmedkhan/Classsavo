import { AccountSettingsForm } from '@/components/AccountSettingsForm';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';

export function InstructorSettingsPage() {
  return (
    <>
      <InstructorHeader
        title="Settings"
        breadcrumbs={[{ label: 'Dashboard', to: '/instructor' }, { label: 'Settings' }]}
        showSearch={false}
      />
      <main className="flex-1 p-6">
        <AccountSettingsForm roleLabel="Instructor" />
      </main>
    </>
  );
}
