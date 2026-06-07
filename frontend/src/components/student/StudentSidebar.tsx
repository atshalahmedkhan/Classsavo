import { Link, NavLink } from 'react-router-dom';
import {
  BookOpen,
  Compass,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  Sparkles,
} from 'lucide-react';
import { LumioLogo } from '@/components/LumioLogo';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/student/my-courses', label: 'My Courses', icon: BookOpen },
  { to: '/student/discover', label: 'Discover', icon: Compass },
  { to: '/student', label: 'Progress', icon: LayoutDashboard, end: true },
  { to: '/student/messages', label: 'Messages', icon: MessageCircle },
  { to: '/student/resources', label: 'Resources', icon: Sparkles },
  { to: '/student/settings', label: 'Settings', icon: Settings },
];

export function StudentSidebar() {
  const { logout } = useAuth();
  const { unreadCount } = useMessages();

  return (
    <aside className="sticky top-0 flex h-screen min-h-screen w-64 shrink-0 flex-col border-r border-[#e8ddd0] bg-white">
      <div className="border-b border-[#e8ddd0] px-5 py-5">
        <LumioLogo subtitle="Learning Platform" />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#c2622a]/10 text-[#c2622a]'
                  : 'text-[#6b5c52] hover:bg-[#faf6f1] hover:text-[#2c1810]',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/student/messages' && unreadCount > 0 && (
              <span className="rounded-full bg-[#c2622a] px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-[#e8ddd0] px-3 py-4">
        <Link
          to="/student/settings"
          className="flex w-full items-center justify-center rounded-full ghibli-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95"
        >
          Upgrade Plan
        </Link>
        <Link
          to="/student/help"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#6b5c52] hover:bg-[#faf6f1] hover:text-[#2c1810]"
        >
          <HelpCircle className="h-4 w-4" />
          Help Center
        </Link>
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
