import type { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse } from '@school-erp/shared';
import { rolesService, RolesService } from './roles.service';
import { getRequestContext } from '../authz';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  ListRolesQuery,
} from './roles.validator';

export class RolesController {
  constructor(private readonly service: RolesService = rolesService) {}

  createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const input = req.body as CreateRoleInput;

      const role = await this.service.createRole(input, {
        tenantId: context.tenant.id,
        userId: context.user.id,
        userPermissions: context.permissions,
      });

      res.status(201).json(
        createApiResponse(role, {
          message: 'Role created successfully',
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  getRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const { id } = req.params;

      const role = await this.service.getRoleById(id, {
        tenantId: context.tenant.id,
        userId: context.user.id,
        userPermissions: context.permissions,
      });

      res.status(200).json(
        createApiResponse(role, {
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  listRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const query = req.query as unknown as ListRolesQuery;

      const result = await this.service.listRoles(
        {
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
          filters: {
            search: query.search,
            isSystem: query.isSystem,
          },
        },
        {
          tenantId: context.tenant.id,
          userId: context.user.id,
          userPermissions: context.permissions,
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

  updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const { id } = req.params;
      const input = req.body as UpdateRoleInput;

      const role = await this.service.updateRole(id, input, {
        tenantId: context.tenant.id,
        userId: context.user.id,
        userPermissions: context.permissions,
      });

      res.status(200).json(
        createApiResponse(role, {
          message: 'Role updated successfully',
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getRequestContext(req);
      const { id } = req.params;

      await this.service.deleteRole(id, {
        tenantId: context.tenant.id,
        userId: context.user.id,
        userPermissions: context.permissions,
      });

      res.status(200).json(
        createEmptyResponse('Role deleted successfully', req.requestId)
      );
    } catch (error) {
      next(error);
    }
  };

  getPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const permissions = await this.service.getAllPermissions();

      res.status(200).json(
        createApiResponse(permissions, {
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };
}

export const rolesController = new RolesController();
