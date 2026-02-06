/**
 * Exams Module Barrel Export
 */
export { examsRoutes } from './exams.routes';
export { examsService } from './exams.service';
export { examsController } from './exams.controller';
export * from './exams.types';
export * from './exams.constants';

// Re-export sub-modules
export * from './schedules';
export * from './marks';
export * from './grades';
