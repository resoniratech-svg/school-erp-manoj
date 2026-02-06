'use client';

/**
 * User Detail / Edit Page
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
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
import { usersClient, rolesClient, isApiError } from '@school-erp/api-client';

export default function UserDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const isEditMode = searchParams.get('edit') === 'true';

    const [isEditing, setIsEditing] = useState(isEditMode);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        status: 'active' as 'active' | 'inactive',
        roleIds: [] as string[],
    });

    const { data: user, isLoading, isError, refetch } = useQuery(
        () => usersClient.get(id)
    );

    const { data: rolesData } = useQuery(() => rolesClient.list({ limit: 100 }));
    const availableRoles = rolesData?.data ?? [];

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                status: user.status,
                roleIds: user.roles.map((r) => r.id),
            });
        }
    }, [user]);

    const updateMutation = useMutation(
        () =>
            usersClient.update(id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                status: formData.status,
                roleIds: formData.roleIds,
            }),
        {
            onSuccess: () => {
                toast.success('User updated successfully');
                setIsEditing(false);
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to update user');
                }
            },
        }
    );

    const deleteMutation = useMutation(
        () => usersClient.delete(id),
        {
            onSuccess: () => {
                toast.success('User deleted successfully');
                router.push('/users');
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to delete user');
                }
            },
        }
    );

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete User',
            message: `Are you sure you want to delete ${user?.firstName} ${user?.lastName}? This action cannot be undone.`,
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

    const handleChange = (field: string, value: string | string[]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleRole = (roleId: string) => {
        setFormData((prev) => ({
            ...prev,
            roleIds: prev.roleIds.includes(roleId)
                ? prev.roleIds.filter((id) => id !== roleId)
                : [...prev.roleIds, roleId],
        }));
    };

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError || !user) {
        return <PageError onRetry={refetch} />;
    }

    return (
        <PageContent>
            <PageHeader
                title={`${user.firstName} ${user.lastName}`}
                subtitle={user.email}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        {!isEditing && (
                            <WithPermission permission="user:update:tenant">
                                <Button onClick={() => setIsEditing(true)}>Edit</Button>
                            </WithPermission>
                        )}
                        <WithPermission permission="user:delete:tenant">
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                isLoading={deleteMutation.isLoading}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </WithPermission>
                    </div>
                }
            />

            {/* Status badge */}
            <Card>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <Badge variant={user.status === 'active' ? 'success' : 'default'}>
                        {user.status}
                    </Badge>
                </div>
            </Card>

            {/* User details form */}
            <Card title="User Details">
                {isEditing ? (
                    <Form
                        onSubmit={handleSubmit}
                        isSubmitting={updateMutation.isLoading}
                    >
                        <FormSection>
                            <FormField
                                name="firstName"
                                label="First Name"
                                value={formData.firstName}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                                required
                            />
                            <FormField
                                name="lastName"
                                label="Last Name"
                                value={formData.lastName}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                                required
                            />
                        </FormSection>

                        <FormSection title="Status">
                            <div className="col-span-2 flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="active"
                                        checked={formData.status === 'active'}
                                        onChange={() => handleChange('status', 'active')}
                                        className="text-primary-600"
                                    />
                                    <span className="text-sm">Active</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="inactive"
                                        checked={formData.status === 'inactive'}
                                        onChange={() => handleChange('status', 'inactive')}
                                        className="text-primary-600"
                                    />
                                    <span className="text-sm">Inactive</span>
                                </label>
                            </div>
                        </FormSection>

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
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm font-medium text-gray-500">First Name</p>
                            <p className="mt-1 text-gray-900">{user.firstName}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Last Name</p>
                            <p className="mt-1 text-gray-900">{user.lastName}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="mt-1 text-gray-900">{user.email}</p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Roles section */}
            <Card title="Assigned Roles">
                {isEditing ? (
                    <WithPermission
                        permission="role:assign:tenant"
                        fallback={
                            <div className="flex flex-wrap gap-2">
                                {user.roles.map((role) => (
                                    <Badge key={role.id}>{role.name}</Badge>
                                ))}
                            </div>
                        }
                    >
                        <div className="flex flex-wrap gap-2">
                            {availableRoles.map((role) => (
                                <label
                                    key={role.id}
                                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${formData.roleIds.includes(role.id)
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.roleIds.includes(role.id)}
                                        onChange={() => toggleRole(role.id)}
                                        className="sr-only"
                                    />
                                    {role.name}
                                </label>
                            ))}
                        </div>
                    </WithPermission>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                                <Badge key={role.id}>{role.name}</Badge>
                            ))
                        ) : (
                            <span className="text-sm text-gray-500">No roles assigned</span>
                        )}
                    </div>
                )}
            </Card>

            {/* Branches section */}
            <Card title="Assigned Branches">
                <div className="flex flex-wrap gap-2">
                    {user.branches.length > 0 ? (
                        user.branches.map((branch) => (
                            <Badge key={branch.id} variant="info">
                                {branch.name}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-sm text-gray-500">
                            Access to all branches
                        </span>
                    )}
                </div>
            </Card>
        </PageContent>
    );
}
