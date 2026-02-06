export type PermissionScope = 'all' | 'tenant' | 'branch' | 'own';

export interface PermissionDefinition {
  code: string;
  name: string;
  resource: string;
  action: string;
  scope: PermissionScope;
}

export const RESOURCES = {
  TENANT: 'tenant',
  BRANCH: 'branch',
  USER: 'user',
  ROLE: 'role',
  STUDENT: 'student',
  GUARDIAN: 'guardian',
  STAFF: 'staff',
  ACADEMIC_YEAR: 'academic_year',
  CLASS: 'class',
  SECTION: 'section',
  SUBJECT: 'subject',
  ATTENDANCE: 'attendance',
  FEE: 'fee',
  EXAM: 'exam',
  TIMETABLE: 'timetable',
  ANNOUNCEMENT: 'announcement',
  COMMUNICATION: 'communication',
  TRANSPORT: 'transport',
  LIBRARY: 'library',
  REPORT: 'report',
  AUDIT: 'audit',
  SETTINGS: 'settings',
} as const;

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  ASSIGN: 'assign',
  ENROLL: 'enroll',
  TRANSFER: 'transfer',
  PROMOTE: 'promote',
  MARK: 'mark',
  COLLECT: 'collect',
  CONCESSION: 'concession',
  SCHEDULE: 'schedule',
  RESULT_ENTRY: 'result_entry',
  RESULT_READ: 'result_read',
  PUBLISH: 'publish',
  REPORT_CARD: 'report_card',
  SEND: 'send',
  MANAGE: 'manage',
  ISSUE: 'issue',
  RETURN: 'return',
  GENERATE: 'generate',
  ACTIVATE: 'activate',
  STRUCTURE_CREATE: 'structure_create',
  STRUCTURE_READ: 'structure_read',
  STRUCTURE_UPDATE: 'structure_update',
  TENANT_READ: 'tenant_read',
  TENANT_UPDATE: 'tenant_update',
  BRANCH_READ: 'branch_read',
  BRANCH_UPDATE: 'branch_update',
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

function createPermissionCode(resource: string, action: string, scope: PermissionScope): string {
  return `${resource}:${action}:${scope}`;
}

export const PERMISSIONS = {
  TENANT: {
    CREATE: createPermissionCode(RESOURCES.TENANT, ACTIONS.CREATE, 'all'),
    READ_ALL: createPermissionCode(RESOURCES.TENANT, ACTIONS.READ, 'all'),
    READ_OWN: createPermissionCode(RESOURCES.TENANT, ACTIONS.READ, 'own'),
    UPDATE_ALL: createPermissionCode(RESOURCES.TENANT, ACTIONS.UPDATE, 'all'),
    UPDATE_OWN: createPermissionCode(RESOURCES.TENANT, ACTIONS.UPDATE, 'own'),
    DELETE: createPermissionCode(RESOURCES.TENANT, ACTIONS.DELETE, 'all'),
  },

  BRANCH: {
    CREATE: createPermissionCode(RESOURCES.BRANCH, ACTIONS.CREATE, 'tenant'),
    READ_ALL: createPermissionCode(RESOURCES.BRANCH, ACTIONS.READ, 'tenant'),
    READ_OWN: createPermissionCode(RESOURCES.BRANCH, ACTIONS.READ, 'branch'),
    UPDATE_ALL: createPermissionCode(RESOURCES.BRANCH, ACTIONS.UPDATE, 'tenant'),
    UPDATE_OWN: createPermissionCode(RESOURCES.BRANCH, ACTIONS.UPDATE, 'branch'),
    DELETE: createPermissionCode(RESOURCES.BRANCH, ACTIONS.DELETE, 'tenant'),
  },

  USER: {
    CREATE: createPermissionCode(RESOURCES.USER, ACTIONS.CREATE, 'tenant'),
    READ_ALL: createPermissionCode(RESOURCES.USER, ACTIONS.READ, 'tenant'),
    READ_BRANCH: createPermissionCode(RESOURCES.USER, ACTIONS.READ, 'branch'),
    READ_OWN: createPermissionCode(RESOURCES.USER, ACTIONS.READ, 'own'),
    UPDATE_ALL: createPermissionCode(RESOURCES.USER, ACTIONS.UPDATE, 'tenant'),
    UPDATE_BRANCH: createPermissionCode(RESOURCES.USER, ACTIONS.UPDATE, 'branch'),
    UPDATE_OWN: createPermissionCode(RESOURCES.USER, ACTIONS.UPDATE, 'own'),
    DELETE: createPermissionCode(RESOURCES.USER, ACTIONS.DELETE, 'tenant'),
  },

  ROLE: {
    CREATE: createPermissionCode(RESOURCES.ROLE, ACTIONS.CREATE, 'tenant'),
    READ: createPermissionCode(RESOURCES.ROLE, ACTIONS.READ, 'tenant'),
    UPDATE: createPermissionCode(RESOURCES.ROLE, ACTIONS.UPDATE, 'tenant'),
    DELETE: createPermissionCode(RESOURCES.ROLE, ACTIONS.DELETE, 'tenant'),
    ASSIGN: createPermissionCode(RESOURCES.ROLE, ACTIONS.ASSIGN, 'tenant'),
  },

  STUDENT: {
    CREATE: createPermissionCode(RESOURCES.STUDENT, ACTIONS.CREATE, 'branch'),
    READ_ALL: createPermissionCode(RESOURCES.STUDENT, ACTIONS.READ, 'tenant'),
    READ_BRANCH: createPermissionCode(RESOURCES.STUDENT, ACTIONS.READ, 'branch'),
    READ_OWN: createPermissionCode(RESOURCES.STUDENT, ACTIONS.READ, 'own'),
    UPDATE: createPermissionCode(RESOURCES.STUDENT, ACTIONS.UPDATE, 'branch'),
    DELETE: createPermissionCode(RESOURCES.STUDENT, ACTIONS.DELETE, 'branch'),
    ENROLL: createPermissionCode(RESOURCES.STUDENT, ACTIONS.ENROLL, 'branch'),
    TRANSFER: createPermissionCode(RESOURCES.STUDENT, ACTIONS.TRANSFER, 'tenant'),
    PROMOTE: createPermissionCode(RESOURCES.STUDENT, ACTIONS.PROMOTE, 'branch'),
  },

  GUARDIAN: {
    CREATE: createPermissionCode(RESOURCES.GUARDIAN, ACTIONS.CREATE, 'branch'),
    READ_BRANCH: createPermissionCode(RESOURCES.GUARDIAN, ACTIONS.READ, 'branch'),
    READ_OWN: createPermissionCode(RESOURCES.GUARDIAN, ACTIONS.READ, 'own'),
    UPDATE: createPermissionCode(RESOURCES.GUARDIAN, ACTIONS.UPDATE, 'branch'),
    DELETE: createPermissionCode(RESOURCES.GUARDIAN, ACTIONS.DELETE, 'branch'),
  },

  STAFF: {
    CREATE: createPermissionCode(RESOURCES.STAFF, ACTIONS.CREATE, 'branch'),
    READ_ALL: createPermissionCode(RESOURCES.STAFF, ACTIONS.READ, 'tenant'),
    READ_BRANCH: createPermissionCode(RESOURCES.STAFF, ACTIONS.READ, 'branch'),
    READ_OWN: createPermissionCode(RESOURCES.STAFF, ACTIONS.READ, 'own'),
    UPDATE: createPermissionCode(RESOURCES.STAFF, ACTIONS.UPDATE, 'branch'),
    DELETE: createPermissionCode(RESOURCES.STAFF, ACTIONS.DELETE, 'branch'),
  },

  ACADEMIC_YEAR: {
    CREATE: createPermissionCode(RESOURCES.ACADEMIC_YEAR, ACTIONS.CREATE, 'tenant'),
    READ: createPermissionCode(RESOURCES.ACADEMIC_YEAR, ACTIONS.READ, 'tenant'),
    UPDATE: createPermissionCode(RESOURCES.ACADEMIC_YEAR, ACTIONS.UPDATE, 'tenant'),
    DELETE: createPermissionCode(RESOURCES.ACADEMIC_YEAR, ACTIONS.DELETE, 'tenant'),
    ACTIVATE: createPermissionCode(RESOURCES.ACADEMIC_YEAR, ACTIONS.ACTIVATE, 'tenant'),
  },

  CLASS: {
    CREATE: createPermissionCode(RESOURCES.CLASS, ACTIONS.CREATE, 'branch'),
    READ: createPermissionCode(RESOURCES.CLASS, ACTIONS.READ, 'branch'),
    UPDATE: createPermissionCode(RESOURCES.CLASS, ACTIONS.UPDATE, 'branch'),
    DELETE: createPermissionCode(RESOURCES.CLASS, ACTIONS.DELETE, 'branch'),
  },

  SECTION: {
    CREATE: createPermissionCode(RESOURCES.SECTION, ACTIONS.CREATE, 'branch'),
    READ: createPermissionCode(RESOURCES.SECTION, ACTIONS.READ, 'branch'),
    UPDATE: createPermissionCode(RESOURCES.SECTION, ACTIONS.UPDATE, 'branch'),
    DELETE: createPermissionCode(RESOURCES.SECTION, ACTIONS.DELETE, 'branch'),
  },

  SUBJECT: {
    CREATE: createPermissionCode(RESOURCES.SUBJECT, ACTIONS.CREATE, 'tenant'),
    READ: createPermissionCode(RESOURCES.SUBJECT, ACTIONS.READ, 'tenant'),
    UPDATE: createPermissionCode(RESOURCES.SUBJECT, ACTIONS.UPDATE, 'tenant'),
    DELETE: createPermissionCode(RESOURCES.SUBJECT, ACTIONS.DELETE, 'tenant'),
  },

  ATTENDANCE: {
    MARK: createPermissionCode(RESOURCES.ATTENDANCE, ACTIONS.MARK, 'branch'),
    READ_ALL: createPermissionCode(RESOURCES.ATTENDANCE, ACTIONS.READ, 'tenant'),
    READ_BRANCH: createPermissionCode(RESOURCES.ATTENDANCE, ACTIONS.READ, 'branch'),
    READ_OWN: createPermissionCode(RESOURCES.ATTENDANCE, ACTIONS.READ, 'own'),
    UPDATE: createPermissionCode(RESOURCES.ATTENDANCE, ACTIONS.UPDATE, 'branch'),
    REPORT: createPermissionCode(RESOURCES.ATTENDANCE, 'report', 'branch'),
  },

  FEE: {
    STRUCTURE_CREATE: createPermissionCode(RESOURCES.FEE, ACTIONS.STRUCTURE_CREATE, 'branch'),
    STRUCTURE_READ: createPermissionCode(RESOURCES.FEE, ACTIONS.STRUCTURE_READ, 'branch'),
    STRUCTURE_UPDATE: createPermissionCode(RESOURCES.FEE, ACTIONS.STRUCTURE_UPDATE, 'branch'),
    ASSIGN: createPermissionCode(RESOURCES.FEE, ACTIONS.ASSIGN, 'branch'),
    COLLECT: createPermissionCode(RESOURCES.FEE, ACTIONS.COLLECT, 'branch'),
    READ_BRANCH: createPermissionCode(RESOURCES.FEE, ACTIONS.READ, 'branch'),
    READ_OWN: createPermissionCode(RESOURCES.FEE, ACTIONS.READ, 'own'),
    CONCESSION: createPermissionCode(RESOURCES.FEE, ACTIONS.CONCESSION, 'branch'),
    REPORT: createPermissionCode(RESOURCES.FEE, 'report', 'branch'),
  },

  EXAM: {
    CREATE: createPermissionCode(RESOURCES.EXAM, ACTIONS.CREATE, 'branch'),
    READ: createPermissionCode(RESOURCES.EXAM, ACTIONS.READ, 'branch'),
    UPDATE: createPermissionCode(RESOURCES.EXAM, ACTIONS.UPDATE, 'branch'),
    DELETE: createPermissionCode(RESOURCES.EXAM, ACTIONS.DELETE, 'branch'),
    SCHEDULE: createPermissionCode(RESOURCES.EXAM, ACTIONS.SCHEDULE, 'branch'),
    RESULT_ENTRY: createPermissionCode(RESOURCES.EXAM, ACTIONS.RESULT_ENTRY, 'branch'),
    RESULT_READ_BRANCH: createPermissionCode(RESOURCES.EXAM, ACTIONS.RESULT_READ, 'branch'),
    RESULT_READ_OWN: createPermissionCode(RESOURCES.EXAM, ACTIONS.RESULT_READ, 'own'),
    PUBLISH: createPermissionCode(RESOURCES.EXAM, ACTIONS.PUBLISH, 'branch'),
    REPORT_CARD: createPermissionCode(RESOURCES.EXAM, ACTIONS.REPORT_CARD, 'branch'),
  },

  TIMETABLE: {
    CREATE: createPermissionCode(RESOURCES.TIMETABLE, ACTIONS.CREATE, 'branch'),
    READ_BRANCH: createPermissionCode(RESOURCES.TIMETABLE, ACTIONS.READ, 'branch'),
    READ_OWN: createPermissionCode(RESOURCES.TIMETABLE, ACTIONS.READ, 'own'),
    UPDATE: createPermissionCode(RESOURCES.TIMETABLE, ACTIONS.UPDATE, 'branch'),
    DELETE: createPermissionCode(RESOURCES.TIMETABLE, ACTIONS.DELETE, 'branch'),
  },

  ANNOUNCEMENT: {
    CREATE_TENANT: createPermissionCode(RESOURCES.ANNOUNCEMENT, ACTIONS.CREATE, 'tenant'),
    CREATE_BRANCH: createPermissionCode(RESOURCES.ANNOUNCEMENT, ACTIONS.CREATE, 'branch'),
    READ: createPermissionCode(RESOURCES.ANNOUNCEMENT, ACTIONS.READ, 'tenant'),
    UPDATE: createPermissionCode(RESOURCES.ANNOUNCEMENT, ACTIONS.UPDATE, 'branch'),
    DELETE: createPermissionCode(RESOURCES.ANNOUNCEMENT, ACTIONS.DELETE, 'branch'),
    PUBLISH: createPermissionCode(RESOURCES.ANNOUNCEMENT, ACTIONS.PUBLISH, 'branch'),
  },

  COMMUNICATION: {
    SEND: createPermissionCode(RESOURCES.COMMUNICATION, ACTIONS.SEND, 'tenant'),
    READ: createPermissionCode(RESOURCES.COMMUNICATION, ACTIONS.READ, 'branch'),
  },

  TRANSPORT: {
    MANAGE: createPermissionCode(RESOURCES.TRANSPORT, ACTIONS.MANAGE, 'branch'),
    READ: createPermissionCode(RESOURCES.TRANSPORT, ACTIONS.READ, 'branch'),
    ASSIGN: createPermissionCode(RESOURCES.TRANSPORT, ACTIONS.ASSIGN, 'branch'),
  },

  LIBRARY: {
    MANAGE: createPermissionCode(RESOURCES.LIBRARY, ACTIONS.MANAGE, 'branch'),
    READ: createPermissionCode(RESOURCES.LIBRARY, ACTIONS.READ, 'branch'),
    ISSUE: createPermissionCode(RESOURCES.LIBRARY, ACTIONS.ISSUE, 'branch'),
    RETURN: createPermissionCode(RESOURCES.LIBRARY, ACTIONS.RETURN, 'branch'),
  },

  REPORT: {
    GENERATE_TENANT: createPermissionCode(RESOURCES.REPORT, ACTIONS.GENERATE, 'tenant'),
    GENERATE_BRANCH: createPermissionCode(RESOURCES.REPORT, ACTIONS.GENERATE, 'branch'),
    SCHEDULE: createPermissionCode(RESOURCES.REPORT, ACTIONS.SCHEDULE, 'branch'),
  },

  AUDIT: {
    READ_TENANT: createPermissionCode(RESOURCES.AUDIT, ACTIONS.READ, 'tenant'),
    READ_BRANCH: createPermissionCode(RESOURCES.AUDIT, ACTIONS.READ, 'branch'),
  },

  SETTINGS: {
    TENANT_READ: createPermissionCode(RESOURCES.SETTINGS, ACTIONS.TENANT_READ, 'tenant'),
    TENANT_UPDATE: createPermissionCode(RESOURCES.SETTINGS, ACTIONS.TENANT_UPDATE, 'tenant'),
    BRANCH_READ: createPermissionCode(RESOURCES.SETTINGS, ACTIONS.BRANCH_READ, 'branch'),
    BRANCH_UPDATE: createPermissionCode(RESOURCES.SETTINGS, ACTIONS.BRANCH_UPDATE, 'branch'),
  },
} as const;

export function parsePermissionCode(code: string): { resource: string; action: string; scope: string } | null {
  const parts = code.split(':');
  if (parts.length !== 3) return null;
  return { resource: parts[0], action: parts[1], scope: parts[2] };
}

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(p => userPermissions.includes(p));
}

export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(p => userPermissions.includes(p));
}
