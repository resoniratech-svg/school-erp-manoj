/**
 * Issues Sub-module Controller
 * NO DELETE ENDPOINT
 */
import { libraryController } from '../library.controller';

export const issuesController = {
    create: libraryController.createIssue,
    get: libraryController.getIssue,
    list: libraryController.listIssues,
    return: libraryController.returnBook,
    // NO DELETE
};
