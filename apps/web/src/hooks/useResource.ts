import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, request } from '../lib/api';

export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  const active = useRef<AbortController | null>(null);
  const reload = useCallback(() => {
    sequence.current++;
    active.current?.abort();
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    const current = ++sequence.current;
    const controller = new AbortController();
    active.current = controller;
    if (!path) {
      setData(null);
      setError(null);
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    setError(null);
    request<T>(path, { signal: controller.signal })
      .then((result) => {
        if (current === sequence.current && !controller.signal.aborted) setData(result);
      })
      .catch((failure: unknown) => {
        if (current === sequence.current && !controller.signal.aborted)
          setError(
            failure instanceof ApiError ? failure : new ApiError('Could not load this page.'),
          );
      })
      .finally(() => {
        if (current === sequence.current && !controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, revision]);
  return { data, error, loading, reload };
}
