'use client';

/**
 * Role Detail / Edit Page
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Form, FormSection, FormActions } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { rolesClient, isApiError, type Permission } from '@school-erp/api-client';

interface RoleDetailPageProps {
    params: { id: string };
}

export default function RoleDetailPage({ params }: RoleDetailPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const { user } = useAuth();
    const isEditMode = searchParams.get('edit') === 'true';

    const [isEditing, setIsEditing] = useState(isEditMode);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as string[],
    });

    const { data: role, isLoading, isError, refetch } = useQuery(
        () => rolesClient.get(params.id)
    );

    const { data: allPermissions } = useQuery(() => rolesClient.getPermissions());

    // Group permissions by module
    const groupedPermissions = (allPermissions ?? []).reduce((acc, perm) => {
        if (!acc[perm.module]) {
            acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    useEffect(() => {
        if (role) {
            setFormData({
                name: role.name,
                description: role.description ?? '',
                permissions: role.permissions,
            });
        }
    }, [role]);

    const updateMutation = useMutation(
        () =>
            rolesClient.update(params.id, {
                name: formData.name,
                description: formData.description,
                permissions: formData.permissions,
            }),
        {
            onSuccess: () => {
                toast.success('Role updated successfully');
                setIsEditing(false);
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to update role');
                }
            },
        }
    );

    const deleteMutation = useMutation(
        () => rolesClient.delete(params.id),
        {
            onSuccess: () => {
                toast.success('Role deleted successfully');
                router.push('/users/roles');
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to delete role');
                }
            },
        }
    );

    const handleDelete = async () => {
        if (role?.type === 'system') {
            toast.error('System roles cannot be deleted');
            return;
        }

        const confirmed = await confirm({
            title: 'Delete Role',
            message: `Are you sure you want to delete the "${role?.name}" role? Users with this role will lose these permissions.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            deleteMutation.mutate(undefined);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(undefined);
    };

    const togglePermission = (permKey: string) => {
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

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError || !role) {
        return <PageError onRetry={refetch} />;
    }

    const isSystemRole = role.type === 'system';

    return (
        <PageContent>
            <PageHeader
                title={role.name}
                subtitle={role.description ?? 'No description'}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        {!isEditing && !isSystemRole && (
                            <WithPermission permission="role:update:tenant">
                                <Button onClick={() => setIsEditing(true)}>Edit</Button>
                            </WithPermission>
                        )}
                        {!isSystemRole && (
                            <WithPermission permission="role:delete:tenant">
                                <Button
                                    variant="danger"
                                    onClick={handleDelete}
                                    isLoading={deleteMutation.isLoading}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </WithPermission>
                        )}
                    </div>
                }
            />

            {/* Role info */}
            <Card>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{role.name}</span>
                    </div>
                    <Badge variant={isSystemRole ? 'info' : 'default'}>
                        {role.type}
                    </Badge>
                    {isSystemRole && (
                        <span className="text-sm text-gray-500">
                            System roles cannot be modified
                        </span>
                    )}
                </div>
            </Card>

            {/* Permissions */}
            <Card title={`Permissions (${role.permissions.length})`}>
                {isEditing && !isSystemRole ? (
                    <Form onSubmit={handleSubmit} isSubmitting={updateMutation.isLoading}>
                        <FormSection>
                            <FormField
                                name="name"
                                label="Role Name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                required
                            />
                            <FormField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                                }
                            />
                        </FormSection>

                        <div className="space-y-4">
                            {Object.entries(groupedPermissions).map(([module, perms]) => (
                                <div
                                    key={module}
                                    className="rounded-lg border border-gray-200 p-4"
                                >
                                    <h4 className="mb-3 font-medium capitalize text-gray-900">
                                        {module}
                                    </h4>
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
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <FormActions>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={updateMutation.isLoading}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </FormActions>
                    </Form>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedPermissions).map(([module, perms]) => {
                            const modulePerms = perms.filter((p) =>
                                role.permissions.includes(p.key)
                            );
                            if (modulePerms.length === 0) return null;

                            return (
                                <div key={module}>
                                    <h4 className="mb-2 text-sm font-medium capitalize text-gray-700">
                                        {module}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {modulePerms.map((perm) => (
                                            <Badge key={perm.key}>{perm.name}</Badge>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </PageContent>
    );
}
