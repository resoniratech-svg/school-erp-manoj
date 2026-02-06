/**
 * Payments Controller
 */
import { feesController } from '../fees.controller';

export const paymentsController = {
    record: feesController.recordPayment,
    get: feesController.getPayment,
    list: feesController.listPayments,
    // NO DELETE ENDPOINT - Payments are append-only
};
