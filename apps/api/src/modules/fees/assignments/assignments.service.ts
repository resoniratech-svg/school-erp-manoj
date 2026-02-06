/**
 * Fee Assignments Service
 */
import { feesService } from '../fees.service';
import type { FeeAssignmentResponse, FeesContext } from '../fees.types';
import type { AssignFeeInput, BulkAssignFeeInput } from '../fees.validator';
import type { BulkAssignResult } from './assignments.types';

export class AssignmentsService {
    async assign(input: AssignFeeInput, context: FeesContext): Promise<FeeAssignmentResponse> {
        return feesService.assignFee(input, context);
    }

    async bulkAssign(input: BulkAssignFeeInput, context: FeesContext): Promise<BulkAssignResult> {
        return feesService.bulkAssignFee(input, context);
    }

    async getById(id: string, context: FeesContext): Promise<FeeAssignmentResponse> {
        return feesService.getFeeAssignment(id, context);
    }

    async list(
        filters: { studentId?: string; academicYearId?: string; status?: string },
        context: FeesContext
    ): Promise<FeeAssignmentResponse[]> {
        return feesService.listFeeAssignments(filters, context);
    }
}

export const assignmentsService = new AssignmentsService();
