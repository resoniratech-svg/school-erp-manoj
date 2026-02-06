/**
 * Communication Module Barrel Export
 */
export { communicationRoutes } from './communication.routes';
export { communicationService } from './communication.service';
export { communicationController } from './communication.controller';
export * from './communication.types';
export * from './communication.constants';

// Re-export sub-modules
export * from './announcements';
export * from './notifications';
