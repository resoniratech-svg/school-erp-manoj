'use client';

/**
 * WithFeature Component
 * Render children only if feature is enabled
 */

import { type ReactNode } from 'react';
import { useFeatureFlags } from '@/context/FeatureFlagContext';

interface WithFeatureProps {
    /** Feature flag key */
    flag: string;
    /** Content to render if enabled */
    children: ReactNode;
    /** Fallback if disabled (defaults to null) */
    fallback?: ReactNode;
}

export function WithFeature({
    flag,
    children,
    fallback = null,
}: WithFeatureProps) {
    const { isEnabled, isLoading } = useFeatureFlags();

    // Don't render during loading
    if (isLoading) return null;

    // Check if feature is enabled
    if (!isEnabled(flag)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
