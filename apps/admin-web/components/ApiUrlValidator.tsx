'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';

export function ApiUrlValidator() {
    const { error } = useToast();
    const hasCheckedRef = useRef(false);

    useEffect(() => {
        if (hasCheckedRef.current) return;
        hasCheckedRef.current = true;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const isProduction = process.env.NODE_ENV === 'production';

        // In production, we expect the API URL to be explicitly set
        // If it's missing, the API client defaults to localhost, which will fail
        if (isProduction && !apiUrl) {
            console.error('CRITICAL CONFIG ERROR: NEXT_PUBLIC_API_URL is not set.');
            error('Configuration Error: API URL is missing. Login will fail.', {
                duration: 10000,
                action: {
                    label: 'Details',
                    onClick: () => alert('Please set NEXT_PUBLIC_API_URL in your Vercel project settings to your backend URL.'),
                }
            });
        }

        // Just for debugging/verification in console
        console.log(`[Config] API URL: ${apiUrl || 'http://localhost:3001 (default)'}`);
        console.log(`[Config] Environment: ${process.env.NODE_ENV}`);
    }, [error]);

    return null;
}
