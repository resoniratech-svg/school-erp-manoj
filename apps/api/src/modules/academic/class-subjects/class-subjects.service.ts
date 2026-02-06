/**
 * Class-Subjects Service
 * Business logic layer
 */
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '@school-erp/shared';
import { classSubjectsRepository, ClassSubjectsRepository } from './class-subjects.repository';
import { CLASS_SUBJECT_ERROR_CODES } from './class-subjects.constants';
import type {
    ClassSubjectResponse,
    ClassSubjectContext,
    AssignSubjectInput,
} from './class-subjects.types';
import { getLogger } from '../../../utils/logger';


const logger = getLogger();

function toClassSubjectResponse(classSubject: {
    classId: string;
    subjectId: string;
    isMandatory: boolean;
    periodsPerWeek: number | null;
    createdAt: Date;
    subject: {
        id: string;
        name: string;
        code: string;
        type: string;
    };
}): ClassSubjectResponse {
    return {
        classId: classSubject.classId,
        subjectId: classSubject.subjectId,
        isMandatory: classSubject.isMandatory,
        periodsPerWeek: classSubject.periodsPerWeek,
        createdAt: classSubject.createdAt.toISOString(),
        subject: {
            id: classSubject.subject.id,
            name: classSubject.subject.name,
            code: classSubject.subject.code,
            type: classSubject.subject.type,
        },
    };
}

export class ClassSubjectsService {
    constructor(private readonly repository: ClassSubjectsRepository = classSubjectsRepository) { }

    /**
     * Validate class exists and belongs to tenant + branch
     */
    private async validateClass(classId: string, context: ClassSubjectContext) {
        const classEntity = await this.repository.findClassById(
            classId,
            context.tenantId,
            context.branchId
        );
        if (!classEntity) {
            throw new NotFoundError('Class not found or access denied', {
                code: CLASS_SUBJECT_ERROR_CODES.CLASS_NOT_FOUND,
            });
        }
        return classEntity;
    }

    /**
     * Validate subject exists and belongs to tenant
     */
    private async validateSubject(subjectId: string, tenantId: string) {
        const subject = await this.repository.findSubjectById(subjectId, tenantId);
        if (!subject) {
            throw new NotFoundError('Subject not found', {
                code: CLASS_SUBJECT_ERROR_CODES.SUBJECT_NOT_FOUND,
            });
        }
        if (subject.deletedAt) {
            throw new BadRequestError('Subject has been deleted', {
                code: CLASS_SUBJECT_ERROR_CODES.SUBJECT_DELETED,
            });
        }
        return subject;
    }

    /**
     * Assign a subject to a class
     */
    async assignSubject(
        classId: string,
        input: AssignSubjectInput,
        context: ClassSubjectContext
    ): Promise<ClassSubjectResponse> {
        // Validate class
        await this.validateClass(classId, context);

        // Validate subject
        await this.validateSubject(input.subjectId, context.tenantId);

        // Check if already assigned
        const existing = await this.repository.findClassSubject(classId, input.subjectId);
        if (existing) {
            throw new ConflictError('Subject is already assigned to this class', {
                code: CLASS_SUBJECT_ERROR_CODES.ALREADY_ASSIGNED,
            });
        }

        const classSubject = await this.repository.create({
            classId,
            subjectId: input.subjectId,
            isMandatory: input.isMandatory ?? true,
            periodsPerWeek: input.periodsPerWeek,
        });

        logger.info('Subject assigned to class', {
            classId,
            subjectId: input.subjectId,
            tenantId: context.tenantId,
            assignedBy: context.userId,
        });

        return toClassSubjectResponse(classSubject);
    }

    /**
     * List all subjects for a class
     */
    async listClassSubjects(
        classId: string,
        context: ClassSubjectContext
    ): Promise<ClassSubjectResponse[]> {
        // Validate class
        await this.validateClass(classId, context);

        const classSubjects = await this.repository.findByClassId(classId);
        return classSubjects.map(toClassSubjectResponse);
    }

    /**
     * Remove a subject from a class
     */
    async removeSubject(
        classId: string,
        subjectId: string,
        context: ClassSubjectContext
    ): Promise<void> {
        // Validate class
        await this.validateClass(classId, context);

        // Check if assigned
        const existing = await this.repository.findClassSubject(classId, subjectId);
        if (!existing) {
            throw new NotFoundError('Subject is not assigned to this class', {
                code: CLASS_SUBJECT_ERROR_CODES.NOT_ASSIGNED,
            });
        }

        // Check for dependencies
        const hasDependencies = await this.repository.hasDependencies(classId, subjectId);
        if (hasDependencies) {
            throw new ConflictError(
                'Cannot remove subject with existing timetable entries or exams',
                { code: CLASS_SUBJECT_ERROR_CODES.HAS_DEPENDENCIES }
            );
        }

        await this.repository.delete(classId, subjectId);

        logger.info('Subject removed from class', {
            classId,
            subjectId,
            tenantId: context.tenantId,
            removedBy: context.userId,
        });
    }
}

export const classSubjectsService = new ClassSubjectsService();
