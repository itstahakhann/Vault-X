/**
 * Auto-lock after a period of inactivity.
 *
 * SECURITY: On timeout, invokes the lock callback, which clears the
 * in-memory key and decrypted payload.
 */

import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'focus',
];

export function useAutoLock(
  enabled: boolean,
  timeoutMinutes: number | null,
  onLock: () => void
): void {
  const timerRef = useRef<number | null>(null);
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  useEffect(() => {
    if (!enabled || timeoutMinutes == null || timeoutMinutes <= 0) return;

    const timeoutMs = timeoutMinutes * 60_000;

    const reset = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        onLockRef.current();
      }, timeoutMs);
    };

    const onVisibility = () => {
      // If the tab is hidden, keep the timer running but reset on return.
      reset();
    };

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, reset, { passive: true })
    );
    document.addEventListener('visibilitychange', onVisibility);
    reset();

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, timeoutMinutes]);
}