/**
 * Fee Structures Service
 * Delegates to main fees service
 */
import { feesService } from '../fees.service';
import type { FeeStructureResponse, FeesContext } from '../fees.types';
import type { CreateFeeStructureInput, UpdateFeeStructureInput } from '../fees.validator';

export class StructuresService {
    async create(input: CreateFeeStructureInput, context: FeesContext): Promise<FeeStructureResponse> {
        return feesService.createFeeStructure(input, context);
    }

    async getById(id: string, context: FeesContext): Promise<FeeStructureResponse> {
        return feesService.getFeeStructureById(id, context);
    }

    async list(
        filters: { academicYearId?: string; classId?: string; feeType?: string },
        context: FeesContext
    ): Promise<FeeStructureResponse[]> {
        return feesService.listFeeStructures(filters, context);
    }

    async update(id: string, input: UpdateFeeStructureInput, context: FeesContext): Promise<FeeStructureResponse> {
        return feesService.updateFeeStructure(id, input, context);
    }
}

export const structuresService = new StructuresService();
