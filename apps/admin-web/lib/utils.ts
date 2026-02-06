/**
 * Utility functions
 */

import { type ClassValue, clsx } from 'clsx';

/**
 * Merge class names
 */
export function cn(...inputs: ClassValue[]): string {
    return clsx(inputs);
}
