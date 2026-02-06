'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, User, Route as RouteIcon, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { transportClient, isApiError } from '@school-erp/api-client';

interface PageProps { params: { id: string }; }

export default function AssignmentDetailPage({ params }: PageProps) {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();

    const { data: assignment, isLoading, isError, refetch } = useQuery(() => transportClient.assignments.get(params.id));

    const deleteMutation = useMutation(() => transportClient.assignments.delete(params.id), {
        onSuccess: () => { toast.success('Assignment removed'); router.push('/transport/assignments'); },
        onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed'),
    });

    const handleDelete = async () => { if (await confirm({ title: 'Remove Assignment', message: 'Remove this student from route?', confirmLabel: 'Remove', variant: 'danger' })) deleteMutation.mutate(undefined); };

    if (isLoading) return <PageLoader />;
    if (isError || !assignment) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="transport.enabled">
            <PageContent>
                <PageHeader title="Assignment Details" actions={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        <WithPermission permission="transport_assign:delete:branch">
                            <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isLoading}><Trash2 className="mr-2 h-4 w-4" />Remove</Button>
                        </WithPermission>
                    </div>
                } />
                <Card>
                    <Badge variant={assignment.status === 'active' ? 'success' : 'default'}>{assignment.status}</Badge>
                </Card>
                <Card title="Details">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex items-start gap-3">
                            <User className="mt-1 h-5 w-5 text-gray-400" />
                            <div><p className="text-sm text-gray-500">Student</p><p className="font-medium">{assignment.student?.name ?? '—'}</p></div>
                        </div>
                        <div className="flex items-start gap-3">
                            <RouteIcon className="mt-1 h-5 w-5 text-gray-400" />
                            <div><p className="text-sm text-gray-500">Route</p><p className="font-medium">{assignment.route?.name ?? '—'}</p></div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="mt-1 h-5 w-5 text-gray-400" />
                            <div><p className="text-sm text-gray-500">Stop</p><p className="font-medium">{assignment.stop?.name ?? '—'}</p></div>
                        </div>
                    </div>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
