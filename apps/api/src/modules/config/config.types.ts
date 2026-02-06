/**
 * System Config Types
 */

// Config Entry (database representation)
export interface ConfigEntry {
    id: string;
    configKey: string;
    configValue: string;
    valueType: string;
    scope: string;
    tenantId: string;
    branchId: string | null;
    updatedBy: string;
    updatedAt: Date;
    createdAt: Date;
}

// Config Response (single config)
export interface ConfigResponse {
    key: string;
    value: unknown;
    valueType: string;
    scope: string;
    branchId: string | null;
    updatedBy: string;
    updatedAt: Date;
}

// Resolved Config Response (merged tenant + branch)
export interface ResolvedConfigResponse {
    key: string;
    value: unknown;
    valueType: string;
    source: 'default' | 'tenant' | 'branch';
    tenantValue: unknown | null;
    branchOverride: unknown | null;
}

// All Configs Response
export interface AllConfigsResponse {
    configs: ResolvedConfigResponse[];
    scope: {
        tenantId: string;
        branchId: string | null;
    };
}

// Update Config Input
export interface UpdateConfigInput {
    key: string;
    value: unknown;
}

// Batch Update Input
export interface BatchUpdateConfigInput {
    configs: UpdateConfigInput[];
    scope?: 'TENANT' | 'BRANCH';
}

// Context
export interface ConfigContext {
    tenantId: string;
    branchId?: string;
    userId: string;
}
