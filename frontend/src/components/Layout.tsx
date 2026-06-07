import { Link, Outlet } from 'react-router-dom';
import { BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function Layout() {
  const { user, logout, isInstructor } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to={isInstructor ? '/instructor' : '/student'} className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
            Classavo LMS
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.first_name || user?.username} ({user?.role})
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
