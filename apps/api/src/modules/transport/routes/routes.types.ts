/**
 * Transport Routes Sub-module Types
 */
import type { TransportRouteResponse } from '../transport.types';

export interface RouteListResponse {
    routes: TransportRouteResponse[];
    total: number;
}
