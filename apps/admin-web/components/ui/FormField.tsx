'use client';

/**
 * FormField Component
 * Unified form field with label, input, and error
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Field label */
    label: string;
    /** Field name (required) */
    name: string;
    /** Error message */
    error?: string;
    /** Help text */
    helpText?: string;
    /** Whether field is required */
    required?: boolean;
    /** Input type override */
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time';
    /** Left addon */
    leftAddon?: ReactNode;
    /** Right addon */
    rightAddon?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
    (
        {
            className,
            label,
            name,
            error,
            helpText,
            required,
            type = 'text',
            leftAddon,
            rightAddon,
            disabled,
            ...props
        },
        ref
    ) => {
        const inputId = `field-${name}`;
        const errorId = `${inputId}-error`;
        const helpId = `${inputId}-help`;

        return (
            <div className={cn('w-full', className)}>
                <label
                    htmlFor={inputId}
                    className="mb-1 block text-sm font-medium text-gray-700"
                >
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </label>

                <div className="relative">
                    {leftAddon && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            {leftAddon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        name={name}
                        type={type}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={error ? errorId : helpText ? helpId : undefined}
                        className={cn(
                            'block w-full rounded-lg border px-4 py-2 text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
                            error
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
                            disabled && 'cursor-not-allowed bg-gray-50 text-gray-500',
                            leftAddon && 'pl-10',
                            rightAddon && 'pr-10'
                        )}
                        {...props}
                    />

                    {rightAddon && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {rightAddon}
                        </div>
                    )}
                </div>

                {error && (
                    <p id={errorId} className="mt-1 text-sm text-red-500">
                        {error}
                    </p>
                )}

                {helpText && !error && (
                    <p id={helpId} className="mt-1 text-sm text-gray-500">
                        {helpText}
                    </p>
                )}
            </div>
        );
    }
);

FormField.displayName = 'FormField';
