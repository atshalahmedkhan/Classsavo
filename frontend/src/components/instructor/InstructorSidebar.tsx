import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageCircle,
  Plus,
  Settings,
  Users,
} from 'lucide-react';
import { LumioLogo } from '@/components/LumioLogo';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/instructor', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/instructor/courses', label: 'My Courses', icon: BookOpen },
  { to: '/instructor/messages', label: 'Messages', icon: MessageCircle },
  { to: '/instructor/analytics', label: 'Student Performance', icon: BarChart3 },
  { to: '/instructor/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/instructor/settings', label: 'Settings', icon: Settings },
];

export function InstructorSidebar() {
  const { logout } = useAuth();
  const { unreadCount } = useMessages();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[#e8ddd0] bg-white">
      <div className="border-b border-[#e8ddd0] px-5 py-5">
        <LumioLogo subtitle="Instructor Portal" />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-[#c2622a] bg-[#c2622a]/10 text-[#c2622a]'
                  : 'border-transparent text-[#6b5c52] hover:bg-[#faf6f1] hover:text-[#2c1810]',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/instructor/messages' && unreadCount > 0 && (
              <span className="rounded-full bg-[#c2622a] px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-[#e8ddd0] px-3 py-4">
        <NavLink
          to="/instructor/courses/new"
          className="flex w-full items-center justify-center gap-2 rounded-full ghibli-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95"
        >
          <Plus className="h-4 w-4" />
          Create New Course
        </NavLink>
        <NavLink
          to="/instructor/students"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium',
              isActive ? 'text-[#c2622a]' : 'text-[#6b5c52] hover:text-[#2c1810]',
            )
          }
        >
          <Users className="h-4 w-4" />
          Students
        </NavLink>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#6b5c52] hover:text-[#2c1810]"
        >
          <LifeBuoy className="h-4 w-4" />
          Support
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#6b5c52] hover:text-[#2c1810]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
