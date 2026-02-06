'use client';

import { useState } from 'react';
import { Hash, AlertTriangle, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { configClient, type ConfigLimit } from '@school-erp/api-client';

const SCOPE_VARIANTS: Record<string, 'default' | 'warning' | 'info'> = { default: 'default', tenant: 'info', branch: 'warning' };

export default function LimitsPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const { data, isLoading, isError, refetch } = useQuery(() => configClient.limits.list());

    const updateMutation = useMutation(
        ({ key, value }: { key: string; value: number }) => configClient.limits.update(key, { value }),
        {
            onSuccess: () => { toast.success('Limit updated'); setEditingKey(null); refetch(); },
            onError: (e) => toast.error(e.message || 'Failed to update'),
        }
    );

    const handleEdit = (limit: ConfigLimit) => { setEditingKey(limit.key); setEditValue(String(limit.value)); };

    const handleSave = async (limit: ConfigLimit) => {
        const newValue = parseInt(editValue, 10);
        if (isNaN(newValue) || newValue < 0) { toast.error('Invalid value'); return; }
        const confirmed = await confirm({
            title: 'Update Limit',
            message: `Change "${limit.name}" from ${limit.value} to ${newValue}?${limit.scope === 'default' ? ' This will override default setting.' : ''}`,
            confirmLabel: 'Update',
            variant: 'default',
        });
        if (confirmed) updateMutation.mutate({ key: limit.key, value: newValue });
    };

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    const limits = data?.data ?? [];

    return (
        <WithPermission permission="config:read:tenant">
            <PageContent>
                <PageHeader title="System Limits" subtitle="Configure numeric limits" />
                <Card className="border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><p className="text-sm text-amber-700">Changes to limits affect system behavior. All updates require confirmation.</p></div>
                </Card>
                <Card>
                    <div className="divide-y divide-gray-200">
                        {limits.map((limit) => (
                            <div key={limit.key} className="flex items-center justify-between py-4">
                                <div className="flex items-start gap-3">
                                    <Hash className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{limit.name}</p>
                                            <Badge variant={SCOPE_VARIANTS[limit.scope] ?? 'default'}>{limit.scope}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-500">{limit.key}</p>
                                        {limit.description && <p className="mt-1 text-sm text-gray-400">{limit.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {editingKey === limit.key ? (
                                        <>
                                            <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} min={0} className="w-24 rounded-lg border border-gray-300 px-3 py-1 text-center focus:border-primary-500 focus:outline-none" />
                                            <WithPermission permission="config:update:tenant">
                                                <Button size="sm" onClick={() => handleSave(limit)} isLoading={updateMutation.isLoading}><Save className="h-4 w-4" /></Button>
                                                <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>Cancel</Button>
                                            </WithPermission>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-lg font-bold">{limit.value}</span>
                                            <WithPermission permission="config:update:tenant">
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(limit)}>Edit</Button>
                                            </WithPermission>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {limits.length === 0 && <p className="py-4 text-gray-500">No limits configured</p>}
                    </div>
                </Card>
            </PageContent>
        </WithPermission>
    );
}
