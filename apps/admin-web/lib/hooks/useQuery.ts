'use client';

/**
 * useQuery Hook
 * Lightweight data fetching abstraction
 * SSR-safe, retry support, no external dependencies
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseQueryOptions<T> {
    /** Initial data */
    initialData?: T;
    /** Enable/disable auto-fetch */
    enabled?: boolean;
    /** Retry count on failure */
    retryCount?: number;
    /** Retry delay in ms */
    retryDelay?: number;
    /** Cache key for deduplication */
    cacheKey?: string;
}

export interface UseQueryResult<T> {
    data: T | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    isRefetching: boolean;
}

export function useQuery<T>(
    queryFn: () => Promise<T>,
    options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
    const {
        initialData,
        enabled = true,
        retryCount = 0,
        retryDelay = 1000,
    } = options;

    const [data, setData] = useState<T | undefined>(initialData);
    const [isLoading, setIsLoading] = useState(enabled && !initialData);
    const [isRefetching, setIsRefetching] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const retriesRef = useRef(0);
    const mountedRef = useRef(true);

    const execute = useCallback(async (isRefetch = false) => {
        if (!enabled) return;

        if (isRefetch) {
            setIsRefetching(true);
        } else {
            setIsLoading(true);
        }
        setIsError(false);
        setError(null);

        try {
            const result = await queryFn();
            if (mountedRef.current) {
                setData(result);
                retriesRef.current = 0;
            }
        } catch (err) {
            if (mountedRef.current) {
                const error = err instanceof Error ? err : new Error(String(err));

                // Retry logic
                if (retriesRef.current < retryCount) {
                    retriesRef.current++;
                    setTimeout(() => execute(isRefetch), retryDelay);
                    return;
                }

                setError(error);
                setIsError(true);
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
                setIsRefetching(false);
            }
        }
    }, [enabled, queryFn, retryCount, retryDelay]);

    useEffect(() => {
        mountedRef.current = true;
        execute();

        return () => {
            mountedRef.current = false;
        };
    }, [execute]);

    const refetch = useCallback(async () => {
        retriesRef.current = 0;
        await execute(true);
    }, [execute]);

    return {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
    };
}
