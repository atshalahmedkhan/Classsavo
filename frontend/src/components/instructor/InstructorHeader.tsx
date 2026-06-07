import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  MessageCircle,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatTimeAgo, useNotifications } from '@/hooks/useNotifications';
import type { AppNotification } from '@/types';

interface Breadcrumb {
  label: string;
  to?: string;
}

export interface InstructorSearchResult {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
}

interface InstructorHeaderProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchResults?: InstructorSearchResult[];
}

function highlightMatch(text: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return text;
  const lower = text.toLowerCase();
  const needle = trimmed.toLowerCase();
  const index = lower.indexOf(needle);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-[#c2622a]/15 text-inherit">{text.slice(index, index + trimmed.length)}</mark>
      {text.slice(index + trimmed.length)}
    </>
  );
}

function notificationIcon(type: AppNotification['notification_type']) {
  switch (type) {
    case 'new_message':
      return MessageCircle;
    case 'new_chapter':
      return BookOpen;
    case 'assignment_due':
      return ClipboardList;
    default:
      return Bell;
  }
}

export function InstructorHeader({
  title,
  breadcrumbs = [],
  actions,
  showSearch = true,
  searchPlaceholder = 'Search students, courses...',
  searchQuery,
  onSearchChange,
  searchResults = [],
}: InstructorHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const hasSearchQuery = Boolean(searchQuery?.trim());
  const showSearchDropdown = searchOpen && hasSearchQuery && Boolean(onSearchChange);

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username ?? 'Instructor';

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    if (open || searchOpen) {
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open, searchOpen]);

  const handleSearchSelect = (result: InstructorSearchResult) => {
    navigate(result.href);
    onSearchChange?.('');
    setSearchOpen(false);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    setOpen(false);

    if (notification.notification_type === 'new_message') {
      navigate('/instructor/messages');
      return;
    }
    if (notification.course_id) {
      navigate(`/instructor/courses/${notification.course_id}`);
    }
  };

  const latestNotifications = notifications.slice(0, 10);

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

        <div className="flex flex-1 items-center justify-end gap-3 overflow-visible pt-0.5">
          <div
            ref={searchRef}
            className={`relative hidden max-w-md flex-1 md:block ${showSearch ? '' : 'invisible pointer-events-none'}`}
          >
            <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#6b5c52]" />
            <input
              type={onSearchChange ? 'text' : 'search'}
              role={onSearchChange ? 'combobox' : undefined}
              aria-expanded={showSearchDropdown}
              aria-autocomplete="list"
              placeholder={searchPlaceholder}
              tabIndex={showSearch ? 0 : -1}
              aria-hidden={!showSearch}
              readOnly={!onSearchChange || !showSearch}
              {...(onSearchChange
                ? {
                    value: searchQuery ?? '',
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      onSearchChange(e.target.value);
                      setSearchOpen(true);
                    },
                    onFocus: () => setSearchOpen(true),
                  }
                : {})}
              className={`relative z-10 w-full rounded-full border border-[#e8ddd0] bg-[#faf6f1] py-2 pl-10 text-sm text-[#2c1810] outline-none focus:border-[#c2622a] focus:ring-2 focus:ring-[#c2622a]/20 ${onSearchChange && (searchQuery ?? '').length > 0 ? 'pr-10' : 'pr-4'}`}
            />
            {onSearchChange && (searchQuery ?? '').length > 0 && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  onSearchChange('');
                  setSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-0.5 text-[#6b5c52] hover:bg-[#faf6f1] hover:text-[#2c1810]"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {showSearchDropdown && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#e8ddd0] bg-white shadow-xl">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-[#6b5c52]">No results found</p>
                ) : (
                  <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
                    {searchResults.map((result) => (
                      <li key={result.id} role="option">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSearchSelect(result)}
                          className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-[#faf6f1]"
                        >
                          <span className="text-sm font-medium text-[#2c1810]">
                            {highlightMatch(result.label, searchQuery ?? '')}
                          </span>
                          {result.subtitle && (
                            <span className="truncate text-xs text-[#6b5c52]">{result.subtitle}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          {actions}
          <div className="relative overflow-visible" ref={panelRef}>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => setOpen((prev) => !prev)}
              className="relative rounded-full p-2 text-[#6b5c52] hover:bg-[#faf6f1]"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="pointer-events-none absolute -right-1 -top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#c2622a] px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-[#e8ddd0] bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#e8ddd0] px-4 py-3">
                  <p className="text-sm font-semibold text-[#2c1810]">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllRead()}
                      className="text-xs font-medium text-[#c2622a] hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {latestNotifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-[#6b5c52]">
                      No notifications yet.
                    </p>
                  ) : (
                    latestNotifications.map((notification) => {
                      const Icon = notificationIcon(notification.notification_type);
                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`flex w-full items-start gap-3 border-b border-[#faf6f1] px-4 py-3 text-left hover:bg-[#faf6f1] ${
                            !notification.is_read ? 'bg-[#c2622a]/5' : ''
                          }`}
                        >
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#c2622a]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-[#2c1810]">{notification.message}</p>
                            <p className="mt-1 text-xs text-[#6b5c52]">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c2622a]" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Help and support"
            onClick={() => navigate('/instructor/help')}
            className="rounded-full p-2 text-[#6b5c52] hover:bg-[#faf6f1]"
          >
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
