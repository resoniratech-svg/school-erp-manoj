'use client';

/**
 * Protected Routes Layout
 * All routes inside (protected) use this layout
 */

import { ProtectedLayout } from '@/components/layout/ProtectedLayout';

export default function ProtectedRoutesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
