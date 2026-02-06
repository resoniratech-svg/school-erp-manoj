/**
 * GST Summary Export
 */
import { CSV_HEADERS } from '../accounting.constants';
import type { GSTSummary } from '../accounting.types';

/**
 * Generate GST summary from invoices and credit notes
 */
export function generateGSTSummary(
    invoices: Array<{
        issuedAt: Date | null;
        subtotalAmount: number;
        taxes: Array<{ type: string; amount: number }>;
    }>,
    creditNotes: Array<{
        issuedAt: Date;
        subtotal: number;
        taxes: Array<{ taxType: string; amount: number }>;
    }>
): GSTSummary[] {
    const monthlyData: Record<string, GSTSummary> = {};

    // Process invoices
    for (const invoice of invoices) {
        if (!invoice.issuedAt) continue;
        const month = formatMonth(invoice.issuedAt);

        if (!monthlyData[month]) {
            monthlyData[month] = {
                month,
                taxableValue: 0,
                cgst: 0,
                sgst: 0,
                igst: 0,
                creditNoteAdjustment: 0,
                netGST: 0,
            };
        }

        monthlyData[month].taxableValue += invoice.subtotalAmount;

        for (const tax of invoice.taxes) {
            if (tax.type === 'cgst') monthlyData[month].cgst += tax.amount;
            if (tax.type === 'sgst') monthlyData[month].sgst += tax.amount;
            if (tax.type === 'igst') monthlyData[month].igst += tax.amount;
        }
    }

    // Process credit notes (subtract)
    for (const cn of creditNotes) {
        const month = formatMonth(cn.issuedAt);
        if (!monthlyData[month]) continue;

        monthlyData[month].creditNoteAdjustment += cn.subtotal;

        for (const tax of cn.taxes) {
            if (tax.taxType === 'cgst') monthlyData[month].cgst -= tax.amount;
            if (tax.taxType === 'sgst') monthlyData[month].sgst -= tax.amount;
            if (tax.taxType === 'igst') monthlyData[month].igst -= tax.amount;
        }
    }

    // Calculate net GST
    for (const data of Object.values(monthlyData)) {
        data.netGST = data.cgst + data.sgst + data.igst;
    }

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Convert to CSV
 */
export function gstSummaryToCSV(data: GSTSummary[]): string {
    const rows = [CSV_HEADERS.GST_SUMMARY.join(',')];

    for (const row of data) {
        rows.push([
            row.month,
            (row.taxableValue / 100).toFixed(2),
            (row.cgst / 100).toFixed(2),
            (row.sgst / 100).toFixed(2),
            (row.igst / 100).toFixed(2),
            (row.creditNoteAdjustment / 100).toFixed(2),
            (row.netGST / 100).toFixed(2),
        ].join(','));
    }

    return rows.join('\n');
}

function formatMonth(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
