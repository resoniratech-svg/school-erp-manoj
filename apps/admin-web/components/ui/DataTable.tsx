'use client';

/**
 * DataTable Component
 * Generic, reusable table with loading, empty, and pagination
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader } from './Loader';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { TableIcon } from 'lucide-react';

/**
 * Column definition
 */
export interface Column<T> {
    /** Unique key for the column */
    key: string;
    /** Column header */
    header: string;
    /** Accessor function or key path */
    accessor: keyof T | ((row: T) => ReactNode);
    /** Column width */
    width?: string;
    /** Cell alignment */
    align?: 'left' | 'center' | 'right';
    /** Whether column is sortable */
    sortable?: boolean;
    /** Custom cell renderer */
    render?: (value: unknown, row: T, index: number) => ReactNode;
}

/**
 * Row action definition
 */
export interface RowAction<T> {
    label: string;
    icon?: ReactNode;
    onClick: (row: T) => void;
    /** Permission required to show action */
    permission?: string;
    /** Show condition */
    show?: (row: T) => boolean;
    /** Variant for styling */
    variant?: 'default' | 'danger';
}

/**
 * DataTable props
 */
export interface DataTableProps<T> {
    /** Table columns */
    columns: Column<T>[];
    /** Table data */
    data: T[];
    /** Unique key accessor */
    keyAccessor: keyof T | ((row: T) => string);
    /** Loading state */
    isLoading?: boolean;
    /** Row actions */
    actions?: RowAction<T>[];
    /** Empty state config */
    emptyState?: {
        title: string;
        description?: string;
    };
    /** Pagination config */
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
    /** Row click handler */
    onRowClick?: (row: T) => void;
    /** Additional class */
    className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    keyAccessor,
    isLoading = false,
    actions,
    emptyState,
    pagination,
    onRowClick,
    className,
}: DataTableProps<T>) {
    const getRowKey = (row: T, index: number): string => {
        if (typeof keyAccessor === 'function') {
            return keyAccessor(row);
        }
        return String(row[keyAccessor] ?? index);
    };

    const getCellValue = (row: T, column: Column<T>): ReactNode => {
        let value: unknown;

        if (typeof column.accessor === 'function') {
            value = column.accessor(row);
        } else {
            value = row[column.accessor];
        }

        if (column.render) {
            return column.render(value, row, 0);
        }

        if (value === null || value === undefined) {
            return <span className="text-gray-400">—</span>;
        }

        return String(value);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex min-h-[200px] items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    // Empty state
    if (data.length === 0) {
        return (
            <EmptyState
                icon={TableIcon}
                title={emptyState?.title ?? 'No data'}
                description={emptyState?.description}
            />
        );
    }

    return (
        <div className={cn('overflow-hidden rounded-lg border border-gray-200', className)}>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className={cn(
                                        'px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500',
                                        column.align === 'center' && 'text-center',
                                        column.align === 'right' && 'text-right',
                                        !column.align && 'text-left'
                                    )}
                                    style={{ width: column.width }}
                                >
                                    {column.header}
                                </th>
                            ))}
                            {actions && actions.length > 0 && (
                                <th scope="col" className="relative px-4 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {data.map((row, rowIndex) => (
                            <tr
                                key={getRowKey(row, rowIndex)}
                                className={cn(
                                    'transition-colors',
                                    onRowClick && 'cursor-pointer hover:bg-gray-50'
                                )}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={cn(
                                            'whitespace-nowrap px-4 py-3 text-sm text-gray-900',
                                            column.align === 'center' && 'text-center',
                                            column.align === 'right' && 'text-right'
                                        )}
                                    >
                                        {getCellValue(row, column)}
                                    </td>
                                ))}
                                {actions && actions.length > 0 && (
                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                        <div className="flex items-center justify-end gap-2">
                                            {actions
                                                .filter((action) => !action.show || action.show(row))
                                                .map((action, actionIndex) => (
                                                    <button
                                                        key={actionIndex}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            action.onClick(row);
                                                        }}
                                                        className={cn(
                                                            'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
                                                            action.variant === 'danger'
                                                                ? 'text-red-600 hover:bg-red-50'
                                                                : 'text-gray-600 hover:bg-gray-100'
                                                        )}
                                                    >
                                                        {action.icon}
                                                        {action.label}
                                                    </button>
                                                ))}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={pagination.onPageChange}
                    />
                </div>
            )}
        </div>
    );
}
