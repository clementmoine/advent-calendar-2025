import { useRef, useCallback } from 'react';

export function useSingleFire() {
  const firedRef = useRef(false);

  const fire = useCallback((cb: () => void) => {
    if (firedRef.current) return;
    firedRef.current = true;
    cb();
  }, []);

  const reset = useCallback(() => {
    firedRef.current = false;
  }, []);

  return { fire, reset, firedRef } as const;
}

export function useInputLock() {
  const lockRef = useRef(false);

  const tryLock = useCallback(() => {
    if (lockRef.current) return false;
    lockRef.current = true;
    return true;
  }, []);

  const release = useCallback(() => {
    lockRef.current = false;
  }, []);

  return { tryLock, release, lockRef } as const;
}
