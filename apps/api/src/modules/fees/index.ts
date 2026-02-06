/**
 * Fees Module Barrel Export
 */
export { feesRoutes } from './fees.routes';
export { feesService } from './fees.service';
export { feesController } from './fees.controller';
export * from './fees.types';
export * from './fees.constants';

// Re-export sub-modules
export * from './structures';
export * from './assignments';
export * from './payments';
