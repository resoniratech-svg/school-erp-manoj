/**
 * System Config Validators
 * Strict key validation against whitelist
 */
import { z } from 'zod';
import { CONFIG_SCOPE, ALLOWED_CONFIG_KEYS, CONFIG_VALUE_TYPE } from './config.constants';

// Valid config keys (from whitelist)
const validConfigKeys = Object.keys(ALLOWED_CONFIG_KEYS) as [string, ...string[]];

// Key format: dot.notation.keys
const configKeySchema = z.string()
    .min(1)
    .max(100)
    .regex(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/,
        'Key must be in dot.notation.format');

// Single config update
const updateConfigItemSchema = z.object({
    key: configKeySchema.refine(
        (key) => key in ALLOWED_CONFIG_KEYS,
        { message: 'Unknown config key' }
    ),
    value: z.union([z.boolean(), z.number(), z.string()]),
});

// Get configs query
export const getConfigsSchema = z.object({
    query: z.object({
        scope: z.enum([CONFIG_SCOPE.TENANT, CONFIG_SCOPE.BRANCH]).optional(),
        prefix: z.string().max(50).optional(),
    }),
});

// Update single config
export const updateConfigSchema = z.object({
    body: z.object({
        key: configKeySchema.refine(
            (key) => key in ALLOWED_CONFIG_KEYS,
            { message: 'Unknown config key' }
        ),
        value: z.union([z.boolean(), z.number(), z.string()]),
        scope: z.enum([CONFIG_SCOPE.TENANT, CONFIG_SCOPE.BRANCH]).optional(),
    }).refine(
        (data) => {
            const keyConfig = ALLOWED_CONFIG_KEYS[data.key as keyof typeof ALLOWED_CONFIG_KEYS];
            if (!keyConfig) return false;

            switch (keyConfig.type) {
                case CONFIG_VALUE_TYPE.BOOLEAN:
                    return typeof data.value === 'boolean';
                case CONFIG_VALUE_TYPE.NUMBER:
                    return typeof data.value === 'number';
                case CONFIG_VALUE_TYPE.STRING:
                case CONFIG_VALUE_TYPE.ENUM:
                    return typeof data.value === 'string';
                default:
                    return false;
            }
        },
        { message: 'Value type does not match expected type for this key' }
    ),
});

// Batch update configs
export const batchUpdateConfigSchema = z.object({
    body: z.object({
        configs: z.array(updateConfigItemSchema).min(1).max(50),
        scope: z.enum([CONFIG_SCOPE.TENANT, CONFIG_SCOPE.BRANCH]).optional(),
    }),
});

// Get single config by key
export const getConfigByKeySchema = z.object({
    params: z.object({
        key: configKeySchema,
    }),
});

// Type exports
export type GetConfigsQuery = z.infer<typeof getConfigsSchema>['query'];
export type UpdateConfigBody = z.infer<typeof updateConfigSchema>['body'];
export type BatchUpdateConfigBody = z.infer<typeof batchUpdateConfigSchema>['body'];
