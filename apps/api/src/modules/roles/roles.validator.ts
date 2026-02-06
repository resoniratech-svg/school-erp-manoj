import { z } from 'zod';
import { PAGINATION_DEFAULTS } from './roles.constants';

export const createRoleSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Code is required').max(50).regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    permissionIds: z.array(z.string().uuid()).optional(),
  }).strict(),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid role ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
    permissionIds: z.array(z.string().uuid()).optional(),
  }).strict(),
});

export const roleIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid role ID'),
  }),
});

export const listRolesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.PAGE),
    limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.MAX_LIMIT).default(PAGINATION_DEFAULTS.LIMIT),
    sortBy: z.enum(['createdAt', 'name', 'code']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    search: z.string().max(100).optional(),
    isSystem: z.coerce.boolean().optional(),
  }),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>['body'];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>['body'];
export type ListRolesQuery = z.infer<typeof listRolesSchema>['query'];
