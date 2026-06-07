import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import type { UserRole } from '@/types';
import { getApiErrorMessage } from '@/lib/apiError';

export function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'student' as UserRole,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'instructor' ? '/instructor' : '/student'} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const newUser = await register(form);
      navigate(newUser.role === 'instructor' ? '/instructor' : '/student');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Check your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ghibli-paper relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="ghibli-leaves" aria-hidden="true">
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
      </div>
      <Card className="relative z-10 w-full max-w-lg border-[#e8ddd0] shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 shrink-0 rounded-full bg-[#c2622a]"
              style={{ boxShadow: '0 0 0 3px #faf6f1, 0 0 0 4px rgba(194, 98, 42, 0.25)' }}
            />
            <span className="font-serif text-xl font-bold text-[#2c1810]">Lumio</span>
          </div>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#d4845a]">
            Learning Platform
          </p>
        </div>
        <CardTitle className="text-center text-2xl">Create your account</CardTitle>
        <CardDescription className="mt-1 mb-6 text-center">
          Join Classavo as a student or instructor
        </CardDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#2c1810]">First name</label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#2c1810]">Last name</label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2c1810]">Username</label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2c1810]">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2c1810]">Role</label>
            <select
              className="flex h-10 w-full rounded-lg border border-[#e8ddd0] bg-[#faf6f1] px-3 text-sm text-[#2c1810] outline-none focus:border-[#c2622a] focus:ring-2 focus:ring-[#c2622a]/20"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#2c1810]">Password</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#2c1810]">Confirm password</label>
              <Input
                type="password"
                value={form.password_confirm}
                onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[#6b5c52]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#c2622a] hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
