import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../lib/api';

export function useTodoMutation() {
  const active = useRef(new Map<string, AbortController>());
  const mounted = useRef(true);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  useEffect(() => {
    mounted.current = true;
    const requests = active.current;
    return () => {
      mounted.current = false;
      for (const controller of requests.values()) controller.abort();
      requests.clear();
    };
  }, []);
  const run = useCallback(
    async <T>(key: string, operation: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
      if (active.current.has(key)) return null;
      const controller = new AbortController();
      active.current.set(key, controller);
      setPending([...active.current.keys()]);
      setError(null);
      try {
        const result = await operation(controller.signal);
        return mounted.current && !controller.signal.aborted ? result : null;
      } catch (failure) {
        if (mounted.current && !controller.signal.aborted)
          setError(
            failure instanceof ApiError ? failure : new ApiError('The change could not be saved.'),
          );
        return null;
      } finally {
        active.current.delete(key);
        if (mounted.current) setPending([...active.current.keys()]);
      }
    },
    [],
  );
  return { run, pending, error };
}
