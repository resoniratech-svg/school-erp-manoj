/**
 * Periods Service
 * Business logic layer
 */
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '@school-erp/shared';
import { periodsRepository, PeriodsRepository } from './periods.repository';
import { PERIOD_ERROR_CODES } from './periods.constants';
import type {
    PeriodResponse,
    PeriodContext,
    CreatePeriodInput,
    UpdatePeriodInput,
} from './periods.types';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

function toPeriodResponse(period: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    displayOrder: number;
    periodType: string;
    createdAt: Date;
    updatedAt: Date;
}): PeriodResponse {
    return {
        id: period.id,
        name: period.name,
        startTime: period.startTime,
        endTime: period.endTime,
        displayOrder: period.displayOrder,
        periodType: period.periodType,
        createdAt: period.createdAt.toISOString(),
        updatedAt: period.updatedAt.toISOString(),
    };
}

export class PeriodsService {
    constructor(private readonly repository: PeriodsRepository = periodsRepository) { }

    /**
     * Create a new period
     */
    async createPeriod(
        input: CreatePeriodInput,
        context: PeriodContext
    ): Promise<PeriodResponse> {
        // Validate time range
        if (input.startTime >= input.endTime) {
            throw new BadRequestError('End time must be after start time', {
                code: PERIOD_ERROR_CODES.INVALID_TIME_RANGE,
            });
        }

        // Check for overlapping periods
        const overlapping = await this.repository.findOverlapping(
            context.tenantId,
            context.branchId,
            input.startTime,
            input.endTime
        );

        if (overlapping.length > 0) {
            throw new ConflictError(
                `Period overlaps with existing period: ${overlapping[0].name}`,
                { code: PERIOD_ERROR_CODES.OVERLAP }
            );
        }

        const period = await this.repository.create({
            tenantId: context.tenantId,
            branchId: context.branchId,
            name: input.name,
            startTime: input.startTime,
            endTime: input.endTime,
            displayOrder: input.displayOrder,
            periodType: input.periodType,
        });

        logger.info('Period created', {
            periodId: period.id,
            tenantId: context.tenantId,
            branchId: context.branchId,
            createdBy: context.userId,
        });

        return toPeriodResponse(period);
    }

    /**
     * Get period by ID
     */
    async getPeriodById(id: string, context: PeriodContext): Promise<PeriodResponse> {
        const period = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!period) {
            throw new NotFoundError('Period not found', {
                code: PERIOD_ERROR_CODES.NOT_FOUND,
            });
        }
        return toPeriodResponse(period);
    }

    /**
     * List all periods for a branch
     */
    async listPeriods(context: PeriodContext): Promise<PeriodResponse[]> {
        const periods = await this.repository.findByBranch(context.tenantId, context.branchId);
        return periods.map(toPeriodResponse);
    }

    /**
     * Update a period
     */
    async updatePeriod(
        id: string,
        input: UpdatePeriodInput,
        context: PeriodContext
    ): Promise<PeriodResponse> {
        const existing = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!existing) {
            throw new NotFoundError('Period not found', {
                code: PERIOD_ERROR_CODES.NOT_FOUND,
            });
        }

        const newStartTime = input.startTime ?? existing.startTime;
        const newEndTime = input.endTime ?? existing.endTime;

        // Validate time range
        if (newStartTime >= newEndTime) {
            throw new BadRequestError('End time must be after start time', {
                code: PERIOD_ERROR_CODES.INVALID_TIME_RANGE,
            });
        }

        // Check for overlapping periods (excluding current)
        const overlapping = await this.repository.findOverlapping(
            context.tenantId,
            context.branchId,
            newStartTime,
            newEndTime,
            id
        );

        if (overlapping.length > 0) {
            throw new ConflictError(
                `Period overlaps with existing period: ${overlapping[0].name}`,
                { code: PERIOD_ERROR_CODES.OVERLAP }
            );
        }

        const updated = await this.repository.update(id, {
            name: input.name,
            startTime: input.startTime,
            endTime: input.endTime,
            displayOrder: input.displayOrder,
            periodType: input.periodType,
        });

        logger.info('Period updated', {
            periodId: id,
            tenantId: context.tenantId,
            updatedBy: context.userId,
        });

        return toPeriodResponse(updated);
    }

    /**
     * Delete a period (soft delete)
     */
    async deletePeriod(id: string, context: PeriodContext): Promise<void> {
        const period = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!period) {
            throw new NotFoundError('Period not found', {
                code: PERIOD_ERROR_CODES.NOT_FOUND,
            });
        }

        // Check for dependencies
        const hasDependencies = await this.repository.hasDependencies(id);
        if (hasDependencies) {
            throw new ConflictError('Cannot delete period used in timetable entries', {
                code: PERIOD_ERROR_CODES.HAS_DEPENDENCIES,
            });
        }

        await this.repository.softDelete(id);

        logger.info('Period deleted', {
            periodId: id,
            tenantId: context.tenantId,
            deletedBy: context.userId,
        });
    }
}

export const periodsService = new PeriodsService();
