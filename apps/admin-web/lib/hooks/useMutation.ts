'use client';

/**
 * useMutation Hook
 * Lightweight mutation abstraction
 */

import { useState, useCallback, useRef } from 'react';

export interface UseMutationOptions<TData, TVariables> {
    /** Called on success */
    onSuccess?: (data: TData, variables: TVariables) => void;
    /** Called on error */
    onError?: (error: Error, variables: TVariables) => void;
    /** Called on settle (success or error) */
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

export interface UseMutationResult<TData, TVariables> {
    mutate: (variables: TVariables) => void;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    data: TData | undefined;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    error: Error | null;
    reset: () => void;
}

export function useMutation<TData, TVariables = void>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
    const { onSuccess, onError, onSettled } = options;

    const [data, setData] = useState<TData | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mountedRef = useRef(true);

    const reset = useCallback(() => {
        setData(undefined);
        setIsLoading(false);
        setIsError(false);
        setIsSuccess(false);
        setError(null);
    }, []);

    const mutateAsync = useCallback(
        async (variables: TVariables): Promise<TData> => {
            setIsLoading(true);
            setIsError(false);
            setIsSuccess(false);
            setError(null);

            try {
                const result = await mutationFn(variables);

                if (mountedRef.current) {
                    setData(result);
                    setIsSuccess(true);
                    onSuccess?.(result, variables);
                    onSettled?.(result, null, variables);
                }

                return result;
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));

                if (mountedRef.current) {
                    setError(error);
                    setIsError(true);
                    onError?.(error, variables);
                    onSettled?.(undefined, error, variables);
                }

                throw error;
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        },
        [mutationFn, onSuccess, onError, onSettled]
    );

    const mutate = useCallback(
        (variables: TVariables) => {
            mutateAsync(variables).catch(() => {
                // Error handled in mutateAsync
            });
        },
        [mutateAsync]
    );

    return {
        mutate,
        mutateAsync,
        data,
        isLoading,
        isError,
        isSuccess,
        error,
        reset,
    };
}
