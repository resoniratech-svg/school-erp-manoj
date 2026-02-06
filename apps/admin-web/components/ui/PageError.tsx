/**
 * PageError Component
 * Full-page error state with retry
 */

import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface PageErrorProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
}

export function PageError({
    title = 'Something went wrong',
    message = 'An error occurred while loading this page.',
    onRetry,
}: PageErrorProps) {
    return (
        <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                <h2 className="mt-4 text-lg font-semibold text-gray-900">{title}</h2>
                <p className="mt-2 text-sm text-gray-500">{message}</p>
                {onRetry && (
                    <Button
                        onClick={onRetry}
                        variant="outline"
                        className="mt-4"
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Try again
                    </Button>
                )}
            </div>
        </div>
    );
}
