/**
 * Assignments Sub-module Service
 * CRITICAL: Enforces single-assignment and capacity rules
 */
import { transportService } from '../transport.service';
import type { TransportAssignmentResponse, TransportContext } from '../transport.types';
import type { CreateAssignmentInput, UpdateAssignmentInput } from '../transport.validator';

export class AssignmentsService {
    async create(input: CreateAssignmentInput, context: TransportContext): Promise<TransportAssignmentResponse> {
        return transportService.createAssignment(input, context);
    }

    async getById(id: string, context: TransportContext): Promise<TransportAssignmentResponse> {
        return transportService.getAssignmentById(id, context);
    }

    async list(
        filters: { routeId?: string; studentId?: string; status?: string },
        context: TransportContext
    ): Promise<TransportAssignmentResponse[]> {
        return transportService.listAssignments(filters, context);
    }

    async update(
        id: string,
        input: UpdateAssignmentInput,
        context: TransportContext
    ): Promise<TransportAssignmentResponse> {
        return transportService.updateAssignment(id, input, context);
    }

    async cancel(id: string, context: TransportContext): Promise<void> {
        return transportService.cancelAssignment(id, context);
    }
}

export const assignmentsService = new AssignmentsService();
