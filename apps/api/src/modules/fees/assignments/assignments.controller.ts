/**
 * Fee Assignments Controller
 */
import { feesController } from '../fees.controller';

export const assignmentsController = {
    assign: feesController.assignFee,
    bulkAssign: feesController.bulkAssignFee,
    get: feesController.getAssignment,
    list: feesController.listAssignments,
};
