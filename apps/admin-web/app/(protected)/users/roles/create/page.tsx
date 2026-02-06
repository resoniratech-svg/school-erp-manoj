'use client';

/**
 * Create Role Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Form, FormSection, FormActions } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { useMutation, useQuery } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { rolesClient, isApiError, type Permission } from '@school-erp/api-client';

export default function CreateRolePage() {
    const router = useRouter();
    const toast = useToast();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as string[],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: allPermissions } = useQuery(() => rolesClient.getPermissions());

    // Group permissions by module
    const groupedPermissions = (allPermissions ?? []).reduce((acc, perm) => {
        if (!acc[perm.module]) {
            acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const createMutation = useMutation(
        () =>
            rolesClient.create({
                name: formData.name,
                description: formData.description,
                permissions: formData.permissions,
            }),
        {
            onSuccess: (role) => {
                toast.success('Role created successfully');
                router.push(`/users/roles/${role.id}`);
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to create role');
                }
            },
        }
    );

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Role name is required';
        }
        if (formData.permissions.length === 0) {
            newErrors.permissions = 'At least one permission is required';
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

    const togglePermission = (permKey: string) => {
        // Only allow assigning permissions user has
        if (user && !user.permissions.includes(permKey)) {
            toast.error('You cannot assign permissions you do not have');
            return;
        }

        setFormData((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permKey)
                ? prev.permissions.filter((p) => p !== permKey)
                : [...prev.permissions, permKey],
        }));
    };

    const toggleModulePermissions = (module: string, perms: Permission[]) => {
        const modulePermKeys = perms.map((p) => p.key);
        const allSelected = modulePermKeys.every((k) =>
            formData.permissions.includes(k)
        );

        if (allSelected) {
            setFormData((prev) => ({
                ...prev,
                permissions: prev.permissions.filter((p) => !modulePermKeys.includes(p)),
            }));
        } else {
            const allowedPerms = modulePermKeys.filter(
                (k) => !user || user.permissions.includes(k)
            );
            setFormData((prev) => ({
                ...prev,
                permissions: [...new Set([...prev.permissions, ...allowedPerms])],
            }));
        }
    };

    return (
        <PageContent>
            <PageHeader
                title="Create Role"
                subtitle="Define a new custom role with specific permissions"
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
                    <FormSection title="Role Information">
                        <FormField
                            name="name"
                            label="Role Name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            error={errors.name}
                            required
                            placeholder="e.g., Teacher, Accountant"
                        />
                        <FormField
                            name="description"
                            label="Description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Brief description of this role"
                        />
                    </FormSection>

                    <FormSection title="Permissions">
                        {errors.permissions && (
                            <p className="col-span-2 text-sm text-red-500">
                                {errors.permissions}
                            </p>
                        )}
                        <div className="col-span-2 space-y-4">
                            {Object.entries(groupedPermissions).map(([module, perms]) => (
                                <div
                                    key={module}
                                    className="rounded-lg border border-gray-200 p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h4 className="font-medium capitalize text-gray-900">
                                            {module}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => toggleModulePermissions(module, perms)}
                                            className="text-sm text-primary-600 hover:text-primary-700"
                                        >
                                            {perms.every((p) =>
                                                formData.permissions.includes(p.key)
                                            )
                                                ? 'Deselect All'
                                                : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {perms.map((perm) => {
                                            const canAssign =
                                                !user || user.permissions.includes(perm.key);
                                            return (
                                                <label
                                                    key={perm.key}
                                                    className={`flex items-start gap-2 rounded p-2 ${canAssign
                                                            ? 'cursor-pointer hover:bg-gray-50'
                                                            : 'cursor-not-allowed opacity-50'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permissions.includes(perm.key)}
                                                        onChange={() => togglePermission(perm.key)}
                                                        disabled={!canAssign}
                                                        className="mt-1 text-primary-600"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">
                                                            {perm.name}
                                                        </p>
                                                        {perm.description && (
                                                            <p className="text-xs text-gray-500">
                                                                {perm.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
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
                            Create Role
                        </Button>
                    </FormActions>
                </Form>
            </Card>
        </PageContent>
    );
}
