/**
 * Timetable Service
 * Business logic layer with conflict detection
 */
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '@school-erp/shared';
import { timetableRepository, TimetableRepository } from './timetable.repository';
import { toTimetableResponse, toTimetableEntryResponse } from './timetable.mapper';
import { TIMETABLE_ERROR_CODES } from './timetable.constants';
import type {
    TimetableResponse,
    TimetableEntryResponse,
    TimetableContext,
    CreateTimetableInput,
    CreateTimetableEntryInput,
    UpdateTimetableInput,
} from './timetable.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

export class TimetableService {
    constructor(private readonly repository: TimetableRepository = timetableRepository) { }

    /**
     * Validate all references before creating entry
     */
    private async validateEntryReferences(
        timetableId: string,
        classId: string,
        input: CreateTimetableEntryInput,
        context: TimetableContext
    ) {
        // Validate period exists
        const period = await this.repository.findPeriodById(
            input.periodId,
            context.tenantId,
            context.branchId
        );
        if (!period) {
            throw new NotFoundError('Period not found', {
                code: TIMETABLE_ERROR_CODES.PERIOD_NOT_FOUND,
            });
        }

        // Validate subject exists
        const subject = await this.repository.findSubjectById(input.subjectId, context.tenantId);
        if (!subject) {
            throw new NotFoundError('Subject not found', {
                code: TIMETABLE_ERROR_CODES.SUBJECT_NOT_FOUND,
            });
        }

        // Validate subject is mapped to class
        const classSubject = await this.repository.findClassSubjectMapping(classId, input.subjectId);
        if (!classSubject) {
            throw new BadRequestError('Subject is not assigned to this class', {
                code: TIMETABLE_ERROR_CODES.SUBJECT_NOT_MAPPED,
            });
        }

        // Validate teacher exists
        const teacher = await this.repository.findTeacherById(input.teacherId, context.tenantId);
        if (!teacher) {
            throw new NotFoundError('Teacher not found', {
                code: TIMETABLE_ERROR_CODES.TEACHER_NOT_FOUND,
            });
        }

        // Teacher must belong to same branch
        if (teacher.branchId !== context.branchId) {
            throw new BadRequestError('Teacher does not belong to this branch', {
                code: TIMETABLE_ERROR_CODES.TEACHER_WRONG_BRANCH,
            });
        }

        // Check teacher conflict
        const teacherConflict = await this.repository.checkTeacherConflict(
            context.tenantId,
            context.branchId,
            input.teacherId,
            input.dayOfWeek,
            input.periodId
        );
        if (teacherConflict) {
            throw new ConflictError(
                `Teacher is already assigned to ${teacherConflict.timetable.class.name} - ${teacherConflict.timetable.section.name} at this time`,
                { code: TIMETABLE_ERROR_CODES.TEACHER_CONFLICT }
            );
        }

        // Check section conflict
        const sectionConflict = await this.repository.checkSectionConflict(
            timetableId,
            input.dayOfWeek,
            input.periodId
        );
        if (sectionConflict) {
            throw new ConflictError(
                `Section already has ${sectionConflict.subject.name} at this time`,
                { code: TIMETABLE_ERROR_CODES.SECTION_CONFLICT }
            );
        }
    }

    /**
     * Create a new timetable
     */
    async createTimetable(
        input: CreateTimetableInput,
        context: TimetableContext
    ): Promise<TimetableResponse> {
        // Validate academic year
        const academicYear = await this.repository.findAcademicYearById(
            input.academicYearId,
            context.tenantId
        );
        if (!academicYear) {
            throw new NotFoundError('Academic year not found', {
                code: TIMETABLE_ERROR_CODES.ACADEMIC_YEAR_NOT_FOUND,
            });
        }

        // Validate class
        const classEntity = await this.repository.findClassById(
            input.classId,
            context.tenantId,
            context.branchId
        );
        if (!classEntity) {
            throw new NotFoundError('Class not found', {
                code: TIMETABLE_ERROR_CODES.CLASS_NOT_FOUND,
            });
        }

        // Validate section belongs to class
        const section = await this.repository.findSectionById(input.sectionId, input.classId);
        if (!section) {
            throw new NotFoundError('Section not found or does not belong to class', {
                code: TIMETABLE_ERROR_CODES.SECTION_NOT_FOUND,
            });
        }

        const timetable = await this.repository.create({
            tenantId: context.tenantId,
            branchId: context.branchId,
            academicYearId: input.academicYearId,
            classId: input.classId,
            sectionId: input.sectionId,
            effectiveFrom: new Date(input.effectiveFrom),
            effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : undefined,
        });

        logger.info('Timetable created', {
            timetableId: timetable.id,
            classId: input.classId,
            sectionId: input.sectionId,
            createdBy: context.userId,
        });

        return toTimetableResponse(timetable);
    }

    /**
     * Add an entry to a timetable
     */
    async addEntry(
        timetableId: string,
        input: CreateTimetableEntryInput,
        context: TimetableContext
    ): Promise<TimetableEntryResponse> {
        const timetable = await this.repository.findById(
            timetableId,
            context.tenantId,
            context.branchId
        );
        if (!timetable) {
            throw new NotFoundError('Timetable not found', {
                code: TIMETABLE_ERROR_CODES.NOT_FOUND,
            });
        }

        // Validate all references and check conflicts
        await this.validateEntryReferences(timetableId, timetable.classId, input, context);

        const entry = await this.repository.createEntry({
            timetableId,
            dayOfWeek: input.dayOfWeek,
            periodId: input.periodId,
            subjectId: input.subjectId,
            teacherId: input.teacherId,
        });

        logger.info('Timetable entry added', {
            timetableId,
            entryId: entry.id,
            dayOfWeek: input.dayOfWeek,
            periodId: input.periodId,
            addedBy: context.userId,
        });

        return toTimetableEntryResponse(entry);
    }

    /**
     * Remove an entry from a timetable
     */
    async removeEntry(
        timetableId: string,
        entryId: string,
        context: TimetableContext
    ): Promise<void> {
        const timetable = await this.repository.findById(
            timetableId,
            context.tenantId,
            context.branchId
        );
        if (!timetable) {
            throw new NotFoundError('Timetable not found', {
                code: TIMETABLE_ERROR_CODES.NOT_FOUND,
            });
        }

        const entry = await this.repository.findEntryById(entryId);
        if (!entry || entry.timetableId !== timetableId) {
            throw new NotFoundError('Entry not found', {
                code: TIMETABLE_ERROR_CODES.ENTRY_NOT_FOUND,
            });
        }

        await this.repository.deleteEntry(entryId);

        logger.info('Timetable entry removed', {
            timetableId,
            entryId,
            removedBy: context.userId,
        });
    }

    /**
     * Get timetable by ID
     */
    async getTimetableById(id: string, context: TimetableContext): Promise<TimetableResponse> {
        const timetable = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!timetable) {
            throw new NotFoundError('Timetable not found', {
                code: TIMETABLE_ERROR_CODES.NOT_FOUND,
            });
        }
        return toTimetableResponse(timetable);
    }

    /**
     * List timetables with filters
     */
    async listTimetables(
        filters: { academicYearId?: string; classId?: string; isActive?: boolean },
        context: TimetableContext
    ): Promise<TimetableResponse[]> {
        const timetables = await this.repository.findMany(
            context.tenantId,
            context.branchId,
            filters
        );
        return timetables.map(toTimetableResponse);
    }

    /**
     * Get timetable for a class
     */
    async getClassTimetable(
        classId: string,
        sectionId: string | undefined,
        context: TimetableContext
    ): Promise<TimetableResponse[]> {
        // Validate class
        const classEntity = await this.repository.findClassById(
            classId,
            context.tenantId,
            context.branchId
        );
        if (!classEntity) {
            throw new NotFoundError('Class not found', {
                code: TIMETABLE_ERROR_CODES.CLASS_NOT_FOUND,
            });
        }

        const timetables = await this.repository.findByClassSection(
            context.tenantId,
            context.branchId,
            classId,
            sectionId
        );
        return timetables.map(toTimetableResponse);
    }

    /**
     * Get timetable entries for a teacher
     */
    async getTeacherTimetable(
        teacherId: string,
        context: TimetableContext
    ) {
        const teacher = await this.repository.findTeacherById(teacherId, context.tenantId);
        if (!teacher) {
            throw new NotFoundError('Teacher not found', {
                code: TIMETABLE_ERROR_CODES.TEACHER_NOT_FOUND,
            });
        }

        const entries = await this.repository.findByTeacher(
            context.tenantId,
            context.branchId,
            teacherId
        );
        return entries;
    }

    /**
     * Update timetable
     */
    async updateTimetable(
        id: string,
        input: UpdateTimetableInput,
        context: TimetableContext
    ): Promise<TimetableResponse> {
        const timetable = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!timetable) {
            throw new NotFoundError('Timetable not found', {
                code: TIMETABLE_ERROR_CODES.NOT_FOUND,
            });
        }

        const updated = await this.repository.update(id, {
            effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined,
            effectiveTo: input.effectiveTo !== undefined
                ? (input.effectiveTo ? new Date(input.effectiveTo) : null)
                : undefined,
            isActive: input.isActive,
        });

        logger.info('Timetable updated', {
            timetableId: id,
            updatedBy: context.userId,
        });

        return toTimetableResponse(updated);
    }

    /**
     * Delete timetable (soft delete)
     */
    async deleteTimetable(id: string, context: TimetableContext): Promise<void> {
        const timetable = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!timetable) {
            throw new NotFoundError('Timetable not found', {
                code: TIMETABLE_ERROR_CODES.NOT_FOUND,
            });
        }

        await this.repository.softDelete(id);

        logger.info('Timetable deleted', {
            timetableId: id,
            deletedBy: context.userId,
        });
    }

    /**
     * Validate timetable entries (bulk check)
     */
    async validateEntries(
        timetableId: string,
        entries: CreateTimetableEntryInput[],
        context: TimetableContext
    ): Promise<{ valid: boolean; errors: string[] }> {
        const timetable = await this.repository.findById(
            timetableId,
            context.tenantId,
            context.branchId
        );
        if (!timetable) {
            return { valid: false, errors: ['Timetable not found'] };
        }

        const errors: string[] = [];

        for (const entry of entries) {
            try {
                await this.validateEntryReferences(timetableId, timetable.classId, entry, context);
            } catch (error) {
                if (error instanceof Error) {
                    errors.push(`${entry.dayOfWeek} Period ${entry.periodId}: ${error.message}`);
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }
}

export const timetableService = new TimetableService();
