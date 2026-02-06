/**
 * Fees Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface FeeStructure {
    id: string;
    name: string;
    academicYearId: string;
    classId?: string;
    amount: number;
    dueDate: string;
    components: FeeComponent[];
}

export interface FeeComponent {
    name: string;
    amount: number;
    isOptional: boolean;
}

export interface FeeAssignment {
    id: string;
    studentId: string;
    feeStructureId: string;
    totalAmount: number;
    paidAmount: number;
    status: 'pending' | 'partial' | 'paid';
    dueDate: string;
}

export interface Payment {
    id: string;
    assignmentId: string;
    amount: number;
    method: 'cash' | 'online' | 'cheque' | 'bank_transfer';
    transactionId?: string;
    receiptNumber: string;
    paidAt: Date;
    collectedBy: string;
}

export interface CreateFeeStructureInput {
    name: string;
    academicYearId: string;
    classId?: string;
    amount: number;
    dueDate: string;
    components: FeeComponent[];
}

/**
 * Fees Client
 */
export const feesClient = {
    /**
     * Fee Structures
     */
    structures: {
        async list(params?: QueryParams): Promise<PaginatedResponse<FeeStructure>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<FeeStructure>>(
                `/api/v1/fees/structures${query}`
            );
            return response.data;
        },

        async get(id: string): Promise<FeeStructure> {
            const response = await apiClient.get<ApiResponse<FeeStructure>>(
                `/api/v1/fees/structures/${id}`
            );
            return response.data.data;
        },

        async create(data: CreateFeeStructureInput): Promise<FeeStructure> {
            const response = await apiClient.post<ApiResponse<FeeStructure>>(
                '/api/v1/fees/structures',
                data
            );
            return response.data.data;
        },

        async update(id: string, data: Partial<CreateFeeStructureInput>): Promise<FeeStructure> {
            const response = await apiClient.patch<ApiResponse<FeeStructure>>(
                `/api/v1/fees/structures/${id}`,
                data
            );
            return response.data.data;
        },
    },

    /**
     * Fee Assignments
     */
    assignments: {
        async list(params?: QueryParams & { studentId?: string; status?: string }): Promise<PaginatedResponse<FeeAssignment>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<FeeAssignment>>(
                `/api/v1/fees/assignments${query}`
            );
            return response.data;
        },

        async assign(data: { studentId: string; feeStructureId: string }): Promise<FeeAssignment> {
            const response = await apiClient.post<ApiResponse<FeeAssignment>>(
                '/api/v1/fees/assignments',
                data
            );
            return response.data.data;
        },

        async bulkAssign(data: {
            feeStructureId: string;
            studentIds: string[];
        }): Promise<FeeAssignment[]> {
            const response = await apiClient.post<ApiResponse<FeeAssignment[]>>(
                '/api/v1/fees/assignments/bulk',
                data
            );
            return response.data.data;
        },

        async getByStudent(studentId: string): Promise<FeeAssignment[]> {
            const response = await apiClient.get<ApiResponse<FeeAssignment[]>>(
                `/api/v1/fees/assignments/student/${studentId}`
            );
            return response.data.data;
        },
    },

    /**
     * Payments
     */
    payments: {
        async record(data: {
            assignmentId: string;
            amount: number;
            method: 'cash' | 'online' | 'cheque' | 'bank_transfer';
            transactionId?: string;
        }): Promise<Payment> {
            const response = await apiClient.post<ApiResponse<Payment>>(
                '/api/v1/fees/payments',
                data
            );
            return response.data.data;
        },

        async list(params?: QueryParams & { assignmentId?: string }): Promise<PaginatedResponse<Payment>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Payment>>(
                `/api/v1/fees/payments${query}`
            );
            return response.data;
        },

        async getReceipt(paymentId: string): Promise<Blob> {
            const response = await apiClient.get(`/api/v1/fees/payments/${paymentId}/receipt`, {
                responseType: 'blob',
            });
            return response.data;
        },
    },

    /**
     * Reports
     */
    reports: {
        async defaulters(params?: { classId?: string }): Promise<Array<{
            studentId: string;
            name: string;
            pendingAmount: number;
            dueDate: string;
        }>> {
            const response = await apiClient.get<ApiResponse<Array<{
                studentId: string;
                name: string;
                pendingAmount: number;
                dueDate: string;
            }>>>('/api/v1/fees/reports/defaulters', { params });
            return response.data.data;
        },

        async collection(params?: { startDate?: string; endDate?: string }): Promise<{
            totalCollected: number;
            byMethod: Record<string, number>;
        }> {
            const response = await apiClient.get<ApiResponse<{
                totalCollected: number;
                byMethod: Record<string, number>;
            }>>('/api/v1/fees/reports/collection', { params });
            return response.data.data;
        },
    },
};
