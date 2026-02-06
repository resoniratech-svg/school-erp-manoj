'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    FileText,
    Download,
    Eye,
    CheckCircle,
    Clock,
    AlertTriangle,
    XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { useQuery } from '@/lib/hooks';
import { invoiceClient, type Invoice } from '@school-erp/api-client';

const STATUS_CONFIG: Record<
    string,
    { label: string; variant: 'success' | 'warning' | 'error' | 'default'; icon: React.ElementType }
> = {
    draft: { label: 'Draft', variant: 'default', icon: FileText },
    issued: { label: 'Issued', variant: 'warning', icon: Clock },
    paid: { label: 'Paid', variant: 'success', icon: CheckCircle },
    partially_paid: { label: 'Partial', variant: 'warning', icon: Clock },
    overdue: { label: 'Overdue', variant: 'error', icon: AlertTriangle },
    cancelled: { label: 'Cancelled', variant: 'default', icon: XCircle },
};

function formatAmount(paise: number): string {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
    const status = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
    const StatusIcon = status.icon;
    const isOverdue =
        invoice.status === 'issued' && new Date(invoice.dueAt) < new Date();

    return (
        <div className="rounded-lg border bg-white p-4 hover:border-primary-300 hover:shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`rounded-lg p-2 ${isOverdue
                            ? 'bg-red-100'
                            : invoice.status === 'paid'
                                ? 'bg-green-100'
                                : 'bg-gray-100'
                            }`}
                    >
                        <FileText
                            className={`h-5 w-5 ${isOverdue
                                ? 'text-red-600'
                                : invoice.status === 'paid'
                                    ? 'text-green-600'
                                    : 'text-gray-600'
                                }`}
                        />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                        <p className="text-sm text-gray-500">
                            {new Date(invoice.billingPeriodStart).toLocaleDateString('en-IN', {
                                month: 'short',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
                <Badge variant={isOverdue ? 'error' : status.variant}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {isOverdue ? 'Overdue' : status.label}
                </Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Subtotal</p>
                    <p className="font-medium">{formatAmount(invoice.subtotalAmount)}</p>
                </div>
                <div>
                    <p className="text-gray-500">GST</p>
                    <p className="font-medium">{formatAmount(invoice.taxAmount)}</p>
                </div>
                <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-bold text-primary-600">{formatAmount(invoice.totalAmount)}</p>
                </div>
            </div>

            {/* Tax Breakdown */}
            {invoice.taxes.length > 0 && (
                <div className="mt-3 rounded bg-gray-50 p-2 text-xs text-gray-600">
                    {invoice.taxes.map((tax) => (
                        <span key={tax.id} className="mr-3">
                            {tax.type.toUpperCase()} @ {tax.rate}%: {formatAmount(tax.amount)}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Due: {new Date(invoice.dueAt).toLocaleDateString('en-IN')}
                </div>
                <div className="flex gap-2">
                    <a
                        href={`/api/v1/invoices/${invoice.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <Download className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function InvoicesPage() {
    const { data: invoices, isLoading, isError, refetch } = useQuery(() =>
        invoiceClient.list({ limit: 50 })
    );

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    const paidTotal = invoices?.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0) || 0;
    const pendingTotal =
        invoices?.filter((i) => ['issued', 'partially_paid'].includes(i.status)).reduce((sum, i) => sum + i.totalAmount, 0) || 0;

    return (
        <WithPermission permission="invoice:read:tenant">
            <PageContent>
                <PageHeader title="Invoices" subtitle="View and download your GST invoices" />

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-100 p-3">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Paid</p>
                                <p className="text-xl font-bold text-green-600">{formatAmount(paidTotal)}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-100 p-3">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-xl font-bold text-amber-600">{formatAmount(pendingTotal)}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary-100 p-3">
                                <FileText className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Invoices</p>
                                <p className="text-xl font-bold">{invoices?.length || 0}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Invoice List */}
                {invoices && invoices.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {invoices.map((invoice) => (
                            <InvoiceCard key={invoice.id} invoice={invoice} />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold">No invoices yet</h3>
                        <p className="mt-1 text-gray-500">
                            Invoices will appear here once your subscription is billed.
                        </p>
                    </Card>
                )}
            </PageContent>
        </WithPermission>
    );
}
