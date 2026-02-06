'use client';

/**
 * Login Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isApiError } from '@school-erp/api-client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            router.push('/');
        } catch (err) {
            if (isApiError(err)) {
                setError(err.message);
            } else {
                setError('An error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left side - Branding */}
            <div className="hidden w-1/2 bg-primary-600 lg:flex lg:flex-col lg:items-center lg:justify-center">
                <GraduationCap className="h-24 w-24 text-white" />
                <h1 className="mt-6 text-4xl font-bold text-white">School ERP</h1>
                <p className="mt-2 text-lg text-primary-100">
                    Administration Portal
                </p>
            </div>

            {/* Right side - Login Form */}
            <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-8 text-center">
                        <GraduationCap className="mx-auto h-16 w-16 text-primary-600" />
                        <h1 className="mt-4 text-2xl font-bold text-gray-900">School ERP</h1>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                    <p className="mt-2 text-gray-600">Sign in to your account</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <Input
                            id="email"
                            type="email"
                            label="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@school.com"
                            required
                            autoComplete="email"
                        />

                        <Input
                            id="password"
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            isLoading={isLoading}
                        >
                            Sign in
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
