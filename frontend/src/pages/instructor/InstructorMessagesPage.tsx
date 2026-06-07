import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { ChatPanel } from '@/components/ChatPanel';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { Card } from '@/components/ui/Card';
import { useMessages } from '@/hooks/useMessages';
import type { User } from '@/types';

function displayName(user: User): string {
  if (user.first_name) return `${user.first_name} ${user.last_name}`.trim();
  return user.username;
}

export function InstructorMessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdParam = searchParams.get('user');
  const { conversations, loading, refresh } = useMessages();
  const [resolvedUser, setResolvedUser] = useState<User | null>(null);

  useEffect(() => {
    if (!userIdParam) {
      setResolvedUser(null);
      return;
    }
    const userId = Number(userIdParam);
    const fromConversation = conversations.find((c) => c.user.id === userId)?.user;
    if (fromConversation) {
      setResolvedUser(fromConversation);
    } else {
      setResolvedUser({
        id: userId,
        username: `Student #${userId}`,
        email: '',
        first_name: '',
        last_name: '',
        role: 'student',
      });
    }
  }, [userIdParam, conversations]);

  const selectedUser = useMemo(() => resolvedUser, [resolvedUser]);

  const selectUser = (userId: number, courseId?: number | null) => {
    const params: Record<string, string> = { user: String(userId) };
    if (courseId) params.course = String(courseId);
    setSearchParams(params);
  };

  return (
    <>
      <InstructorHeader
        breadcrumbs={[
          { label: 'Dashboard', to: '/instructor' },
          { label: 'Messages' },
        ]}
      />
      <main className="flex-1 p-6">
        <div className="grid h-[calc(100vh-12rem)] gap-4 lg:grid-cols-3">
          <Card className="overflow-hidden border-[#e8ddd0] shadow-sm lg:col-span-1">
            <div className="border-b border-[#e8ddd0] px-4 py-3">
              <p className="font-semibold text-[#2c1810]">Student Conversations</p>
            </div>
            <div className="max-h-full overflow-y-auto">
              {loading ? (
                <p className="p-4 text-sm text-[#6b5c52]">Loading...</p>
              ) : conversations.length === 0 ? (
                <p className="p-4 text-sm text-[#6b5c52]">No student messages yet.</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.user.id}
                    type="button"
                    onClick={() => selectUser(conv.user.id, conv.course_id)}
                    className={`block w-full border-b border-[#faf6f1] px-4 py-3 text-left hover:bg-[#faf6f1] ${
                      selectedUser?.id === conv.user.id ? 'bg-[#c2622a]/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#2c1810]">{displayName(conv.user)}</p>
                        <p className="truncate text-xs text-[#6b5c52]">
                          {conv.last_message || (conv.course_title ? `Enrolled in ${conv.course_title}` : 'No messages yet')}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="rounded-full ghibli-gradient-primary px-2 py-0.5 text-xs font-bold text-white">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="overflow-hidden border-[#e8ddd0] shadow-sm lg:col-span-2">
            {selectedUser ? (
              <ChatPanel
                otherUser={selectedUser}
                courseId={searchParams.get('course') ? Number(searchParams.get('course')) : undefined}
                onSent={refresh}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <MessageCircle className="mb-3 h-10 w-10 text-[#e8ddd0]" />
                <p className="text-[#6b5c52]">Select a student conversation.</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
