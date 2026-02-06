/**
 * Button Component
 */

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader } from './Loader';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const variantClasses = {
            primary:
                'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
            secondary:
                'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
            outline:
                'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
            ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        };

        const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader size="sm" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
