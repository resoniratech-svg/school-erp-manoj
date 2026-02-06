export interface RoleListFilters {
  search?: string;
  isSystem?: boolean;
}

export interface RoleListOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: RoleListFilters;
}

export interface CreateRoleInput {
  code: string;
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface RoleResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleDetailResponse extends RoleResponse {
  permissions: PermissionResponse[];
}

export interface PermissionResponse {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
  scope: string | null;
}

export interface PaginatedRolesResponse {
  roles: RoleResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RoleContext {
  tenantId: string;
  userId: string;
  userPermissions: ReadonlySet<string>;
}
