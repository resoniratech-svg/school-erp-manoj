/**
 * PageContent Component
 * Main content wrapper with consistent spacing
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContentProps {
    children: ReactNode;
    className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {children}
        </div>
    );
}

/**
 * Card Component
 * Content card with optional header
 */
interface CardProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    actions?: ReactNode;
    className?: string;
}

export function Card({
    children,
    title,
    subtitle,
    actions,
    className,
}: CardProps) {
    return (
        <div className={cn('rounded-lg border border-gray-200 bg-white', className)}>
            {(title || actions) && (
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                        {title && (
                            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                        )}
                        {subtitle && (
                            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className="p-6">{children}</div>
        </div>
    );
}
