/**
 * Sections Service
 * Business logic layer
 */
import {
    NotFoundError,
    BadRequestError,
    ConflictError,
} from '@school-erp/shared';
import { sectionsRepository, SectionsRepository } from './sections.repository';
import { toSectionResponse, toSectionResponseList } from './sections.mapper';
import { SECTION_ERROR_CODES } from './sections.constants';
import type {
    SectionResponse,
    SectionListOptions,
    PaginatedSectionsResponse,
    SectionContext,
} from './sections.types';
import type {
    CreateSectionInput,
    UpdateSectionInput,
    AssignClassTeacherInput,
} from './sections.validator';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

export class SectionsService {
    constructor(private readonly repository: SectionsRepository = sectionsRepository) { }

    /**
     * Validate class exists and belongs to tenant + branch
     */
    private async validateClass(classId: string, context: SectionContext) {
        const classEntity = await this.repository.findClassById(
            classId,
            context.tenantId,
            context.branchId
        );
        if (!classEntity) {
            throw new NotFoundError('Class not found or access denied', {
                code: SECTION_ERROR_CODES.CLASS_NOT_FOUND,
            });
        }
        return classEntity;
    }

    /**
     * Validate staff exists and belongs to tenant
     */
    private async validateStaff(staffId: string, tenantId: string) {
        const staff = await this.repository.findStaffById(staffId, tenantId);
        if (!staff) {
            throw new NotFoundError('Staff not found', {
                code: SECTION_ERROR_CODES.STAFF_NOT_FOUND,
            });
        }
        if (staff.status !== 'active') {
            throw new BadRequestError('Staff is not active', {
                code: SECTION_ERROR_CODES.STAFF_INACTIVE,
            });
        }
        return staff;
    }

    /**
     * Create a new section
     */
    async createSection(
        input: CreateSectionInput,
        context: SectionContext
    ): Promise<SectionResponse> {
        // Validate class exists and belongs to tenant + branch
        await this.validateClass(input.classId, context);

        // Check for duplicate code within class
        const existingSection = await this.repository.findByCode(input.code, input.classId);
        if (existingSection) {
            throw new ConflictError('A section with this code already exists in this class', {
                code: SECTION_ERROR_CODES.ALREADY_EXISTS,
            });
        }

        // Validate class teacher if provided
        if (input.classTeacherId) {
            await this.validateStaff(input.classTeacherId, context.tenantId);
        }

        const section = await this.repository.create({
            classId: input.classId,
            name: input.name,
            code: input.code,
            capacity: input.capacity,
            room: input.room,
            classTeacherId: input.classTeacherId,
        });

        logger.info('Section created', {
            sectionId: section.id,
            classId: input.classId,
            tenantId: context.tenantId,
            createdBy: context.userId,
        });

        return toSectionResponse(section);
    }

    /**
     * Get section by ID
     */
    async getSectionById(
        id: string,
        context: SectionContext
    ): Promise<SectionResponse> {
        const section = await this.repository.findById(id);
        if (!section) {
            throw new NotFoundError('Section not found', {
                code: SECTION_ERROR_CODES.NOT_FOUND,
            });
        }

        // Validate tenant + branch access via class
        if (
            section.class.tenantId !== context.tenantId ||
            section.class.branchId !== context.branchId
        ) {
            throw new NotFoundError('Section not found', {
                code: SECTION_ERROR_CODES.NOT_FOUND,
            });
        }

        return toSectionResponse(section);
    }

    /**
     * List sections with filtering and pagination
     */
    async listSections(
        options: SectionListOptions,
        context: SectionContext
    ): Promise<PaginatedSectionsResponse> {
        // Validate class belongs to tenant + branch
        await this.validateClass(options.filters.classId, context);

        const skip = (options.page - 1) * options.limit;
        const orderBy = { [options.sortBy || 'name']: options.sortOrder || 'asc' };

        const { sections, total } = await this.repository.findMany({
            skip,
            take: options.limit,
            orderBy,
            filters: options.filters,
        });

        return {
            sections: toSectionResponseList(sections),
            pagination: {
                total,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(total / options.limit),
            },
        };
    }

    /**
     * Update a section
     */
    async updateSection(
        id: string,
        input: UpdateSectionInput,
        context: SectionContext
    ): Promise<SectionResponse> {
        const existingSection = await this.repository.findById(id);
        if (!existingSection) {
            throw new NotFoundError('Section not found', {
                code: SECTION_ERROR_CODES.NOT_FOUND,
            });
        }

        // Validate tenant + branch access via class
        if (
            existingSection.class.tenantId !== context.tenantId ||
            existingSection.class.branchId !== context.branchId
        ) {
            throw new NotFoundError('Section not found', {
                code: SECTION_ERROR_CODES.NOT_FOUND,
            });
        }

        // Check for duplicate code if code is being updated
        if (input.code && input.code !== existingSection.code) {
            const sectionWithCode = await this.repository.findByCode(
                input.code,
                existingSection.classId
            );
            if (sectionWithCode && sectionWithCode.id !== id) {
                throw new ConflictError('A section with this code already exists in this class', {
                    code: SECTION_ERROR_CODES.ALREADY_EXISTS,
                });
            }
        }

        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.code !== undefined) updateData.code = input.code;
        if (input.capacity !== undefined) updateData.capacity = input.capacity;
        if (input.room !== undefined) updateData.room = input.room;

        const updatedSection = await this.repository.update(id, updateData);

        logger.info('Section updated', {
            sectionId: id,
            tenantId: context.tenantId,
            updatedBy: context.userId,
        });

        return toSectionResponse(updatedSection);
    }

    /**
     * Assign or remove class teacher
     */
    async assignClassTeacher(
        id: string,
        input: AssignClassTeacherInput,
        context: SectionContext
    ): Promise<SectionResponse> {
        const existingSection = await this.repository.findById(id);
        if (!existingSection) {
            throw new NotFoundError('Section not found', {
                code: SECTION_ERROR_CODES.NOT_FOUND,
            });
        }

        // Validate tenant + branch access via class
        if (
            existingSection.class.tenantId !== context.tenantId ||
            existingSection.class.branchId !== context.branchId
        ) {
            throw new NotFoundError('Section not found', {
                code: SECTION_ERROR_CODES.NOT_FOUND,
            });
        }

        // Validate class teacher if provided (null means remove)
        if (input.classTeacherId) {
            await this.validateStaff(input.classTeacherId, context.tenantId);
        }

        const updatedSection = await this.repository.update(id, {
            classTeacherId: input.classTeacherId,
        });

        logger.info('Section class teacher updated', {
            sectionId: id,
            classTeacherId: input.classTeacherId,
            tenantId: context.tenantId,
            updatedBy: context.userId,
        });

        return toSectionResponse(updatedSection);
    }

    /**
     * Delete a section (soft delete)
     */
    async deleteSection(id: string, context: SectionContext): Promise<void> {
        const section = await this.repository.findById(id);
        if (!section) {
            throw new NotFoundError('Section not found', {
                code: SECTION_ERROR_CODES.NOT_FOUND,
            });
        }

        // Validate tenant + branch access via class
        if (
            section.class.tenantId !== context.tenantId ||
            section.class.branchId !== context.branchId
        ) {
            throw new NotFoundError('Section not found', {
                code: SECTION_ERROR_CODES.NOT_FOUND,
            });
        }

        // Check for dependencies
        const hasDependencies = await this.repository.hasDependencies(id);
        if (hasDependencies) {
            throw new ConflictError(
                'Cannot delete section with existing enrollments or timetable entries',
                { code: SECTION_ERROR_CODES.HAS_DEPENDENCIES }
            );
        }

        await this.repository.softDelete(id);

        logger.info('Section deleted', {
            sectionId: id,
            tenantId: context.tenantId,
            deletedBy: context.userId,
        });
    }
}

export const sectionsService = new SectionsService();
