/**
 * Revenue Summary Export
 */
import type { RevenueSummary } from '../accounting.types';

/**
 * Generate revenue summary from invoices and credit notes
 */
export function generateRevenueSummary(
    invoices: Array<{
        issuedAt: Date | null;
        status: string;
        totalAmount: number;
    }>,
    creditNotes: Array<{
        issuedAt: Date;
        totalAmount: number;
    }>
): RevenueSummary[] {
    const monthlyData: Record<string, RevenueSummary> = {};

    // Process invoices
    for (const invoice of invoices) {
        if (!invoice.issuedAt) continue;
        const month = formatMonth(invoice.issuedAt);

        if (!monthlyData[month]) {
            monthlyData[month] = {
                month,
                grossRevenue: 0,
                creditNotes: 0,
                netRevenue: 0,
                paidAmount: 0,
                unpaidAmount: 0,
                planBreakdown: {},
            };
        }

        monthlyData[month].grossRevenue += invoice.totalAmount;

        if (invoice.status === 'paid') {
            monthlyData[month].paidAmount += invoice.totalAmount;
        } else {
            monthlyData[month].unpaidAmount += invoice.totalAmount;
        }
    }

    // Process credit notes
    for (const cn of creditNotes) {
        const month = formatMonth(cn.issuedAt);
        if (!monthlyData[month]) continue;

        monthlyData[month].creditNotes += cn.totalAmount;
    }

    // Calculate net revenue
    for (const data of Object.values(monthlyData)) {
        data.netRevenue = data.grossRevenue - data.creditNotes;
    }

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Revenue to CSV
 */
export function revenueSummaryToCSV(data: RevenueSummary[]): string {
    const headers = ['Month', 'Gross Revenue', 'Credit Notes', 'Net Revenue', 'Paid', 'Unpaid'];
    const rows = [headers.join(',')];

    for (const row of data) {
        rows.push([
            row.month,
            (row.grossRevenue / 100).toFixed(2),
            (row.creditNotes / 100).toFixed(2),
            (row.netRevenue / 100).toFixed(2),
            (row.paidAmount / 100).toFixed(2),
            (row.unpaidAmount / 100).toFixed(2),
        ].join(','));
    }

    return rows.join('\n');
}

function formatMonth(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
