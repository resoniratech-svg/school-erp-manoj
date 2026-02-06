'use client';


import {
    Download,
    FileSpreadsheet,
    FileText,
    Receipt,
    TrendingUp,
    DollarSign,
    AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { PageLoader } from '@/components/ui/PageLoader';
import { WithPermission } from '@/components/auth/WithPermission';
import { useQuery } from '@/lib/hooks';
import { accountingClient, type GSTSummary } from '@school-erp/api-client';

function formatAmount(paise: number): string {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function GSTCard({ data }: { data: GSTSummary }) {
    return (
        <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{data.month}</h3>
                <span className="text-lg font-bold text-primary-600">
                    {formatAmount(data.netGST)}
                </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                    <p className="text-gray-500">CGST</p>
                    <p className="font-medium">{formatAmount(data.cgst)}</p>
                </div>
                <div>
                    <p className="text-gray-500">SGST</p>
                    <p className="font-medium">{formatAmount(data.sgst)}</p>
                </div>
                <div>
                    <p className="text-gray-500">IGST</p>
                    <p className="font-medium">{formatAmount(data.igst)}</p>
                </div>
                <div>
                    <p className="text-gray-500">Taxable</p>
                    <p className="font-medium">{formatAmount(data.taxableValue)}</p>
                </div>
            </div>
            {data.creditNoteAdjustment > 0 && (
                <p className="mt-2 text-xs text-red-600">
                    Credit notes: -{formatAmount(data.creditNoteAdjustment)}
                </p>
            )}
        </div>
    );
}

function ExportButton({
    label,
    icon: Icon,
    onClick,
}: {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 rounded-lg border bg-white p-4 hover:border-primary-300 hover:shadow-sm w-full text-left"
        >
            <div className="rounded-lg bg-primary-100 p-2">
                <Icon className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-500">Download CSV</p>
            </div>
            <Download className="h-4 w-4 text-gray-400" />
        </button>
    );
}

export default function AccountingPage() {
    const { data: gstData, isLoading: gstLoading } = useQuery(() =>
        accountingClient.getGSTSummary()
    );
    const { data: revenueData, isLoading: revLoading } = useQuery(() =>
        accountingClient.getRevenue()
    );

    const isLoading = gstLoading || revLoading;

    const handleExport = (report: 'gst-summary' | 'invoices' | 'credit-notes' | 'payments' | 'revenue') => {
        const url = `/api/v1/accounting/${report}?format=csv`;
        window.open(url, '_blank');
    };

    const handleTallyExport = () => {
        window.open('/api/v1/accounting/invoices?format=tally', '_blank');
    };

    const totalGST = gstData?.reduce((s, d) => s + d.netGST, 0) || 0;
    const totalRevenue = revenueData?.reduce((s, d) => s + d.netRevenue, 0) || 0;

    return (
        <WithPermission permission="accounting:read:tenant">
            <PageContent>
                <PageHeader
                    title="Accounting & Exports"
                    subtitle="CA-ready GST reports and financial exports"
                />

                {/* Read-only Notice */}
                <Card className="border-blue-200 bg-blue-50">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-800">Read-Only Module</p>
                            <p className="text-sm text-blue-700">
                                All data shown here is derived from invoices, credit notes, and payments. No modifications are possible.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-green-100 p-3">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Net Revenue (YTD)</p>
                                <p className="text-2xl font-bold text-green-600">{formatAmount(totalRevenue)}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-primary-100 p-3">
                                <Receipt className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total GST (YTD)</p>
                                <p className="text-2xl font-bold text-primary-600">{formatAmount(totalGST)}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Export Buttons */}
                <Card>
                    <h3 className="font-semibold mb-4">Export Data</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        <ExportButton
                            label="GST Summary"
                            icon={Receipt}
                            onClick={() => handleExport('gst-summary')}
                        />
                        <ExportButton
                            label="Invoice Register"
                            icon={FileText}
                            onClick={() => handleExport('invoices')}
                        />
                        <ExportButton
                            label="Credit Notes"
                            icon={FileSpreadsheet}
                            onClick={() => handleExport('credit-notes')}
                        />
                        <ExportButton
                            label="Payments"
                            icon={DollarSign}
                            onClick={() => handleExport('payments')}
                        />
                        <ExportButton
                            label="Revenue Summary"
                            icon={TrendingUp}
                            onClick={() => handleExport('revenue')}
                        />
                        <ExportButton
                            label="Tally Export"
                            icon={FileSpreadsheet}
                            onClick={handleTallyExport}
                        />
                    </div>
                </Card>

                {/* GST by Month */}
                {isLoading ? (
                    <PageLoader />
                ) : gstData && gstData.length > 0 ? (
                    <div>
                        <h3 className="font-semibold mb-3">GST by Month</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            {gstData.map((item) => (
                                <GSTCard key={item.month} data={item} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <Card className="text-center py-8">
                        <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 font-semibold">No GST data yet</h3>
                        <p className="text-sm text-gray-500">
                            GST summaries will appear here once invoices are issued.
                        </p>
                    </Card>
                )}
            </PageContent>
        </WithPermission>
    );
}
