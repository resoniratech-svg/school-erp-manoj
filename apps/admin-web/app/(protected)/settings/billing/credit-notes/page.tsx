'use client';

import {
    FileText,
    Download,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    ArrowDownCircle,
    XCircle,
    DollarSign,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { useQuery } from '@/lib/hooks';
import { creditNoteClient, type CreditNote } from '@school-erp/api-client';

const REASON_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    overbilling: { label: 'Overbilling', icon: AlertCircle, color: 'text-red-600' },
    plan_downgrade: { label: 'Plan Downgrade', icon: ArrowDownCircle, color: 'text-amber-600' },
    refund: { label: 'Refund', icon: RefreshCw, color: 'text-blue-600' },
    gst_correction: { label: 'GST Correction', icon: DollarSign, color: 'text-purple-600' },
    cancellation: { label: 'Cancellation', icon: XCircle, color: 'text-gray-600' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
    issued: { label: 'Issued', variant: 'warning' },
    applied: { label: 'Applied', variant: 'success' },
};

function formatAmount(paise: number): string {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function CreditNoteCard({ note }: { note: CreditNote }) {
    const reason = REASON_CONFIG[note.reason] || REASON_CONFIG.overbilling;
    const status = STATUS_CONFIG[note.status] || STATUS_CONFIG.issued;
    const ReasonIcon = reason.icon;

    return (
        <div className="rounded-lg border bg-white p-4 hover:border-red-200 hover:shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2">
                        <ReasonIcon className={`h-5 w-5 ${reason.color}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{note.creditNumber}</h3>
                        <p className="text-sm text-gray-500">{reason.label}</p>
                    </div>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Subtotal</p>
                    <p className="font-medium text-red-600">-{formatAmount(note.subtotal)}</p>
                </div>
                <div>
                    <p className="text-gray-500">GST</p>
                    <p className="font-medium text-red-600">-{formatAmount(note.taxAmount)}</p>
                </div>
                <div>
                    <p className="text-gray-500">Total Credit</p>
                    <p className="font-bold text-red-600">-{formatAmount(note.totalAmount)}</p>
                </div>
            </div>

            {/* Tax Breakdown */}
            {note.taxes.length > 0 && (
                <div className="mt-3 rounded bg-red-50 p-2 text-xs text-red-700">
                    {note.taxes.map((tax) => (
                        <span key={tax.id} className="mr-3">
                            {tax.taxType.toUpperCase()} @ {tax.rate}%: -{formatAmount(tax.amount)}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    Issued: {new Date(note.issuedAt).toLocaleDateString('en-IN')}
                </p>
                <a
                    href={`/api/v1/credit-notes/${note.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                    <Download className="h-4 w-4" />
                </a>
            </div>
        </div>
    );
}

export default function CreditNotesPage() {
    const { data: notes, isLoading, isError, refetch } = useQuery(() =>
        creditNoteClient.list({ limit: 50 })
    );

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    const totalCredits = notes?.reduce((sum, n) => sum + n.totalAmount, 0) || 0;

    return (
        <WithPermission permission="credit_note:read:tenant">
            <PageContent>
                <PageHeader
                    title="Credit Notes"
                    subtitle="GST-compliant billing adjustments"
                />

                {/* Info Banner */}
                <Card className="border-amber-200 bg-amber-50">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800">Important</p>
                            <p className="text-sm text-amber-700">
                                Credit Notes are legal GST documents and cannot be modified or deleted after creation.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Summary */}
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-red-100 p-3">
                            <FileText className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Credits Issued</p>
                            <p className="text-2xl font-bold text-red-600">-{formatAmount(totalCredits)}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-sm text-gray-500">Credit Notes</p>
                            <p className="text-2xl font-bold">{notes?.length || 0}</p>
                        </div>
                    </div>
                </Card>

                {/* Credit Notes List */}
                {notes && notes.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {notes.map((note) => (
                            <CreditNoteCard key={note.id} note={note} />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                        <h3 className="mt-4 text-lg font-semibold">No credit notes</h3>
                        <p className="mt-1 text-gray-500">
                            Credit notes will appear here if adjustments are needed.
                        </p>
                    </Card>
                )}
            </PageContent>
        </WithPermission>
    );
}
