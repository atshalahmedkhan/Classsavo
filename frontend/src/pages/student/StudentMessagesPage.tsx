import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { coursesApi } from '@/api/courses';
import { ChatPanel } from '@/components/ChatPanel';
import { MessengerCharacter } from '@/components/MessengerCharacter';
import { StudentHeader } from '@/components/student/StudentHeader';
import { Card } from '@/components/ui/Card';
import { useMessages } from '@/hooks/useMessages';
import type { User } from '@/types';

function displayName(user: User): string {
  if (user.first_name) return `${user.first_name} ${user.last_name}`.trim();
  return user.username;
}

export function StudentMessagesPage() {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('user');
  const courseIdParam = searchParams.get('course');
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
      return;
    }
    if (courseIdParam) {
      coursesApi.get(Number(courseIdParam)).then((course) => {
        if (course.instructor.id === userId) {
          setResolvedUser(course.instructor);
        }
      }).catch(() => {});
    }
  }, [userIdParam, courseIdParam, conversations]);

  const selectedUser = useMemo(() => {
    if (!userIdParam) return null;
    return resolvedUser;
  }, [userIdParam, resolvedUser]);

  const courseId = courseIdParam ? Number(courseIdParam) : undefined;

  return (
    <>
      <StudentHeader title="Messages" subtitle="Chat with your instructors." />
      <main className="relative isolate flex-1 p-6">
        <div className="ghibli-message-petals" aria-hidden="true">
          <span className="ghibli-message-petal ghibli-message-petal--tl" />
          <span className="ghibli-message-petal ghibli-message-petal--tl" />
          <span className="ghibli-message-petal ghibli-message-petal--tl" />
          <span className="ghibli-message-petal ghibli-message-petal--tr" />
          <span className="ghibli-message-petal ghibli-message-petal--tr" />
          <span className="ghibli-message-petal ghibli-message-petal--tr" />
        </div>

        <div className="relative grid h-[calc(100vh-12rem)] gap-4 lg:grid-cols-3">
          <Card className="overflow-hidden border border-[#e8ddd0] shadow-sm lg:col-span-1">
            <div className="border-b border-[#e8ddd0] px-4 py-3">
              <p className="font-serif font-semibold text-[#2c1810]">Conversations</p>
            </div>
            <div className="max-h-full overflow-y-auto">
              {loading ? (
                <p className="p-4 text-sm text-[#6b5c52]">Loading...</p>
              ) : conversations.length === 0 ? (
                <p className="p-4 text-sm text-[#6b5c52]">No conversations yet.</p>
              ) : (
                conversations.map((conv) => (
                  <Link
                    key={conv.user.id}
                    to={`/student/messages?user=${conv.user.id}${conv.course_id ? `&course=${conv.course_id}` : ''}`}
                    className={`block border-b border-[#faf6f1] px-4 py-3 hover:bg-[#faf6f1] ${
                      selectedUser?.id === conv.user.id ? 'bg-[#c2622a]/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#2c1810]">{displayName(conv.user)}</p>
                        <p className="truncate text-xs text-[#6b5c52]">
                          {conv.last_message || (conv.course_title ? `Course: ${conv.course_title}` : 'No messages yet')}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="rounded-full ghibli-gradient-primary px-2 py-0.5 text-xs font-bold text-white">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          <Card className="overflow-hidden border border-[#e8ddd0] shadow-sm lg:col-span-2">
            {selectedUser ? (
              <ChatPanel
                otherUser={selectedUser}
                courseId={courseId}
                onSent={refresh}
              />
            ) : (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center border border-[#e8ddd0] bg-[#faf6f1]/30 p-8 text-center">
                <MessengerCharacter className="mb-4 h-36 w-36" />
                <p className="max-w-xs font-serif text-lg text-[#2c1810]">
                  Start a conversation with your instructor
                </p>
                <p className="mt-2 text-sm text-[#6b5c52]">
                  Select a conversation on the left, or message an instructor from a course page.
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
