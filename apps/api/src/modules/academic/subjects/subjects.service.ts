/**
 * Subjects Service
 * Business logic layer
 */
import {
    NotFoundError,
    ConflictError,
} from '@school-erp/shared';
import { subjectsRepository, SubjectsRepository } from './subjects.repository';
import { toSubjectResponse, toSubjectResponseList } from './subjects.mapper';
import { SUBJECT_ERROR_CODES } from './subjects.constants';
import type {
    SubjectResponse,
    SubjectListOptions,
    PaginatedSubjectsResponse,
    SubjectContext,
} from './subjects.types';
import type { CreateSubjectInput, UpdateSubjectInput } from './subjects.validator';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

export class SubjectsService {
    constructor(private readonly repository: SubjectsRepository = subjectsRepository) { }

    /**
     * Create a new subject
     */
    async createSubject(
        input: CreateSubjectInput,
        context: SubjectContext
    ): Promise<SubjectResponse> {
        // Check for duplicate code within tenant
        const existingByCode = await this.repository.findByCode(input.code, context.tenantId);
        if (existingByCode) {
            throw new ConflictError('A subject with this code already exists', {
                code: SUBJECT_ERROR_CODES.CODE_ALREADY_EXISTS,
            });
        }

        // Check for duplicate name within tenant
        const existingByName = await this.repository.findByName(input.name, context.tenantId);
        if (existingByName) {
            throw new ConflictError('A subject with this name already exists', {
                code: SUBJECT_ERROR_CODES.NAME_ALREADY_EXISTS,
            });
        }

        const subject = await this.repository.create({
            tenantId: context.tenantId,
            name: input.name,
            code: input.code,
            type: input.type,
            creditHours: input.creditHours,
            description: input.description,
        });

        logger.info('Subject created', {
            subjectId: subject.id,
            tenantId: context.tenantId,
            createdBy: context.userId,
        });

        return toSubjectResponse(subject);
    }

    /**
     * Get subject by ID
     */
    async getSubjectById(
        id: string,
        context: SubjectContext
    ): Promise<SubjectResponse> {
        const subject = await this.repository.findById(id, context.tenantId);
        if (!subject) {
            throw new NotFoundError('Subject not found', {
                code: SUBJECT_ERROR_CODES.NOT_FOUND,
            });
        }

        return toSubjectResponse(subject);
    }

    /**
     * List subjects with filtering and pagination
     */
    async listSubjects(
        options: SubjectListOptions,
        context: SubjectContext
    ): Promise<PaginatedSubjectsResponse> {
        const skip = (options.page - 1) * options.limit;
        const orderBy = { [options.sortBy || 'name']: options.sortOrder || 'asc' };

        const { subjects, total } = await this.repository.findMany(context.tenantId, {
            skip,
            take: options.limit,
            orderBy,
            filters: options.filters,
        });

        return {
            subjects: toSubjectResponseList(subjects),
            pagination: {
                total,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(total / options.limit),
            },
        };
    }

    /**
     * Update a subject
     */
    async updateSubject(
        id: string,
        input: UpdateSubjectInput,
        context: SubjectContext
    ): Promise<SubjectResponse> {
        const existingSubject = await this.repository.findById(id, context.tenantId);
        if (!existingSubject) {
            throw new NotFoundError('Subject not found', {
                code: SUBJECT_ERROR_CODES.NOT_FOUND,
            });
        }

        // Check for duplicate code if code is being updated
        if (input.code && input.code !== existingSubject.code) {
            const subjectWithCode = await this.repository.findByCode(input.code, context.tenantId);
            if (subjectWithCode && subjectWithCode.id !== id) {
                throw new ConflictError('A subject with this code already exists', {
                    code: SUBJECT_ERROR_CODES.CODE_ALREADY_EXISTS,
                });
            }
        }

        // Check for duplicate name if name is being updated
        if (input.name && input.name !== existingSubject.name) {
            const subjectWithName = await this.repository.findByName(input.name, context.tenantId);
            if (subjectWithName && subjectWithName.id !== id) {
                throw new ConflictError('A subject with this name already exists', {
                    code: SUBJECT_ERROR_CODES.NAME_ALREADY_EXISTS,
                });
            }
        }

        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.code !== undefined) updateData.code = input.code;
        if (input.type !== undefined) updateData.type = input.type;
        if (input.creditHours !== undefined) updateData.creditHours = input.creditHours;
        if (input.description !== undefined) updateData.description = input.description;

        const updatedSubject = await this.repository.update(id, updateData);

        logger.info('Subject updated', {
            subjectId: id,
            tenantId: context.tenantId,
            updatedBy: context.userId,
        });

        return toSubjectResponse(updatedSubject);
    }

    /**
     * Delete a subject (soft delete)
     */
    async deleteSubject(id: string, context: SubjectContext): Promise<void> {
        const subject = await this.repository.findById(id, context.tenantId);
        if (!subject) {
            throw new NotFoundError('Subject not found', {
                code: SUBJECT_ERROR_CODES.NOT_FOUND,
            });
        }

        // Check for dependencies
        const hasDependencies = await this.repository.hasDependencies(id);
        if (hasDependencies) {
            throw new ConflictError(
                'Cannot delete subject linked to classes',
                { code: SUBJECT_ERROR_CODES.HAS_DEPENDENCIES }
            );
        }

        await this.repository.softDelete(id);

        logger.info('Subject deleted', {
            subjectId: id,
            tenantId: context.tenantId,
            deletedBy: context.userId,
        });
    }
}

export const subjectsService = new SubjectsService();
