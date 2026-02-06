/**
 * Accounting Repository
 * READ-ONLY queries for financial data
 * NO WRITE OPERATIONS
 */
import { prisma } from '@school-erp/database';
import type { DateRangeFilter } from './accounting.types';

export class AccountingRepository {
    /**
     * Get invoices for period (READ-ONLY)
     */
    async getInvoices(tenantId: string, filter?: DateRangeFilter) {
        return prisma.invoice.findMany({
            where: {
                tenantId,
                status: { in: ['issued', 'paid', 'partially_paid', 'overdue'] },
                ...(filter && {
                    issuedAt: {
                        gte: filter.startDate,
                        lte: filter.endDate,
                    },
                }),
            },
            include: {
                items: true,
                taxes: true,
            },
            orderBy: { issuedAt: 'desc' },
        });
    }

    /**
     * Get credit notes for period (READ-ONLY)
     */
    async getCreditNotes(tenantId: string, filter?: DateRangeFilter) {
        return prisma.creditNote.findMany({
            where: {
                tenantId,
                ...(filter && {
                    issuedAt: {
                        gte: filter.startDate,
                        lte: filter.endDate,
                    },
                }),
            },
            include: {
                items: true,
                taxes: true,
                invoice: { select: { invoiceNumber: true } },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }

    /**
     * Get payments for period (READ-ONLY)
     */
    async getPayments(tenantId: string, filter?: DateRangeFilter) {
        return prisma.payment.findMany({
            where: {
                tenantId,
                ...(filter && {
                    createdAt: {
                        gte: filter.startDate,
                        lte: filter.endDate,
                    },
                }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get outstanding invoices (READ-ONLY)
     */
    async getReceivables(tenantId: string) {
        return prisma.invoice.findMany({
            where: {
                tenantId,
                status: { in: ['issued', 'partially_paid', 'overdue'] },
            },
            include: {
                taxes: true,
            },
            orderBy: { dueAt: 'asc' },
        });
    }

    /**
     * Get monthly invoice totals (READ-ONLY)
     */
    async getMonthlyInvoiceTotals(tenantId: string, year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        return prisma.invoice.groupBy({
            by: ['status'],
            where: {
                tenantId,
                issuedAt: { gte: startDate, lte: endDate },
            },
            _sum: {
                subtotalAmount: true,
                taxAmount: true,
                totalAmount: true,
            },
        });
    }

    // NO DELETE
    // NO UPDATE
    // NO CREATE
}

export const accountingRepository = new AccountingRepository();
