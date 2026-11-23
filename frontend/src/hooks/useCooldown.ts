import { useCallback, useEffect, useState } from 'react';

/** A simple countdown in whole seconds. `start(n)` restarts it from n. */
export function useCooldown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const start = useCallback((seconds: number) => setSecondsLeft(seconds), []);

  return { secondsLeft, start };
}