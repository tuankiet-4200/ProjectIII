import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
}

/**
 * Generic hook for API data fetching with loading/error states.
 * 
 * Usage:
 * ```tsx
 * const { data, loading, error, refetch } = useApi(() => productsService.getAll());
 * const products = data || FALLBACK_DATA;
 * ```
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  options?: { enabled?: boolean }
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await fetcher();
      setState({ data: result, loading: false, error: null });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'An error occurred';
      setState({ data: null, loading: false, error: message });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (options?.enabled === false) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    fetchData();
  }, [fetchData, options?.enabled]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Hook for mutations (create, update, delete) with loading/error states.
 * 
 * Usage:
 * ```tsx
 * const { mutate, loading, error } = useMutation((data) => productsService.create(shopId, data));
 * await mutate(productData);
 * ```
 */
export function useMutation<TData, TResult = any>(
  mutationFn: (data: TData) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: TData): Promise<TResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutationFn(data);
      setLoading(false);
      return result;
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'An error occurred';
      setError(message);
      setLoading(false);
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mutate, loading, error };
}
