/**
 * EmptyState Component
 */

import { type LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
}

export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12">
            <Icon className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
        </div>
    );
}
