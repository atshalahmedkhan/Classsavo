import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      const loggedInUser = await login(username, password);
      navigate(loggedInUser.role === 'instructor' ? '/instructor' : '/student');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ghibli-paper relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="ghibli-leaves" aria-hidden="true">
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
      </div>
      <Card className="relative z-10 w-full max-w-md border-[#e8ddd0] shadow-sm">
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
        <CardTitle className="text-center text-2xl">Welcome back</CardTitle>
        <CardDescription className="mt-1 mb-6 text-center">
          Access your Classavo LMS account
        </CardDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2c1810]">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2c1810]">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[#6b5c52]">
          No account?{' '}
          <Link to="/register" className="font-medium text-[#c2622a] hover:underline">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}
