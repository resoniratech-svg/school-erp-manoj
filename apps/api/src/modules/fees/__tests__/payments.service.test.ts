/**
 * Payments Service Unit Tests
 * CRITICAL: Tests for audit-safe payment operations
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { FeesService } from '../fees.service';
import type { FeesRepository } from '../fees.repository';
import { FEES_ERROR_CODES } from '../fees.constants';

describe('PaymentsService (via FeesService)', () => {
    let service: FeesService;
    let mockRepository: {
        findAssignmentById: Mock;
        findPaymentById: Mock;
        findPaymentByReceiptNumber: Mock;
        findPayments: Mock;
        recordPaymentWithBalanceUpdate: Mock;
        generateReceiptNumber: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockAssignment = {
        id: 'assignment-1',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        studentId: 'student-1',
        feeStructureId: 'structure-1',
        academicYearId: 'year-1',
        totalAmount: 50000,
        discountAmount: 0,
        netAmount: 50000,
        paidAmount: 20000,
        balanceAmount: 30000,
        status: 'partial',
        dueDate: null,
        createdAt: new Date(),
        student: { id: 'student-1', firstName: 'John', lastName: 'Doe', rollNumber: '001' },
        feeStructure: { id: 'structure-1', name: 'Tuition', feeType: 'tuition' },
    };

    const mockPayment = {
        id: 'payment-1',
        feeAssignmentId: 'assignment-1',
        amount: 10000,
        paymentMode: 'cash',
        receiptNumber: 'RCP-2024-000001',
        transactionRef: null,
        paymentDate: new Date(),
        remarks: null,
        recordedByUserId: 'user-789',
        createdAt: new Date(),
    };

    beforeEach(() => {
        mockRepository = {
            findAssignmentById: vi.fn(),
            findPaymentById: vi.fn(),
            findPaymentByReceiptNumber: vi.fn(),
            findPayments: vi.fn(),
            recordPaymentWithBalanceUpdate: vi.fn(),
            generateReceiptNumber: vi.fn(),
        };

        service = new FeesService(mockRepository as unknown as FeesRepository);
    });

    describe('recordPayment', () => {
        const paymentInput = {
            feeAssignmentId: 'assignment-1',
            amount: 10000,
            paymentMode: 'cash' as const,
            paymentDate: '2024-06-15',
        };

        it('should record partial payment successfully', async () => {
            mockRepository.findAssignmentById.mockResolvedValue(mockAssignment);
            mockRepository.generateReceiptNumber.mockResolvedValue('RCP-2024-000002');
            mockRepository.findPaymentByReceiptNumber.mockResolvedValue(null);
            mockRepository.recordPaymentWithBalanceUpdate.mockResolvedValue(mockPayment);

            const result = await service.recordPayment(paymentInput, mockContext);

            expect(mockRepository.recordPaymentWithBalanceUpdate).toHaveBeenCalled();
            expect(result.amount).toBe(10000);
            expect(result.receiptNumber).toBe('RCP-2024-000001');
        });

        it('should reject overpayment', async () => {
            mockRepository.findAssignmentById.mockResolvedValue({
                ...mockAssignment,
                balanceAmount: 5000, // Only 5000 due
            });

            const overpayment = {
                ...paymentInput,
                amount: 10000, // Trying to pay 10000
            };

            await expect(service.recordPayment(overpayment, mockContext)).rejects.toThrow(
                'Payment amount 10000 exceeds balance 5000'
            );
        });

        it('should recalculate balance correctly', async () => {
            mockRepository.findAssignmentById.mockResolvedValue(mockAssignment);
            mockRepository.generateReceiptNumber.mockResolvedValue('RCP-2024-000002');
            mockRepository.findPaymentByReceiptNumber.mockResolvedValue(null);
            mockRepository.recordPaymentWithBalanceUpdate.mockImplementation(
                async (paymentData) => {
                    // Verify the transaction includes balance update
                    expect(paymentData.amount).toBe(10000);
                    return mockPayment;
                }
            );

            await service.recordPayment(paymentInput, mockContext);

            expect(mockRepository.recordPaymentWithBalanceUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 10000,
                    feeAssignmentId: 'assignment-1',
                }),
                'assignment-1'
            );
        });

        it('should reject duplicate receipt number', async () => {
            mockRepository.findAssignmentById.mockResolvedValue(mockAssignment);
            mockRepository.generateReceiptNumber.mockResolvedValue('RCP-2024-000001');
            mockRepository.findPaymentByReceiptNumber.mockResolvedValue(mockPayment); // Already exists

            await expect(service.recordPayment(paymentInput, mockContext)).rejects.toThrow(
                'Duplicate receipt number'
            );
        });

        it('should reject zero or negative amount', async () => {
            mockRepository.findAssignmentById.mockResolvedValue(mockAssignment);

            const zeroPayment = { ...paymentInput, amount: 0 };

            await expect(service.recordPayment(zeroPayment, mockContext)).rejects.toThrow(
                'Payment amount must be positive'
            );
        });
    });

    describe('getPayment', () => {
        it('should get payment by ID', async () => {
            mockRepository.findPaymentById.mockResolvedValue(mockPayment);

            const result = await service.getPayment('payment-1');

            expect(result.id).toBe('payment-1');
            expect(result.receiptNumber).toBe('RCP-2024-000001');
        });

        it('should throw if payment not found', async () => {
            mockRepository.findPaymentById.mockResolvedValue(null);

            await expect(service.getPayment('non-existent')).rejects.toThrow(
                'Payment not found'
            );
        });
    });

    // NO DELETE TESTS - Payments cannot be deleted
    describe('payment immutability', () => {
        it('should not have delete method exposed', () => {
            // Verify delete method doesn't exist on service
            expect((service as unknown as { deletePayment?: unknown }).deletePayment).toBeUndefined();
        });
    });
});
