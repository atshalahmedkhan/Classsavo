import { useCallback, useEffect, useState } from 'react';
import { messagesApi } from '@/api/messages';
import type { Conversation } from '@/types';

export function useMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const [convs, count] = await Promise.all([
        messagesApi.listConversations(),
        messagesApi.getUnreadCount(),
      ]);
      setConversations(convs);
      setUnreadCount(count);
    } catch {
      if (!options?.silent) {
        setConversations([]);
        setUnreadCount(0);
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(() => refresh({ silent: true }), 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return { conversations, unreadCount, loading, refresh };
}
