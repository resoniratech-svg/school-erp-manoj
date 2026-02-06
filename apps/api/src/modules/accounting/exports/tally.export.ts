/**
 * Tally-Compatible Export
 */
import { CSV_HEADERS } from '../accounting.constants';
import type { InvoiceRegisterItem, CreditNoteRegisterItem } from '../accounting.types';

/**
 * Generate Tally-compatible invoice CSV
 */
export function invoicesToTallyCSV(invoices: InvoiceRegisterItem[]): string {
    const headers = [
        'Voucher Type',
        'Voucher No',
        'Voucher Date',
        'Party Name',
        'GSTIN/UIN',
        'Place of Supply',
        'Gross Total',
        'CGST',
        'SGST',
        'IGST',
        'Round Off',
        'Grand Total',
    ];

    const rows = [headers.join(',')];

    for (const inv of invoices) {
        rows.push([
            'Sales',
            inv.invoiceNumber,
            inv.invoiceDate,
            'Customer',
            inv.customerGstin || '',
            inv.placeOfSupply,
            (inv.taxableAmount / 100).toFixed(2),
            (inv.cgst / 100).toFixed(2),
            (inv.sgst / 100).toFixed(2),
            (inv.igst / 100).toFixed(2),
            '0.00',
            (inv.totalAmount / 100).toFixed(2),
        ].join(','));
    }

    return rows.join('\n');
}

/**
 * Generate Tally-compatible credit note CSV
 */
export function creditNotesToTallyCSV(notes: CreditNoteRegisterItem[]): string {
    const headers = [
        'Voucher Type',
        'Voucher No',
        'Voucher Date',
        'Reference No',
        'Reason',
        'Gross Total',
        'CGST',
        'SGST',
        'IGST',
        'Grand Total',
    ];

    const rows = [headers.join(',')];

    for (const cn of notes) {
        rows.push([
            'Credit Note',
            cn.creditNoteNumber,
            cn.issueDate,
            cn.invoiceNumber,
            cn.reason,
            (cn.taxableAmount / 100).toFixed(2),
            (cn.cgst / 100).toFixed(2),
            (cn.sgst / 100).toFixed(2),
            (cn.igst / 100).toFixed(2),
            (cn.totalCredit / 100).toFixed(2),
        ].join(','));
    }

    return rows.join('\n');
}
