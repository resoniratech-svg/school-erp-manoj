/**
 * Library Module Barrel Export
 */
export { libraryRoutes } from './library.routes';
export { libraryService } from './library.service';
export { libraryController } from './library.controller';
export * from './library.types';
export * from './library.constants';

// Re-export sub-modules
export * from './books';
export * from './issues';
