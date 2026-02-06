/**
 * FormError Component
 * Display form-level errors
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
    error?: string | null;
    className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
    if (!error) return null;

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600',
                className
            )}
            role="alert"
        >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
        </div>
    );
}
