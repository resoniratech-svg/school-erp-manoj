/**
 * Reports Module Barrel Export
 */
export { reportsRoutes } from './reports.routes';
export { reportsService } from './reports.service';
export { reportsController } from './reports.controller';
export * from './reports.types';
export * from './reports.constants';

// Re-export sub-modules
export * from './report-cards';
export * from './transcripts';
