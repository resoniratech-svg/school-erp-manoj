import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { USER_PERMISSIONS } from './users.constants';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersSchema,
  assignRoleSchema,
  removeRoleSchema,
  assignBranchSchema,
  removeBranchSchema,
} from './users.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
  '/',
  requirePermission(USER_PERMISSIONS.CREATE),
  validate(createUserSchema),
  usersController.createUser
);

router.get(
  '/',
  requirePermission(USER_PERMISSIONS.READ_ALL),
  validate(listUsersSchema),
  usersController.listUsers
);

router.get(
  '/:id',
  requirePermission(USER_PERMISSIONS.READ_ALL),
  validate(userIdParamSchema),
  usersController.getUser
);

router.patch(
  '/:id',
  requirePermission(USER_PERMISSIONS.UPDATE_ALL),
  validate(updateUserSchema),
  usersController.updateUser
);

router.delete(
  '/:id',
  requirePermission(USER_PERMISSIONS.DELETE),
  validate(userIdParamSchema),
  usersController.deleteUser
);

router.post(
  '/:id/roles',
  requirePermission(USER_PERMISSIONS.ASSIGN_ROLE),
  validate(assignRoleSchema),
  usersController.assignRole
);

router.delete(
  '/:id/roles/:roleId',
  requirePermission(USER_PERMISSIONS.ASSIGN_ROLE),
  validate(removeRoleSchema),
  usersController.removeRole
);

router.post(
  '/:id/branches',
  requirePermission(USER_PERMISSIONS.UPDATE_ALL),
  validate(assignBranchSchema),
  usersController.assignBranch
);

router.delete(
  '/:id/branches/:branchId',
  requirePermission(USER_PERMISSIONS.UPDATE_ALL),
  validate(removeBranchSchema),
  usersController.removeBranch
);

export { router as usersRoutes };
