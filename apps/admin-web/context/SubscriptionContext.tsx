'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { subscriptionClient, type Subscription } from '@school-erp/api-client';

interface SubscriptionContextValue {
    subscription: Subscription | null;
    isLoading: boolean;
    error: Error | null;
    // Computed values
    status: string;
    planCode: string;
    isActive: boolean;
    isTrialing: boolean;
    isPastDue: boolean;
    isSuspended: boolean;
    trialEndsAt: Date | null;
    daysRemaining: number | null;
    // Actions
    refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSubscription = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await subscriptionClient.getCurrent();
            setSubscription(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load subscription'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, []);

    // Computed values
    const status = subscription?.status ?? 'unknown';
    const planCode = subscription?.plan?.code ?? 'FREE';
    const isActive = subscription?.isActive ?? false;
    const isTrialing = status === 'trialing';
    const isPastDue = status === 'past_due';
    const isSuspended = status === 'suspended' || status === 'cancelled';
    const trialEndsAt = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
    const daysRemaining = subscription?.trialDaysRemaining ?? null;

    const value: SubscriptionContextValue = {
        subscription,
        isLoading,
        error,
        status,
        planCode,
        isActive,
        isTrialing,
        isPastDue,
        isSuspended,
        trialEndsAt,
        daysRemaining,
        refetch: fetchSubscription,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription(): SubscriptionContextValue {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}

// Export hook for optional usage (won't throw if outside provider)
export function useSubscriptionOptional(): SubscriptionContextValue | null {
    return useContext(SubscriptionContext);
}
