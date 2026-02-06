/**
 * Fees Validators
 */
import { z } from 'zod';
import { FEE_TYPE_OPTIONS, PAYMENT_MODE } from './fees.constants';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Fee Structure schemas
export const createFeeStructureSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').max(100),
        feeType: z.enum(FEE_TYPE_OPTIONS as [string, ...string[]]),
        amount: z.number().positive('Amount must be positive'),
        frequency: z.enum(['one_time', 'monthly', 'quarterly', 'half_yearly', 'yearly']),
        academicYearId: z.string().uuid('Invalid academic year ID'),
        classId: z.string().uuid().optional(),
        description: z.string().max(500).optional(),
    }).strict(),
});

export const updateFeeStructureSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid fee structure ID'),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        amount: z.number().positive().optional(),
        description: z.string().max(500).nullable().optional(),
        isActive: z.boolean().optional(),
    }).strict(),
});

// Fee Assignment schemas
export const assignFeeSchema = z.object({
    body: z.object({
        studentId: z.string().uuid('Invalid student ID'),
        feeStructureId: z.string().uuid('Invalid fee structure ID'),
        academicYearId: z.string().uuid('Invalid academic year ID'),
        discountAmount: z.number().min(0).optional().default(0),
        dueDate: z.string().regex(dateRegex, 'Invalid date format').optional(),
    }).strict(),
});

export const bulkAssignFeeSchema = z.object({
    body: z.object({
        feeStructureId: z.string().uuid('Invalid fee structure ID'),
        academicYearId: z.string().uuid('Invalid academic year ID'),
        classId: z.string().uuid('Invalid class ID'),
        sectionId: z.string().uuid().optional(),
        dueDate: z.string().regex(dateRegex).optional(),
    }).strict(),
});

// Payment schemas
export const recordPaymentSchema = z.object({
    body: z.object({
        feeAssignmentId: z.string().uuid('Invalid fee assignment ID'),
        amount: z.number().positive('Amount must be positive'),
        paymentMode: z.enum(Object.values(PAYMENT_MODE) as [string, ...string[]]),
        transactionRef: z.string().max(100).optional(),
        paymentDate: z.string().regex(dateRegex, 'Invalid date format'),
        remarks: z.string().max(500).optional(),
    }).strict(),
});

// Common param schemas
export const feeStructureIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid fee structure ID'),
    }),
});

export const feeAssignmentIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid fee assignment ID'),
    }),
});

export const paymentIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid payment ID'),
    }),
});

// Query schemas
export const listFeeStructuresSchema = z.object({
    query: z.object({
        academicYearId: z.string().uuid().optional(),
        classId: z.string().uuid().optional(),
        feeType: z.enum(FEE_TYPE_OPTIONS as [string, ...string[]]).optional(),
    }),
});

export const listFeeAssignmentsSchema = z.object({
    query: z.object({
        studentId: z.string().uuid().optional(),
        academicYearId: z.string().uuid().optional(),
        status: z.enum(['pending', 'partial', 'paid', 'overdue']).optional(),
    }),
});

export const listPaymentsSchema = z.object({
    query: z.object({
        feeAssignmentId: z.string().uuid().optional(),
        studentId: z.string().uuid().optional(),
        fromDate: z.string().regex(dateRegex).optional(),
        toDate: z.string().regex(dateRegex).optional(),
    }),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>['body'];
export type UpdateFeeStructureInput = z.infer<typeof updateFeeStructureSchema>['body'];
export type AssignFeeInput = z.infer<typeof assignFeeSchema>['body'];
export type BulkAssignFeeInput = z.infer<typeof bulkAssignFeeSchema>['body'];
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>['body'];
