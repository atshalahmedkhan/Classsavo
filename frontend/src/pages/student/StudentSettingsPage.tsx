import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/api/auth';
import { StudentHeader } from '@/components/student/StudentHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/apiError';

export function StudentSettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess('');
    setError('');
    setSubmitting(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <StudentHeader title="Settings" subtitle="Manage your account preferences." showSearch={false} />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <Card className="border-[#e8ddd0] shadow-sm">
            <CardTitle>Profile</CardTitle>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-[#6b5c52]">Username:</span> {user?.username}</p>
              <p><span className="text-[#6b5c52]">Email:</span> {user?.email}</p>
              <p><span className="text-[#6b5c52]">Role:</span> Student</p>
            </div>
          </Card>

          <Card className="border-[#e8ddd0] shadow-sm">
            <CardTitle>Change Password</CardTitle>
            <CardDescription className="mt-2">
              Update your account password. New password must be at least 8 characters.
            </CardDescription>
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#2c1810]">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b5c52] hover:text-[#2c1810]"
                    onClick={() => setShowCurrent((prev) => !prev)}
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#2c1810]">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b5c52] hover:text-[#2c1810]"
                    onClick={() => setShowNew((prev) => !prev)}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#2c1810]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b5c52] hover:text-[#2c1810]"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {success && <p className="text-sm text-[#5a8a5a]">{success}</p>}
              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="ghibli-gradient-primary hover:brightness-95"
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Card>

          <Card className="border-[#e8ddd0] shadow-sm">
            <CardTitle>Notifications</CardTitle>
            <CardDescription className="mt-2">
              Use the bell icon in the header to view course updates, messages, and assignment reminders.
            </CardDescription>
          </Card>
        </div>
      </main>
    </>
  );
}
