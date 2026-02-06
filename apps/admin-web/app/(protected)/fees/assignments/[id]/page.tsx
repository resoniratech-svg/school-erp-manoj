'use client';

/**
 * Fee Assignment Detail Page
 */

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, FileText, CreditCard, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { feesClient } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    pending: 'default',
    partial: 'warning',
    paid: 'success',
    overdue: 'error',
};

export default function FeeAssignmentDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();

    const { data: assignment, isLoading, isError, refetch } = useQuery(
        () => feesClient.assignments.get(id)
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError || !assignment) {
        return <PageError onRetry={refetch} />;
    }

    const balance = assignment.totalAmount - assignment.paidAmount;

    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title="Fee Assignment Details"
                    subtitle={`Assignment #${assignment.id.slice(0, 8)}`}
                    actions={
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    }
                />

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                                {formatCurrency(assignment.totalAmount)}
                            </p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Paid</p>
                            <p className="mt-1 text-2xl font-bold text-green-600">
                                {formatCurrency(assignment.paidAmount)}
                            </p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Balance</p>
                            <p className={`mt-1 text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                {formatCurrency(balance)}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Student & Fee Info */}
                <Card title="Assignment Details">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex items-start gap-3">
                            <User className="mt-1 h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Student</p>
                                <p className="font-medium text-gray-900">{assignment.student?.name ?? '—'}</p>
                                <p className="text-sm text-gray-500">{assignment.student?.rollNumber ?? ''}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FileText className="mt-1 h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Fee Structure</p>
                                <p className="font-medium text-gray-900">{assignment.feeStructure?.name ?? '—'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <Badge variant={STATUS_VARIANTS[assignment.status] ?? 'default'} className="mt-1">
                                {assignment.status}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Due Date</p>
                            <p className="mt-1 font-medium text-gray-900">
                                {assignment.dueDate
                                    ? new Date(assignment.dueDate).toLocaleDateString()
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Payment History */}
                <Card title="Payment History">
                    {assignment.payments && assignment.payments.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {assignment.payments.map((payment: { id: string; amount: number; mode: string; receiptNumber: string; createdAt: string }) => (
                                <div key={payment.id} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {formatCurrency(payment.amount)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {payment.mode} • Receipt: {payment.receiptNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {new Date(payment.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                            <AlertCircle className="h-5 w-5" />
                            <span>No payments recorded yet</span>
                        </div>
                    )}
                </Card>

                {/* Audit Notice */}
                <Card className="border-blue-200 bg-blue-50">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <div>
                            <p className="font-medium text-blue-800">Audit Information</p>
                            <p className="mt-1 text-sm text-blue-700">
                                Fee assignments and payments are immutable records. Contact administrator for any corrections.
                            </p>
                        </div>
                    </div>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
