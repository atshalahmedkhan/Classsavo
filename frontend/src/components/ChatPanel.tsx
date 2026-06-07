import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { messagesApi } from '@/api/messages';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/context/AuthContext';
import type { Message, User } from '@/types';

interface ChatPanelProps {
  otherUser: User;
  courseId?: number;
  onSent?: () => void;
}

function displayName(user: User): string {
  if (user.first_name) return `${user.first_name} ${user.last_name}`.trim();
  return user.username;
}

export function ChatPanel({ otherUser, courseId, onSent }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const thread = await messagesApi.getThread(otherUser.id);
        setMessages(thread);
        await messagesApi.markRead(otherUser.id);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [otherUser.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const message = await messagesApi.send(otherUser.id, text, courseId);
      setMessages((prev) => [...prev, message]);
      setBody('');
      onSent?.();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-[400px] flex-col border border-[#e8ddd0]">
      <div className="border-b border-[#e8ddd0] px-4 py-3">
        <p className="font-serif font-semibold text-[#2c1810]">{displayName(otherUser)}</p>
        <p className="text-xs text-[#6b5c52]">{otherUser.email}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[#faf6f1]/50 p-4">
        {loading ? (
          <p className="text-sm text-[#6b5c52]">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[#6b5c52]">No messages yet. Say hello!</p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender.id === user?.id;
            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? 'rounded-br-sm bg-[#c2622a] text-white'
                      : 'rounded-bl-sm border border-[#e8ddd0] bg-[#faf6f1] text-[#2c1810]'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? 'text-white/80' : 'text-[#6b5c52]'}`}>
                    {new Date(message.created_at).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#e8ddd0] bg-white p-4">
        <div className="flex gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[44px] flex-1 resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="button"
            className="self-end"
            disabled={sending || !body.trim()}
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
