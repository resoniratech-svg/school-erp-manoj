import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { FeatureFlagProvider } from '@/context/FeatureFlagContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';

import { ApiUrlValidator } from '@/components/ApiUrlValidator';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'School ERP - Admin',
    description: 'School ERP Administration Portal',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <FeatureFlagProvider>
                        <ToastProvider>
                            <ConfirmProvider>
                                <ApiUrlValidator />
                                {children}
                            </ConfirmProvider>
                        </ToastProvider>
                    </FeatureFlagProvider>
                </AuthProvider>
            </body>
        </html>
    );
}

