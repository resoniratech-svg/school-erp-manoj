import { z } from 'zod';
import { USER_STATUS_OPTIONS, USER_TYPE_OPTIONS, PAGINATION_DEFAULTS } from './users.constants';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').max(255),
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    phone: z.string().max(20).optional(),
    userType: z.enum(USER_TYPE_OPTIONS, { errorMap: () => ({ message: 'Invalid user type' }) }),
    branchIds: z.array(z.string().uuid()).optional(),
    primaryBranchId: z.string().uuid().optional(),
  }).strict(),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    email: z.string().email('Invalid email address').max(255).optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).nullable().optional(),
    avatarUrl: z.string().url().max(500).nullable().optional(),
    userType: z.enum(USER_TYPE_OPTIONS).optional(),
    status: z.enum(USER_STATUS_OPTIONS).optional(),
  }).strict(),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.PAGE),
    limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.MAX_LIMIT).default(PAGINATION_DEFAULTS.LIMIT),
    sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'email', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    status: z.enum(USER_STATUS_OPTIONS).optional(),
    userType: z.enum(USER_TYPE_OPTIONS).optional(),
    branchId: z.string().uuid().optional(),
    search: z.string().max(100).optional(),
  }),
});

export const assignRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    roleId: z.string().uuid('Invalid role ID'),
    branchId: z.string().uuid('Invalid branch ID').optional(),
  }).strict(),
});

export const removeRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
    roleId: z.string().uuid('Invalid role ID'),
  }),
});

export const assignBranchSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    branchId: z.string().uuid('Invalid branch ID'),
    isPrimary: z.boolean().default(false),
  }).strict(),
});

export const removeBranchSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
    branchId: z.string().uuid('Invalid branch ID'),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type ListUsersQuery = z.infer<typeof listUsersSchema>['query'];
export type AssignRoleInput = z.infer<typeof assignRoleSchema>['body'];
export type AssignBranchInput = z.infer<typeof assignBranchSchema>['body'];
