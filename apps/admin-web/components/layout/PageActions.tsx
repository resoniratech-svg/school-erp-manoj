/**
 * PageActions Component
 * Right-aligned button group
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageActionsProps {
    children: ReactNode;
    className?: string;
}

export function PageActions({ children, className }: PageActionsProps) {
    return (
        <div className={cn('flex items-center gap-3', className)}>
            {children}
        </div>
    );
}
