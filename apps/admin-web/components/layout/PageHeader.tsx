/**
 * PageHeader Component
 * Page title, subtitle, and breadcrumb area
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    /** Page title */
    title: string;
    /** Page subtitle/description */
    subtitle?: string;
    /** Right-side actions */
    actions?: ReactNode;
    /** Additional class */
    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                'mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
                className
            )}
        >
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}
