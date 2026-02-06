'use client';

/**
 * Feature Flag Context
 * Provides resolved feature flags across the app
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from 'react';
import {
    loadFeatureFlags,
    isFeatureEnabled as checkFeature,
    type FeatureFlags,
    DEFAULT_FLAGS,
} from '@/lib/feature-flags';

interface FeatureFlagContextValue {
    flags: FeatureFlags;
    isLoading: boolean;
    isEnabled: (feature: string) => boolean;
    refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

interface FeatureFlagProviderProps {
    children: ReactNode;
}

export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
    const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFlags();
    }, []);

    const loadFlags = async () => {
        try {
            const loadedFlags = await loadFeatureFlags();
            setFlags(loadedFlags);
        } catch {
            setFlags(DEFAULT_FLAGS);
        } finally {
            setIsLoading(false);
        }
    };

    const isEnabled = (feature: string) => checkFeature(flags, feature);

    const refresh = async () => {
        setIsLoading(true);
        await loadFlags();
    };

    const value: FeatureFlagContextValue = {
        flags,
        isLoading,
        isEnabled,
        refresh,
    };

    return (
        <FeatureFlagContext.Provider value={value}>
            {children}
        </FeatureFlagContext.Provider>
    );
}

export function useFeatureFlags() {
    const context = useContext(FeatureFlagContext);
    if (!context) {
        throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
    }
    return context;
}
