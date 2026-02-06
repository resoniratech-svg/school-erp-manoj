/**
 * Classes Service
 * Business logic layer
 */
import {
    NotFoundError,
    BadRequestError,
    ConflictError,
} from '@school-erp/shared';
import { classesRepository, ClassesRepository } from './classes.repository';
import { toClassResponse, toClassResponseList } from './classes.mapper';
import { CLASS_ERROR_CODES } from './classes.constants';
import type {
    ClassResponse,
    ClassListOptions,
    PaginatedClassesResponse,
    ClassContext,
} from './classes.types';
import type { CreateClassInput, UpdateClassInput } from './classes.validator';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

export class ClassesService {
    constructor(private readonly repository: ClassesRepository = classesRepository) { }

    /**
     * Create a new class
     */
    async createClass(
        input: CreateClassInput,
        context: ClassContext
    ): Promise<ClassResponse> {
        // Validate branch belongs to tenant
        const branch = await this.repository.findBranchById(input.branchId, context.tenantId);
        if (!branch) {
            throw new BadRequestError('Branch not found or access denied', {
                code: CLASS_ERROR_CODES.BRANCH_MISMATCH,
            });
        }

        // Validate academic year belongs to tenant
        const academicYear = await this.repository.findAcademicYearById(
            input.academicYearId,
            context.tenantId
        );
        if (!academicYear) {
            throw new NotFoundError('Academic year not found', {
                code: CLASS_ERROR_CODES.ACADEMIC_YEAR_NOT_FOUND,
            });
        }

        // Check for duplicate code within branch + academic year
        const existingClass = await this.repository.findByCode(
            input.code,
            context.tenantId,
            input.branchId,
            input.academicYearId
        );
        if (existingClass) {
            throw new ConflictError(
                'A class with this code already exists in this branch and academic year',
                { code: CLASS_ERROR_CODES.ALREADY_EXISTS }
            );
        }

        const classEntity = await this.repository.create({
            tenantId: context.tenantId,
            branchId: input.branchId,
            academicYearId: input.academicYearId,
            name: input.name,
            code: input.code,
            displayOrder: input.displayOrder,
            description: input.description,
        });

        logger.info('Class created', {
            classId: classEntity.id,
            tenantId: context.tenantId,
            branchId: input.branchId,
            createdBy: context.userId,
        });

        return toClassResponse(classEntity);
    }

    /**
     * Get class by ID
     */
    async getClassById(
        id: string,
        context: ClassContext
    ): Promise<ClassResponse> {
        const classEntity = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!classEntity) {
            throw new NotFoundError('Class not found', {
                code: CLASS_ERROR_CODES.NOT_FOUND,
            });
        }

        return toClassResponse(classEntity);
    }

    /**
     * List classes with filtering and pagination
     */
    async listClasses(
        options: ClassListOptions,
        context: ClassContext
    ): Promise<PaginatedClassesResponse> {
        const skip = (options.page - 1) * options.limit;
        const orderBy = { [options.sortBy || 'displayOrder']: options.sortOrder || 'asc' };

        const { classes, total } = await this.repository.findMany(context.tenantId, {
            skip,
            take: options.limit,
            orderBy,
            filters: options.filters,
        });

        return {
            classes: toClassResponseList(classes),
            pagination: {
                total,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(total / options.limit),
            },
        };
    }

    /**
     * Update a class
     */
    async updateClass(
        id: string,
        input: UpdateClassInput,
        context: ClassContext
    ): Promise<ClassResponse> {
        const existingClass = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!existingClass) {
            throw new NotFoundError('Class not found', {
                code: CLASS_ERROR_CODES.NOT_FOUND,
            });
        }

        // Check for duplicate code if code is being updated
        if (input.code && input.code !== existingClass.code) {
            const classWithCode = await this.repository.findByCode(
                input.code,
                context.tenantId,
                existingClass.branchId,
                existingClass.academicYearId
            );
            if (classWithCode && classWithCode.id !== id) {
                throw new ConflictError(
                    'A class with this code already exists in this branch and academic year',
                    { code: CLASS_ERROR_CODES.ALREADY_EXISTS }
                );
            }
        }

        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.code !== undefined) updateData.code = input.code;
        if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
        if (input.description !== undefined) updateData.description = input.description;

        const updatedClass = await this.repository.update(id, updateData);

        logger.info('Class updated', {
            classId: id,
            tenantId: context.tenantId,
            updatedBy: context.userId,
        });

        return toClassResponse(updatedClass);
    }

    /**
     * Delete a class (soft delete)
     */
    async deleteClass(id: string, context: ClassContext): Promise<void> {
        const classEntity = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!classEntity) {
            throw new NotFoundError('Class not found', {
                code: CLASS_ERROR_CODES.NOT_FOUND,
            });
        }

        // Check for dependencies
        const hasDependencies = await this.repository.hasDependencies(id);
        if (hasDependencies) {
            throw new ConflictError(
                'Cannot delete class with existing sections or enrollments',
                { code: CLASS_ERROR_CODES.HAS_DEPENDENCIES }
            );
        }

        await this.repository.softDelete(id);

        logger.info('Class deleted', {
            classId: id,
            tenantId: context.tenantId,
            deletedBy: context.userId,
        });
    }
}

export const classesService = new ClassesService();
