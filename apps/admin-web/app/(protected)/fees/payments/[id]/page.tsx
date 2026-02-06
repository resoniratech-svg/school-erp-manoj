'use client';

/**
 * Payment Detail Page (READ-ONLY)
 * CRITICAL: No edit/delete functionality - immutable record
 */

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CreditCard, User, FileText, Lock, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { feesClient } from '@school-erp/api-client';

const MODE_LABELS: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    online: 'Online',
};

export default function PaymentDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();

    const { data: payment, isLoading, isError, refetch } = useQuery(
        () => feesClient.payments.get(id)
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

    if (isError || !payment) {
        return <PageError onRetry={refetch} />;
    }

    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title="Payment Receipt"
                    subtitle={`Receipt #${payment.receiptNumber}`}
                    actions={
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button variant="outline" onClick={() => window.print()}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>
                        </div>
                    }
                />

                {/* Immutable Notice */}
                <Card className="border-blue-200 bg-blue-50">
                    <div className="flex items-start gap-3">
                        <Lock className="h-5 w-5 text-blue-600" />
                        <div>
                            <p className="font-medium text-blue-800">Immutable Record</p>
                            <p className="mt-1 text-sm text-blue-700">
                                This payment record cannot be modified or deleted.
                                For corrections, contact your system administrator.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Receipt Card */}
                <Card className="print:border-2 print:border-black">
                    <div className="border-b border-gray-200 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Receipt Number</p>
                                <p className="text-2xl font-bold font-mono text-primary-600">
                                    {payment.receiptNumber}
                                </p>
                            </div>
                            <Badge
                                variant={payment.status === 'completed' ? 'success' : 'default'}
                                className="text-lg px-4 py-2"
                            >
                                {payment.status}
                            </Badge>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        {/* Student Info */}
                        <div className="flex items-start gap-3">
                            <User className="mt-1 h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Student</p>
                                <p className="font-medium text-gray-900">{payment.student?.name ?? '—'}</p>
                                <p className="text-sm text-gray-500">{payment.student?.rollNumber ?? ''}</p>
                            </div>
                        </div>

                        {/* Fee Info */}
                        <div className="flex items-start gap-3">
                            <FileText className="mt-1 h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Fee</p>
                                <p className="font-medium text-gray-900">{payment.feeAssignment?.feeStructure?.name ?? '—'}</p>
                            </div>
                        </div>

                        {/* Payment Mode */}
                        <div className="flex items-start gap-3">
                            <CreditCard className="mt-1 h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Payment Mode</p>
                                <p className="font-medium text-gray-900">
                                    {MODE_LABELS[payment.mode] ?? payment.mode}
                                </p>
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <p className="text-sm text-gray-500">Payment Date</p>
                            <p className="font-medium text-gray-900">
                                {new Date(payment.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="mt-8 rounded-lg bg-gray-50 p-6 text-center">
                        <p className="text-sm text-gray-500">Amount Paid</p>
                        <p className="mt-1 text-4xl font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                        </p>
                    </div>

                    {/* Reference */}
                    {payment.referenceNumber && (
                        <div className="mt-6 border-t border-gray-200 pt-4">
                            <p className="text-sm text-gray-500">Reference Number</p>
                            <p className="font-mono text-gray-900">{payment.referenceNumber}</p>
                        </div>
                    )}
                </Card>

                {/* Audit Trail */}
                <Card title="Audit Information">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-gray-500">Created At</p>
                            <p className="font-medium text-gray-900">
                                {new Date(payment.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Created By</p>
                            <p className="font-medium text-gray-900">{payment.createdBy ?? 'System'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Record ID</p>
                            <p className="font-mono text-sm text-gray-600">{payment.id}</p>
                        </div>
                    </div>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
