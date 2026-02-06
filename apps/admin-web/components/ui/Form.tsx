'use client';

/**
 * Form Component
 * Wrapper for forms with submit handling
 */

import { type FormHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FormError } from './FormError';

export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
    /** Form children */
    children: ReactNode;
    /** Form-level error */
    error?: string | null;
    /** Is form submitting */
    isSubmitting?: boolean;
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function Form({
    children,
    error,
    isSubmitting,
    className,
    onSubmit,
    ...props
}: FormProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (isSubmitting) {
            e.preventDefault();
            return;
        }
        onSubmit?.(e);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn('space-y-4', className)}
            {...props}
        >
            <FormError error={error} />
            <fieldset disabled={isSubmitting} className="space-y-4">
                {children}
            </fieldset>
        </form>
    );
}

/**
 * FormSection Component
 * Group related form fields
 */
interface FormSectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function FormSection({
    title,
    description,
    children,
    className,
}: FormSectionProps) {
    return (
        <div className={cn('space-y-4', className)}>
            {(title || description) && (
                <div>
                    {title && (
                        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    )}
                    {description && (
                        <p className="mt-1 text-sm text-gray-500">{description}</p>
                    )}
                </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">{children}</div>
        </div>
    );
}

/**
 * FormActions Component
 * Form submit/cancel buttons
 */
interface FormActionsProps {
    children: ReactNode;
    className?: string;
}

export function FormActions({ children, className }: FormActionsProps) {
    return (
        <div className={cn('flex items-center justify-end gap-3 pt-4', className)}>
            {children}
        </div>
    );
}
