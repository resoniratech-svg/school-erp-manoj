/**
 * Fee Structures Controller
 */
import { feesController } from '../fees.controller';

export const structuresController = {
    create: feesController.createStructure,
    get: feesController.getStructure,
    list: feesController.listStructures,
    update: feesController.updateStructure,
};
