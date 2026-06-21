// Custom hooks for API data fetching

import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse, PaginatedResponse } from '../types';

// Generic hook for fetching data with loading and error states
export function useApi<T>(
  fetchFunction: () => Promise<ApiResponse<T>>,
  // dependencies: any[] = []
): {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchFunction();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchFunction]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}

// Hook for paginated data
export function usePaginatedApi<T>(
  fetchFunction: (page: number, perPage: number) => Promise<PaginatedResponse<T>>,
  initialPage: number = 1,
  initialPerPage: number = 10,
  // dependencies: any[] = []
): {
  data: T[];
  pagination: PaginatedResponse<T>['pagination'] | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  perPage: number;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  refetch: () => Promise<void>;
} {
  const [page, setPage] = useState<number>(initialPage);
  const [perPage, setPerPage] = useState<number>(initialPerPage);
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<T>['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchFunction(page, perPage);
      if (response.success) {
        setData(response.data);
        setPagination(response.pagination);
      } else {
        setError((response as any).message || 'Failed to fetch data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, page, perPage]);

  // Initial fetch and refetch on dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    isLoading,
    error,
    page,
    perPage,
    setPage,
    setPerPage,
    refetch,
  };
}

// Hook for mutable operations (POST, PUT, DELETE)
export function useMutation<T, V = unknown>(
  mutationFunction: (variables: V) => Promise<ApiResponse<T>>
): {
  mutate: (variables: V) => Promise<ApiResponse<T> | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
} {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (variables: V): Promise<ApiResponse<T> | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await mutationFunction(variables);
        setIsLoading(false);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        setIsLoading(false);
        return null;
      }
    },
    [mutationFunction]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { mutate, isLoading, error, clearError };
}

export default {
  useApi,
  usePaginatedApi,
  useMutation,
};
