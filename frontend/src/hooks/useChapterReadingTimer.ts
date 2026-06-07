import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Value } from '@udecode/plate';
import { progressApi } from '@/api/progress';
import { countWordsFromPlateContent, getRequiredReadSeconds } from '@/lib/readingTime';

const IDLE_TIMEOUT_MS = 30_000;
const ACTIVE_SYNC_INTERVAL = 15;

interface UseChapterReadingTimerOptions {
  chapterId: number;
  content: Value;
  contentAreaRef: RefObject<HTMLElement | null>;
  initialTimeSpent?: number;
  initialIsRead?: boolean;
  enabled?: boolean;
  onProgressUpdate?: (isRead: boolean, timeSpent: number) => void;
}

export function useChapterReadingTimer({
  chapterId,
  content,
  contentAreaRef,
  initialTimeSpent = 0,
  initialIsRead = false,
  enabled = true,
  onProgressUpdate,
}: UseChapterReadingTimerOptions) {
  const [activeSeconds, setActiveSeconds] = useState(initialTimeSpent);
  const [isRead, setIsRead] = useState(initialIsRead);
  const [isPaused, setIsPaused] = useState(document.hidden);
  const [isIdle, setIsIdle] = useState(true);

  const lastActivityRef = useRef(0);
  const totalSecondsRef = useRef(initialTimeSpent);
  const activeSinceLastSyncRef = useRef(0);
  const isReadRef = useRef(initialIsRead);
  const requiredSeconds = getRequiredReadSeconds(countWordsFromPlateContent(content));

  useEffect(() => {
    setActiveSeconds(initialTimeSpent);
    setIsRead(initialIsRead);
    totalSecondsRef.current = initialTimeSpent;
    activeSinceLastSyncRef.current = 0;
    isReadRef.current = initialIsRead;
    lastActivityRef.current = 0;
    setIsIdle(true);
  }, [chapterId, initialTimeSpent, initialIsRead]);

  const syncProgress = useCallback(async () => {
    const shouldMarkRead =
      isReadRef.current || totalSecondsRef.current >= requiredSeconds;
    if (shouldMarkRead && !isReadRef.current) {
      isReadRef.current = true;
      setIsRead(true);
    }
    try {
      await progressApi.updateChapter(chapterId, {
        time_spent_seconds: totalSecondsRef.current,
        is_read: isReadRef.current,
      });
      onProgressUpdate?.(isReadRef.current, totalSecondsRef.current);
    } catch {
      // silent background sync
    }
  }, [chapterId, onProgressUpdate, requiredSeconds]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => setIsPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled]);

  useEffect(() => {
    const el = contentAreaRef.current;
    if (!el || !enabled) return;

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      setIsIdle(false);
    };

    el.addEventListener('mousemove', onActivity);
    el.addEventListener('mousedown', onActivity);
    el.addEventListener('click', onActivity);
    el.addEventListener('keydown', onActivity);

    return () => {
      el.removeEventListener('mousemove', onActivity);
      el.removeEventListener('mousedown', onActivity);
      el.removeEventListener('click', onActivity);
      el.removeEventListener('keydown', onActivity);
    };
  }, [contentAreaRef, enabled, chapterId]);

  useEffect(() => {
    if (!enabled) return;

    const idleCheck = window.setInterval(() => {
      if (!lastActivityRef.current) {
        setIsIdle(true);
        return;
      }
      setIsIdle(Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS);
    }, 1000);

    return () => window.clearInterval(idleCheck);
  }, [enabled, chapterId]);

  const isCounting = enabled && !isPaused && !isIdle && !isReadRef.current;

  useEffect(() => {
    if (!isCounting) return;

    const tick = window.setInterval(() => {
      totalSecondsRef.current += 1;
      activeSinceLastSyncRef.current += 1;
      setActiveSeconds(totalSecondsRef.current);

      if (totalSecondsRef.current >= requiredSeconds && !isReadRef.current) {
        isReadRef.current = true;
        setIsRead(true);
      }

      if (activeSinceLastSyncRef.current >= ACTIVE_SYNC_INTERVAL) {
        activeSinceLastSyncRef.current = 0;
        syncProgress();
      }
    }, 1000);

    return () => window.clearInterval(tick);
  }, [isCounting, chapterId, requiredSeconds, syncProgress]);

  useEffect(() => {
    if (!enabled) return;
    return () => {
      syncProgress();
    };
  }, [syncProgress, chapterId, enabled]);

  return {
    activeSeconds,
    isRead,
    isPaused,
    isIdle,
    requiredSeconds,
    progressPercent: Math.min(100, Math.round((activeSeconds / requiredSeconds) * 100)),
  };
}
