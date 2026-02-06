'use client';

/**
 * Pagination Component
 * Reusable pagination for tables
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: PaginationProps) {
    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    // Generate page numbers to show
    const getPageNumbers = (): (number | 'ellipsis')[] => {
        const pages: (number | 'ellipsis')[] = [];
        const delta = 2;

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== 'ellipsis') {
                pages.push('ellipsis');
            }
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <nav
            className={cn('flex items-center justify-center gap-1', className)}
            aria-label="Pagination"
        >
            <button
                onClick={() => onPageChange(1)}
                disabled={!canGoPrev}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="First page"
            >
                <ChevronsLeft className="h-5 w-5" />
            </button>

            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!canGoPrev}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Previous page"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) =>
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={cn(
                                'min-w-[2rem] rounded px-2 py-1 text-sm font-medium',
                                page === currentPage
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                            aria-current={page === currentPage ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    )
                )}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!canGoNext}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Next page"
            >
                <ChevronRight className="h-5 w-5" />
            </button>

            <button
                onClick={() => onPageChange(totalPages)}
                disabled={!canGoNext}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Last page"
            >
                <ChevronsRight className="h-5 w-5" />
            </button>
        </nav>
    );
}
