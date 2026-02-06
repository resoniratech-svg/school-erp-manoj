import type { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse } from '@school-erp/shared';
import { usersService, UsersService } from './users.service';
import { getRequestContext } from '../authz';
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUsersQuery,
  AssignRoleInput,
  AssignBranchInput,
} from './users.validator';

export class UsersController {
  constructor(private readonly service: UsersService = usersService) {}

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const input = req.body as CreateUserInput;

      const user = await this.service.createUser(input, {
        tenantId: context.tenant.id,
        userId: context.user.id,
      });

      res.status(201).json(
        createApiResponse(user, {
          message: 'User created successfully',
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const { id } = req.params;

      const user = await this.service.getUserById(id, {
        tenantId: context.tenant.id,
        userId: context.user.id,
      });

      res.status(200).json(
        createApiResponse(user, {
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const query = req.query as unknown as ListUsersQuery;

      const result = await this.service.listUsers(
        {
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
          filters: {
            status: query.status,
            userType: query.userType,
            branchId: query.branchId,
            search: query.search,
          },
        },
        {
          tenantId: context.tenant.id,
          userId: context.user.id,
        }
      );

      res.status(200).json(
        createApiResponse(result, {
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const { id } = req.params;
      const input = req.body as UpdateUserInput;

      const user = await this.service.updateUser(id, input, {
        tenantId: context.tenant.id,
        userId: context.user.id,
      });

      res.status(200).json(
        createApiResponse(user, {
          message: 'User updated successfully',
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const { id } = req.params;

      await this.service.deleteUser(id, {
        tenantId: context.tenant.id,
        userId: context.user.id,
      });

      res.status(200).json(
        createEmptyResponse('User deleted successfully', req.requestId)
      );
    } catch (error) {
      next(error);
    }
  };

  assignRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const { id } = req.params;
      const input = req.body as AssignRoleInput;

      await this.service.assignRole(id, input.roleId, input.branchId, {
        tenantId: context.tenant.id,
        userId: context.user.id,
      });

      res.status(200).json(
        createEmptyResponse('Role assigned successfully', req.requestId)
      );
    } catch (error) {
      next(error);
    }
  };

  removeRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const { id, roleId } = req.params;

      await this.service.removeRole(id, roleId, {
        tenantId: context.tenant.id,
        userId: context.user.id,
      });

      res.status(200).json(
        createEmptyResponse('Role removed successfully', req.requestId)
      );
    } catch (error) {
      next(error);
    }
  };

  assignBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const { id } = req.params;
      const input = req.body as AssignBranchInput;

      await this.service.assignBranch(id, input.branchId, input.isPrimary, {
        tenantId: context.tenant.id,
        userId: context.user.id,
      });

      res.status(200).json(
        createEmptyResponse('Branch assigned successfully', req.requestId)
      );
    } catch (error) {
      next(error);
    }
  };

  removeBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const { id, branchId } = req.params;

      await this.service.removeBranch(id, branchId, {
        tenantId: context.tenant.id,
        userId: context.user.id,
      });

      res.status(200).json(
        createEmptyResponse('Branch removed successfully', req.requestId)
      );
    } catch (error) {
      next(error);
    }
  };
}

export const usersController = new UsersController();
