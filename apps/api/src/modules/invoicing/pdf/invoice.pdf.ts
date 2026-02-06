/**
 * Invoice PDF Generator
 * Generates GST-compliant invoice PDFs
 */
import { COMPANY_INFO } from '../invoicing.constants';
import type { InvoiceResponse } from '../invoicing.types';

/**
 * Format amount from paise to rupees
 */
function formatAmount(paise: number): string {
    return `₹${(paise / 100).toFixed(2)}`;
}

/**
 * Generate invoice HTML (for PDF conversion)
 */
export function generateInvoiceHTML(invoice: InvoiceResponse): string {
    const itemsHTML = invoice.items
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

    const taxesHTML = invoice.taxes
        .map(
            (tax) => `
            <tr>
                <td colspan="4" class="text-right">${tax.type.toUpperCase()} @ ${tax.rate}%</td>
                <td class="text-right">${formatAmount(tax.amount)}</td>
            </tr>
        `
        )
        .join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .company-info { max-width: 300px; }
        .company-name { font-size: 20px; font-weight: bold; color: #4F46E5; }
        .invoice-info { text-align: right; }
        .invoice-number { font-size: 18px; font-weight: bold; }
        .invoice-date { color: #666; margin-top: 5px; }
        .divider { border-top: 2px solid #4F46E5; margin: 20px 0; }
        .billing-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .billing-section { max-width: 300px; }
        .section-title { font-weight: bold; color: #4F46E5; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .text-right { text-align: right; }
        .totals { margin-top: 20px; }
        .totals tr td { border: none; padding: 5px 10px; }
        .total-row { font-size: 16px; font-weight: bold; background: #4F46E5; color: white; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 10px; }
        .gst-info { margin-top: 20px; padding: 10px; background: #f3f4f6; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <div class="company-name">${COMPANY_INFO.NAME}</div>
            <p>${COMPANY_INFO.ADDRESS}</p>
            <p>GSTIN: ${COMPANY_INFO.GSTIN}</p>
            <p>PAN: ${COMPANY_INFO.PAN}</p>
        </div>
        <div class="invoice-info">
            <div class="invoice-number">${invoice.invoiceNumber}</div>
            <div class="invoice-date">Date: ${new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN')}</div>
            <div class="invoice-date">Due: ${new Date(invoice.dueAt).toLocaleDateString('en-IN')}</div>
        </div>
    </div>

    <div class="divider"></div>

    <div class="billing-info">
        <div class="billing-section">
            <div class="section-title">Bill To</div>
            <p>Place of Supply: ${invoice.placeOfSupply}</p>
            ${invoice.gstin ? `<p>GSTIN: ${invoice.gstin}</p>` : '<p>GSTIN: Not Provided</p>'}
        </div>
        <div class="billing-section">
            <div class="section-title">Billing Period</div>
            <p>${new Date(invoice.billingPeriodStart).toLocaleDateString('en-IN')} - ${new Date(invoice.billingPeriodEnd).toLocaleDateString('en-IN')}</p>
        </div>
    </div>

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
                <td class="text-right">${formatAmount(invoice.subtotalAmount)}</td>
            </tr>
            ${taxesHTML}
            <tr class="total-row">
                <td colspan="4" class="text-right">Total (${invoice.currency})</td>
                <td class="text-right">${formatAmount(invoice.totalAmount)}</td>
            </tr>
        </tbody>
    </table>

    <div class="gst-info">
        <strong>Tax Summary:</strong> This invoice includes ${invoice.taxes.map(t => `${t.type.toUpperCase()} @ ${t.rate}%`).join(', ')} as applicable under GST.
    </div>

    <div class="footer">
        <p>This is a computer-generated invoice and does not require a signature.</p>
        <p>Thank you for your business!</p>
    </div>
</body>
</html>
    `;
}

/**
 * Get invoice data for PDF generation
 * In production, use a PDF library like puppeteer or pdfkit
 */
export async function generateInvoicePDF(invoice: InvoiceResponse): Promise<Buffer> {
    // For now, return HTML as buffer
    // In production, use puppeteer to convert HTML to PDF
    const html = generateInvoiceHTML(invoice);
    return Buffer.from(html, 'utf-8');
}
