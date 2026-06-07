import client from '@/api/client';

let wakePromise: Promise<void> | null = null;
let lastWakeAt = 0;

const WAKE_COOLDOWN_MS = 60_000;

/** Ping the API so Render wakes before media/images are requested. */
export function wakeBackend(options?: { force?: boolean }) {
  const now = Date.now();
  if (!options?.force && now - lastWakeAt < WAKE_COOLDOWN_MS) {
    return wakePromise ?? Promise.resolve();
  }

  if (!wakePromise) {
    lastWakeAt = now;
    wakePromise = client
      .get('/')
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        wakePromise = null;
      });
  }

  return wakePromise;
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      wakeBackend({ force: true });
    }
  });
}
