import type { ReactNode } from 'react';
import { Bell, ChevronRight, HelpCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface Breadcrumb {
  label: string;
  to?: string;
}

interface InstructorHeaderProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  showSearch?: boolean;
}

export function InstructorHeader({
  title,
  breadcrumbs = [],
  actions,
  showSearch = true,
}: InstructorHeaderProps) {
  const { user } = useAuth();
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username ?? 'Instructor';

  return (
    <header className="relative z-30 border-b border-[#e8ddd0] bg-white px-6 py-4">
      <div className="ghibli-leaves opacity-40" aria-hidden="true">
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
        <span className="ghibli-leaf" />
      </div>
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {breadcrumbs.length > 0 && (
            <div className="mb-1 flex flex-wrap items-center gap-1 text-xs text-[#6b5c52]">
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {crumb.to ? (
                    <Link to={crumb.to} className="hover:text-[#c2622a]">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[#2c1810]">{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3" />}
                </span>
              ))}
            </div>
          )}
          {title && <h1 className="font-serif text-xl font-bold text-[#2c1810]">{title}</h1>}
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {showSearch && (
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b5c52]" />
              <input
                type="search"
                placeholder="Search students, courses..."
                className="w-full rounded-full border border-[#e8ddd0] bg-[#faf6f1] py-2 pl-10 pr-4 text-sm text-[#2c1810] outline-none focus:border-[#c2622a] focus:ring-2 focus:ring-[#c2622a]/20"
              />
            </div>
          )}
          {actions}
          <button type="button" className="rounded-full p-2 text-[#6b5c52] hover:bg-[#faf6f1]">
            <Bell className="h-5 w-5" />
          </button>
          <button type="button" className="rounded-full p-2 text-[#6b5c52] hover:bg-[#faf6f1]">
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-[#e8ddd0] py-1 pl-1 pr-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full ghibli-gradient-primary text-xs font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-[#2c1810]">{displayName}</p>
              <p className="text-[10px] text-[#6b5c52]">Instructor</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
