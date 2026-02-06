/**
 * Vehicles Sub-module Types
 */
import type { VehicleResponse } from '../transport.types';

export interface VehicleListResponse {
    vehicles: VehicleResponse[];
    total: number;
}
