'use client';

/**
 * Create User Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Form, FormSection, FormActions } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { usersClient, isApiError } from '@school-erp/api-client';

export default function CreateUserPage() {
    const router = useRouter();
    const toast = useToast();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        status: 'active' as 'active' | 'inactive',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useMutation(
        () =>
            usersClient.create({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                status: formData.status,
            }),
        {
            onSuccess: (user) => {
                toast.success('User created successfully');
                router.push(`/users/${user.id}`);
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to create user');
                }
            },
        }
    );

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            createMutation.mutate(undefined);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const { [field]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData((prev) => ({ ...prev, password }));
        setShowPassword(true);
    };

    return (
        <PageContent>
            <PageHeader
                title="Create User"
                subtitle="Add a new user to the system"
                actions={
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                }
            />

            <Card>
                <Form
                    onSubmit={handleSubmit}
                    isSubmitting={createMutation.isLoading}
                    error={createMutation.error?.message}
                >
                    <FormSection title="Basic Information">
                        <FormField
                            name="firstName"
                            label="First Name"
                            value={formData.firstName}
                            onChange={(e) => handleChange('firstName', e.target.value)}
                            error={errors.firstName}
                            required
                            placeholder="John"
                        />
                        <FormField
                            name="lastName"
                            label="Last Name"
                            value={formData.lastName}
                            onChange={(e) => handleChange('lastName', e.target.value)}
                            error={errors.lastName}
                            required
                            placeholder="Doe"
                        />
                        <FormField
                            name="email"
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            error={errors.email}
                            required
                            placeholder="john.doe@school.com"
                        />
                    </FormSection>

                    <FormSection title="Security">
                        <div className="col-span-2">
                            <FormField
                                name="password"
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                error={errors.password}
                                required
                                placeholder="••••••••"
                                rightAddon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                }
                            />
                            <button
                                type="button"
                                onClick={generatePassword}
                                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                            >
                                Generate secure password
                            </button>
                        </div>
                    </FormSection>

                    <FormSection title="Status">
                        <div className="col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Account Status
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="active"
                                        checked={formData.status === 'active'}
                                        onChange={() => handleChange('status', 'active')}
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Active</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="inactive"
                                        checked={formData.status === 'inactive'}
                                        onChange={() => handleChange('status', 'inactive')}
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Inactive</span>
                                </label>
                            </div>
                        </div>
                    </FormSection>

                    <FormActions>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={createMutation.isLoading}>
                            Create User
                        </Button>
                    </FormActions>
                </Form>
            </Card>
        </PageContent>
    );
}
