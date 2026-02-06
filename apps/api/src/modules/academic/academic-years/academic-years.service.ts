/**
 * Academic Years Service
 * Business logic layer
 */
import {
    NotFoundError,
    BadRequestError,
    ConflictError,
} from '@school-erp/shared';
import { academicYearsRepository, AcademicYearsRepository } from './academic-years.repository';
import { toAcademicYearResponse, toAcademicYearResponseList } from './academic-years.mapper';
import { ACADEMIC_YEAR_ERROR_CODES } from './academic-years.constants';
import type {
    AcademicYearResponse,
    AcademicYearListOptions,
    PaginatedAcademicYearsResponse,
    AcademicYearContext,
} from './academic-years.types';
import type { CreateAcademicYearInput, UpdateAcademicYearInput } from './academic-years.validator';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

export class AcademicYearsService {
    constructor(private readonly repository: AcademicYearsRepository = academicYearsRepository) { }

    /**
     * Create a new academic year
     */
    async createAcademicYear(
        input: CreateAcademicYearInput,
        context: AcademicYearContext
    ): Promise<AcademicYearResponse> {
        // Check for duplicate name
        const existingYear = await this.repository.findByName(input.name, context.tenantId);
        if (existingYear) {
            throw new ConflictError('Academic year with this name already exists', {
                code: ACADEMIC_YEAR_ERROR_CODES.ALREADY_EXISTS,
            });
        }

        // Validate date range
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        if (endDate <= startDate) {
            throw new BadRequestError('End date must be after start date', {
                code: ACADEMIC_YEAR_ERROR_CODES.INVALID_DATES,
            });
        }

        const academicYear = await this.repository.create({
            tenantId: context.tenantId,
            name: input.name,
            startDate,
            endDate,
            status: input.status || 'draft',
        });

        logger.info('Academic year created', {
            academicYearId: academicYear.id,
            tenantId: context.tenantId,
            createdBy: context.userId,
        });

        return toAcademicYearResponse(academicYear);
    }

    /**
     * Get academic year by ID
     */
    async getAcademicYearById(
        id: string,
        context: AcademicYearContext
    ): Promise<AcademicYearResponse> {
        const academicYear = await this.repository.findById(id, context.tenantId);
        if (!academicYear) {
            throw new NotFoundError('Academic year not found', {
                code: ACADEMIC_YEAR_ERROR_CODES.NOT_FOUND,
            });
        }

        return toAcademicYearResponse(academicYear);
    }

    /**
     * List academic years with filtering and pagination
     */
    async listAcademicYears(
        options: AcademicYearListOptions,
        context: AcademicYearContext
    ): Promise<PaginatedAcademicYearsResponse> {
        const skip = (options.page - 1) * options.limit;
        const orderBy = { [options.sortBy || 'createdAt']: options.sortOrder || 'desc' };

        const { academicYears, total } = await this.repository.findMany(context.tenantId, {
            skip,
            take: options.limit,
            orderBy,
            filters: options.filters,
        });

        return {
            academicYears: toAcademicYearResponseList(academicYears),
            pagination: {
                total,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(total / options.limit),
            },
        };
    }

    /**
     * Update an academic year
     */
    async updateAcademicYear(
        id: string,
        input: UpdateAcademicYearInput,
        context: AcademicYearContext
    ): Promise<AcademicYearResponse> {
        const existingYear = await this.repository.findById(id, context.tenantId);
        if (!existingYear) {
            throw new NotFoundError('Academic year not found', {
                code: ACADEMIC_YEAR_ERROR_CODES.NOT_FOUND,
            });
        }

        // Check for duplicate name if name is being updated
        if (input.name && input.name !== existingYear.name) {
            const yearWithName = await this.repository.findByName(input.name, context.tenantId);
            if (yearWithName && yearWithName.id !== id) {
                throw new ConflictError('Academic year with this name already exists', {
                    code: ACADEMIC_YEAR_ERROR_CODES.ALREADY_EXISTS,
                });
            }
        }

        // Validate date range if dates are being updated
        const startDate = input.startDate ? new Date(input.startDate) : existingYear.startDate;
        const endDate = input.endDate ? new Date(input.endDate) : existingYear.endDate;

        if (endDate <= startDate) {
            throw new BadRequestError('End date must be after start date', {
                code: ACADEMIC_YEAR_ERROR_CODES.INVALID_DATES,
            });
        }

        const updateData: Record<string, unknown> = {};
        if (input.name) updateData.name = input.name;
        if (input.startDate) updateData.startDate = new Date(input.startDate);
        if (input.endDate) updateData.endDate = new Date(input.endDate);
        if (input.status) updateData.status = input.status;

        const updatedYear = await this.repository.update(id, context.tenantId, updateData);

        logger.info('Academic year updated', {
            academicYearId: id,
            tenantId: context.tenantId,
            updatedBy: context.userId,
        });

        return toAcademicYearResponse(updatedYear);
    }

    /**
     * Delete an academic year
     * Cannot delete the active (current) academic year
     */
    async deleteAcademicYear(id: string, context: AcademicYearContext): Promise<void> {
        const academicYear = await this.repository.findById(id, context.tenantId);
        if (!academicYear) {
            throw new NotFoundError('Academic year not found', {
                code: ACADEMIC_YEAR_ERROR_CODES.NOT_FOUND,
            });
        }

        // Prevent deletion of active year
        if (academicYear.isCurrent) {
            throw new BadRequestError('Cannot delete the current active academic year', {
                code: ACADEMIC_YEAR_ERROR_CODES.CANNOT_DELETE_ACTIVE,
            });
        }

        // Check for dependencies
        const hasDependencies = await this.repository.hasDependencies(id);
        if (hasDependencies) {
            throw new BadRequestError(
                'Cannot delete academic year with existing classes or enrollments',
                { code: 'ACADEMIC_YEAR_HAS_DEPENDENCIES' }
            );
        }

        await this.repository.delete(id);

        logger.info('Academic year deleted', {
            academicYearId: id,
            tenantId: context.tenantId,
            deletedBy: context.userId,
        });
    }

    /**
     * Activate an academic year (set as current)
     * Only ONE academic year can be active per tenant (atomic operation)
     */
    async activateAcademicYear(
        id: string,
        context: AcademicYearContext
    ): Promise<AcademicYearResponse> {
        const academicYear = await this.repository.findById(id, context.tenantId);
        if (!academicYear) {
            throw new NotFoundError('Academic year not found', {
                code: ACADEMIC_YEAR_ERROR_CODES.NOT_FOUND,
            });
        }

        // Already active
        if (academicYear.isCurrent) {
            throw new BadRequestError('Academic year is already active', {
                code: ACADEMIC_YEAR_ERROR_CODES.ALREADY_ACTIVE,
            });
        }

        // Atomic activation: deactivates all others and activates this one
        const activatedYear = await this.repository.activateAtomic(id, context.tenantId);

        logger.info('Academic year activated', {
            academicYearId: id,
            tenantId: context.tenantId,
            activatedBy: context.userId,
        });

        return toAcademicYearResponse(activatedYear);
    }
}

export const academicYearsService = new AcademicYearsService();
