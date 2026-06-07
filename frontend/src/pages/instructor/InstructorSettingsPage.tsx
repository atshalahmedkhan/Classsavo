import { useEffect, useRef, useState } from 'react';
import { Check, Eye, EyeOff, Pencil, X } from 'lucide-react';
import client from '@/api/client';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/apiError';
import { normalizeMediaUrl } from '@/lib/mediaUrl';

interface ProfileUser {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar_url?: string | null;
  recovery_email?: string | null;
}

export function InstructorSettingsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySaving, setRecoverySaving] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const { data } = await client.get<ProfileUser>('/auth/me/');
        setProfile(data);
        setUsernameDraft(data.username);
        setRecoveryEmail(data.recovery_email ?? '');
      } catch {
        setProfile({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        });
        setUsernameDraft(user.username);
      }
    };
    loadProfile();
  }, [user]);

  const persistProfile = (updated: ProfileUser) => {
    setProfile(updated);
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      localStorage.setItem('user', JSON.stringify({ ...parsed, ...updated }));
    }
  };

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['png', 'jpg', 'jpeg'].includes(ext)) {
      setAvatarError('Only PNG and JPG images are allowed.');
      return;
    }

    setAvatarError('');
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await client.patch<ProfileUser>('/auth/profile/', formData);
      persistProfile(data);
    } catch (err) {
      setAvatarError(getApiErrorMessage(err, 'Unable to upload avatar.'));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUsernameSave = async () => {
    if (!usernameDraft.trim() || usernameDraft === profile?.username) {
      setEditingUsername(false);
      setUsernameDraft(profile?.username ?? '');
      return;
    }

    setUsernameError('');
    setUsernameSaving(true);
    try {
      const { data } = await client.patch<ProfileUser>('/auth/profile/', {
        username: usernameDraft.trim(),
      });
      persistProfile(data);
      setEditingUsername(false);
    } catch (err) {
      setUsernameError(getApiErrorMessage(err, 'Unable to update username.'));
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleRecoverySave = async (event: React.FormEvent) => {
    event.preventDefault();
    setRecoverySuccess('');
    setRecoveryError('');
    setRecoverySaving(true);
    try {
      const { data } = await client.patch<ProfileUser>('/auth/profile/', {
        recovery_email: recoveryEmail.trim() || null,
      });
      persistProfile(data);
      setRecoveryEmail(data.recovery_email ?? '');
      setRecoverySuccess('Recovery email saved successfully.');
    } catch (err) {
      setRecoveryError(getApiErrorMessage(err, 'Unable to save recovery email.'));
    } finally {
      setRecoverySaving(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');
    setPasswordSubmitting(true);
    try {
      await client.post('/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setPasswordSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, 'Unable to update password.'));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const displayUser = profile ?? user;
  const initial = (displayUser?.username?.[0] ?? 'L').toUpperCase();

  return (
    <>
      <InstructorHeader
        title="Settings"
        breadcrumbs={[{ label: 'Dashboard', to: '/instructor' }, { label: 'Settings' }]}
        showSearch={false}
      />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Section 1 — Profile & Avatar */}
          <Card className="border-[#e8ddd0] bg-white shadow-sm">
            <CardTitle>Profile & Avatar</CardTitle>
            <CardDescription className="mt-2">
              Update your profile photo and account details.
            </CardDescription>

            <div className="mt-6 flex flex-col items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="group relative h-28 w-28 overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-[#c2622a]/40"
                aria-label="Upload avatar"
              >
                {displayUser?.avatar_url ? (
                  <img
                    src={normalizeMediaUrl(displayUser.avatar_url)}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#c2622a] to-[#d4845a] font-serif text-4xl font-bold text-white">
                    {initial}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white transition-colors group-hover:bg-black/30">
                  {avatarUploading ? 'Uploading...' : ''}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <p className="mt-2 text-xs text-[#6b5c52]">PNG or JPG · click to upload</p>
              {avatarError && <p className="mt-2 text-sm text-destructive">{avatarError}</p>}
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <span className="text-[#6b5c52]">Username</span>
                {editingUsername ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      value={usernameDraft}
                      onChange={(e) => setUsernameDraft(e.target.value)}
                      disabled={usernameSaving}
                    />
                    <button
                      type="button"
                      onClick={handleUsernameSave}
                      disabled={usernameSaving}
                      className="rounded-lg p-2 text-[#c2622a] hover:bg-[#faf6f1]"
                      aria-label="Confirm username"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUsername(false);
                        setUsernameDraft(displayUser?.username ?? '');
                        setUsernameError('');
                      }}
                      className="rounded-lg p-2 text-[#6b5c52] hover:bg-[#faf6f1]"
                      aria-label="Cancel username edit"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-medium text-[#2c1810]">{displayUser?.username}</span>
                    <button
                      type="button"
                      onClick={() => setEditingUsername(true)}
                      className="rounded-lg p-1.5 text-[#6b5c52] hover:bg-[#faf6f1] hover:text-[#2c1810]"
                      aria-label="Edit username"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {usernameError && <p className="mt-1 text-sm text-destructive">{usernameError}</p>}
              </div>

              <p>
                <span className="text-[#6b5c52]">Email:</span>{' '}
                <span className="text-[#2c1810]">{displayUser?.email}</span>
              </p>
              <p>
                <span className="text-[#6b5c52]">Role:</span>{' '}
                <span className="capitalize text-[#2c1810]">Instructor</span>
              </p>
            </div>
          </Card>

          {/* Section 2 — Change Password */}
          <Card className="border-[#e8ddd0] bg-white shadow-sm">
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

              {passwordSuccess && <p className="text-sm text-[#5a8a5a]">{passwordSuccess}</p>}
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}

              <Button
                type="submit"
                className="rounded-full ghibli-gradient-primary hover:brightness-95"
                disabled={passwordSubmitting}
              >
                {passwordSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Card>

          {/* Section 3 — Recovery Email */}
          <Card className="border-[#e8ddd0] bg-white shadow-sm">
            <CardTitle>Recovery Email</CardTitle>
            <CardDescription className="mt-2">
              Used if you lose access to your primary email
            </CardDescription>
            <form onSubmit={handleRecoverySave} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#2c1810]">
                  Recovery Email
                </label>
                <Input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder={profile?.recovery_email ?? 'you@backup-email.com'}
                />
              </div>

              {recoverySuccess && <p className="text-sm text-[#5a8a5a]">{recoverySuccess}</p>}
              {recoveryError && <p className="text-sm text-destructive">{recoveryError}</p>}

              <Button
                type="submit"
                className="rounded-full ghibli-gradient-primary hover:brightness-95"
                disabled={recoverySaving}
              >
                {recoverySaving ? 'Saving...' : 'Save Recovery Email'}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}
