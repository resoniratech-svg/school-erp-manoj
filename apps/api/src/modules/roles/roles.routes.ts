import { Router } from 'express';
import { rolesController } from './roles.controller';
import { validate } from '../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { ROLE_PERMISSIONS } from './roles.constants';
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdParamSchema,
  listRolesSchema,
} from './roles.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
  '/',
  requirePermission(ROLE_PERMISSIONS.CREATE),
  validate(createRoleSchema),
  rolesController.createRole
);

router.get(
  '/',
  requirePermission(ROLE_PERMISSIONS.READ),
  validate(listRolesSchema),
  rolesController.listRoles
);

router.get(
  '/permissions',
  requirePermission(ROLE_PERMISSIONS.READ),
  rolesController.getPermissions
);

router.get(
  '/:id',
  requirePermission(ROLE_PERMISSIONS.READ),
  validate(roleIdParamSchema),
  rolesController.getRole
);

router.patch(
  '/:id',
  requirePermission(ROLE_PERMISSIONS.UPDATE),
  validate(updateRoleSchema),
  rolesController.updateRole
);

router.delete(
  '/:id',
  requirePermission(ROLE_PERMISSIONS.DELETE),
  validate(roleIdParamSchema),
  rolesController.deleteRole
);

export { router as rolesRoutes };
