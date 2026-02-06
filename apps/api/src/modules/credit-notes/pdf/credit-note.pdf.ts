/**
 * Credit Note PDF Generator
 */
import { COMPANY_INFO } from '../invoicing/invoicing.constants';
import type { CreditNoteResponse } from './credit-notes.types';
import { CREDIT_REASON_LABELS } from './credit-notes.constants';

function formatAmount(paise: number): string {
    return `₹${(paise / 100).toFixed(2)}`;
}

export function generateCreditNoteHTML(creditNote: CreditNoteResponse): string {
    const itemsHTML = creditNote.items
        .map(
            (item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatAmount(item.unitPrice)}</td>
                <td class="text-right">${formatAmount(item.amount)}</td>
            </tr>
        `
        )
        .join('');

    const taxesHTML = creditNote.taxes
        .map(
            (tax) => `
            <tr>
                <td colspan="4" class="text-right">${tax.taxType.toUpperCase()} @ ${tax.rate}%</td>
                <td class="text-right">-${formatAmount(tax.amount)}</td>
            </tr>
        `
        )
        .join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Credit Note ${creditNote.creditNumber}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .company-info { max-width: 300px; }
        .company-name { font-size: 20px; font-weight: bold; color: #DC2626; }
        .note-info { text-align: right; }
        .note-number { font-size: 18px; font-weight: bold; color: #DC2626; }
        .divider { border-top: 2px solid #DC2626; margin: 20px 0; }
        .reason-badge { display: inline-block; background: #FEE2E2; color: #DC2626; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .text-right { text-align: right; }
        .totals tr td { border: none; padding: 5px 10px; }
        .total-row { font-size: 16px; font-weight: bold; background: #DC2626; color: white; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 10px; }
        .notice { margin-top: 20px; padding: 10px; background: #FEF2F2; border-left: 4px solid #DC2626; font-size: 11px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <div class="company-name">${COMPANY_INFO.NAME}</div>
            <p>${COMPANY_INFO.ADDRESS}</p>
            <p>GSTIN: ${COMPANY_INFO.GSTIN}</p>
        </div>
        <div class="note-info">
            <div class="note-number">${creditNote.creditNumber}</div>
            <p>CREDIT NOTE</p>
            <p>Date: ${new Date(creditNote.issuedAt).toLocaleDateString('en-IN')}</p>
            <p class="reason-badge">${CREDIT_REASON_LABELS[creditNote.reason] || creditNote.reason}</p>
        </div>
    </div>

    <div class="divider"></div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHTML}
        </tbody>
    </table>

    <table class="totals">
        <tbody>
            <tr>
                <td colspan="4" class="text-right">Subtotal</td>
                <td class="text-right">-${formatAmount(creditNote.subtotal)}</td>
            </tr>
            ${taxesHTML}
            <tr class="total-row">
                <td colspan="4" class="text-right">Total Credit (INR)</td>
                <td class="text-right">-${formatAmount(creditNote.totalAmount)}</td>
            </tr>
        </tbody>
    </table>

    ${creditNote.notes ? `<div class="notice"><strong>Notes:</strong> ${creditNote.notes}</div>` : ''}

    <div class="notice">
        <strong>Important:</strong> This Credit Note is issued as per GST regulations. 
        It adjusts the original Invoice and affects your GST returns accordingly.
    </div>

    <div class="footer">
        <p>This is a computer-generated document and does not require a signature.</p>
    </div>
</body>
</html>
    `;
}

export async function generateCreditNotePDF(creditNote: CreditNoteResponse): Promise<Buffer> {
    const html = generateCreditNoteHTML(creditNote);
    return Buffer.from(html, 'utf-8');
}
