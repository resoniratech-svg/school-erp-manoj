'use client';

/**
 * Protected Layout Component
 * Wraps protected pages with auth check and layout
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Loader } from '@/components/ui/Loader';
import { SubscriptionBanner } from '@/components/subscription';

interface ProtectedLayoutProps {
    children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <SubscriptionProvider>
            <div className="min-h-screen bg-gray-50">
                <SubscriptionBanner />
                <Sidebar />
                <Topbar />
                <main className="ml-64 pt-16">
                    <div className="p-6">{children}</div>
                </main>
            </div>
        </SubscriptionProvider>
    );
}

