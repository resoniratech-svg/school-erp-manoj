/**
 * Assignments Sub-module Controller
 */
import { transportController } from '../transport.controller';

export const assignmentsController = {
    create: transportController.createAssignment,
    get: transportController.getAssignment,
    list: transportController.listAssignments,
    update: transportController.updateAssignment,
    cancel: transportController.cancelAssignment,
};
