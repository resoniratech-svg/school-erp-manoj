import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { resource: 'tenant', action: 'create', scope: 'all', name: 'Create Tenant' },
  { resource: 'tenant', action: 'read', scope: 'all', name: 'Read All Tenants' },
  { resource: 'tenant', action: 'read', scope: 'own', name: 'Read Own Tenant' },
  { resource: 'tenant', action: 'update', scope: 'all', name: 'Update Any Tenant' },
  { resource: 'tenant', action: 'update', scope: 'own', name: 'Update Own Tenant' },
  { resource: 'tenant', action: 'delete', scope: 'all', name: 'Delete Tenant' },

  { resource: 'branch', action: 'create', scope: 'tenant', name: 'Create Branch' },
  { resource: 'branch', action: 'read', scope: 'tenant', name: 'Read All Branches' },
  { resource: 'branch', action: 'read', scope: 'branch', name: 'Read Own Branch' },
  { resource: 'branch', action: 'update', scope: 'tenant', name: 'Update Any Branch' },
  { resource: 'branch', action: 'update', scope: 'branch', name: 'Update Own Branch' },
  { resource: 'branch', action: 'delete', scope: 'tenant', name: 'Delete Branch' },

  { resource: 'user', action: 'create', scope: 'tenant', name: 'Create User' },
  { resource: 'user', action: 'read', scope: 'tenant', name: 'Read All Users' },
  { resource: 'user', action: 'read', scope: 'branch', name: 'Read Branch Users' },
  { resource: 'user', action: 'read', scope: 'own', name: 'Read Own User' },
  { resource: 'user', action: 'update', scope: 'tenant', name: 'Update Any User' },
  { resource: 'user', action: 'update', scope: 'branch', name: 'Update Branch Users' },
  { resource: 'user', action: 'update', scope: 'own', name: 'Update Own User' },
  { resource: 'user', action: 'delete', scope: 'tenant', name: 'Delete User' },

  { resource: 'role', action: 'create', scope: 'tenant', name: 'Create Role' },
  { resource: 'role', action: 'read', scope: 'tenant', name: 'Read Roles' },
  { resource: 'role', action: 'update', scope: 'tenant', name: 'Update Role' },
  { resource: 'role', action: 'delete', scope: 'tenant', name: 'Delete Role' },
  { resource: 'role', action: 'assign', scope: 'tenant', name: 'Assign Roles' },

  { resource: 'student', action: 'create', scope: 'branch', name: 'Create Student' },
  { resource: 'student', action: 'read', scope: 'tenant', name: 'Read All Students' },
  { resource: 'student', action: 'read', scope: 'branch', name: 'Read Branch Students' },
  { resource: 'student', action: 'read', scope: 'own', name: 'Read Own Student' },
  { resource: 'student', action: 'update', scope: 'branch', name: 'Update Student' },
  { resource: 'student', action: 'delete', scope: 'branch', name: 'Delete Student' },
  { resource: 'student', action: 'enroll', scope: 'branch', name: 'Enroll Student' },
  { resource: 'student', action: 'transfer', scope: 'tenant', name: 'Transfer Student' },
  { resource: 'student', action: 'promote', scope: 'branch', name: 'Promote Student' },

  { resource: 'guardian', action: 'create', scope: 'branch', name: 'Create Guardian' },
  { resource: 'guardian', action: 'read', scope: 'branch', name: 'Read Guardians' },
  { resource: 'guardian', action: 'read', scope: 'own', name: 'Read Own Guardian' },
  { resource: 'guardian', action: 'update', scope: 'branch', name: 'Update Guardian' },
  { resource: 'guardian', action: 'delete', scope: 'branch', name: 'Delete Guardian' },

  { resource: 'staff', action: 'create', scope: 'branch', name: 'Create Staff' },
  { resource: 'staff', action: 'read', scope: 'tenant', name: 'Read All Staff' },
  { resource: 'staff', action: 'read', scope: 'branch', name: 'Read Branch Staff' },
  { resource: 'staff', action: 'read', scope: 'own', name: 'Read Own Staff' },
  { resource: 'staff', action: 'update', scope: 'branch', name: 'Update Staff' },
  { resource: 'staff', action: 'delete', scope: 'branch', name: 'Delete Staff' },

  { resource: 'academic_year', action: 'create', scope: 'tenant', name: 'Create Academic Year' },
  { resource: 'academic_year', action: 'read', scope: 'tenant', name: 'Read Academic Years' },
  { resource: 'academic_year', action: 'update', scope: 'tenant', name: 'Update Academic Year' },
  { resource: 'academic_year', action: 'delete', scope: 'tenant', name: 'Delete Academic Year' },
  { resource: 'academic_year', action: 'activate', scope: 'tenant', name: 'Activate Academic Year' },

  { resource: 'class', action: 'create', scope: 'branch', name: 'Create Class' },
  { resource: 'class', action: 'read', scope: 'branch', name: 'Read Classes' },
  { resource: 'class', action: 'update', scope: 'branch', name: 'Update Class' },
  { resource: 'class', action: 'delete', scope: 'branch', name: 'Delete Class' },

  { resource: 'section', action: 'create', scope: 'branch', name: 'Create Section' },
  { resource: 'section', action: 'read', scope: 'branch', name: 'Read Sections' },
  { resource: 'section', action: 'update', scope: 'branch', name: 'Update Section' },
  { resource: 'section', action: 'delete', scope: 'branch', name: 'Delete Section' },

  { resource: 'subject', action: 'create', scope: 'tenant', name: 'Create Subject' },
  { resource: 'subject', action: 'read', scope: 'tenant', name: 'Read Subjects' },
  { resource: 'subject', action: 'update', scope: 'tenant', name: 'Update Subject' },
  { resource: 'subject', action: 'delete', scope: 'tenant', name: 'Delete Subject' },

  { resource: 'attendance', action: 'mark', scope: 'branch', name: 'Mark Attendance' },
  { resource: 'attendance', action: 'read', scope: 'tenant', name: 'Read All Attendance' },
  { resource: 'attendance', action: 'read', scope: 'branch', name: 'Read Branch Attendance' },
  { resource: 'attendance', action: 'read', scope: 'own', name: 'Read Own Attendance' },
  { resource: 'attendance', action: 'update', scope: 'branch', name: 'Update Attendance' },
  { resource: 'attendance', action: 'report', scope: 'branch', name: 'Generate Attendance Report' },

  { resource: 'fee', action: 'structure_create', scope: 'branch', name: 'Create Fee Structure' },
  { resource: 'fee', action: 'structure_read', scope: 'branch', name: 'Read Fee Structures' },
  { resource: 'fee', action: 'structure_update', scope: 'branch', name: 'Update Fee Structure' },
  { resource: 'fee', action: 'assign', scope: 'branch', name: 'Assign Fees' },
  { resource: 'fee', action: 'collect', scope: 'branch', name: 'Collect Fees' },
  { resource: 'fee', action: 'read', scope: 'branch', name: 'Read Student Fees' },
  { resource: 'fee', action: 'read', scope: 'own', name: 'Read Own Fees' },
  { resource: 'fee', action: 'concession', scope: 'branch', name: 'Apply Concession' },
  { resource: 'fee', action: 'report', scope: 'branch', name: 'Generate Fee Report' },

  { resource: 'exam', action: 'create', scope: 'branch', name: 'Create Exam' },
  { resource: 'exam', action: 'read', scope: 'branch', name: 'Read Exams' },
  { resource: 'exam', action: 'update', scope: 'branch', name: 'Update Exam' },
  { resource: 'exam', action: 'delete', scope: 'branch', name: 'Delete Exam' },
  { resource: 'exam', action: 'schedule', scope: 'branch', name: 'Schedule Exam' },
  { resource: 'exam', action: 'result_entry', scope: 'branch', name: 'Enter Results' },
  { resource: 'exam', action: 'result_read', scope: 'branch', name: 'Read Results' },
  { resource: 'exam', action: 'result_read', scope: 'own', name: 'Read Own Results' },
  { resource: 'exam', action: 'publish', scope: 'branch', name: 'Publish Results' },
  { resource: 'exam', action: 'report_card', scope: 'branch', name: 'Generate Report Card' },

  { resource: 'timetable', action: 'create', scope: 'branch', name: 'Create Timetable' },
  { resource: 'timetable', action: 'read', scope: 'branch', name: 'Read Timetables' },
  { resource: 'timetable', action: 'read', scope: 'own', name: 'Read Own Timetable' },
  { resource: 'timetable', action: 'update', scope: 'branch', name: 'Update Timetable' },
  { resource: 'timetable', action: 'delete', scope: 'branch', name: 'Delete Timetable' },

  { resource: 'announcement', action: 'create', scope: 'tenant', name: 'Create Tenant Announcement' },
  { resource: 'announcement', action: 'create', scope: 'branch', name: 'Create Branch Announcement' },
  { resource: 'announcement', action: 'read', scope: 'tenant', name: 'Read Announcements' },
  { resource: 'announcement', action: 'update', scope: 'branch', name: 'Update Announcement' },
  { resource: 'announcement', action: 'delete', scope: 'branch', name: 'Delete Announcement' },
  { resource: 'announcement', action: 'publish', scope: 'branch', name: 'Publish Announcement' },

  { resource: 'communication', action: 'send', scope: 'tenant', name: 'Send Communications' },
  { resource: 'communication', action: 'read', scope: 'branch', name: 'Read Communications' },

  { resource: 'transport', action: 'manage', scope: 'branch', name: 'Manage Transport' },
  { resource: 'transport', action: 'read', scope: 'branch', name: 'Read Transport' },
  { resource: 'transport', action: 'assign', scope: 'branch', name: 'Assign Transport' },

  { resource: 'library', action: 'manage', scope: 'branch', name: 'Manage Library' },
  { resource: 'library', action: 'read', scope: 'branch', name: 'Read Library' },
  { resource: 'library', action: 'issue', scope: 'branch', name: 'Issue Books' },
  { resource: 'library', action: 'return', scope: 'branch', name: 'Return Books' },

  { resource: 'report', action: 'generate', scope: 'tenant', name: 'Generate Tenant Reports' },
  { resource: 'report', action: 'generate', scope: 'branch', name: 'Generate Branch Reports' },
  { resource: 'report', action: 'schedule', scope: 'branch', name: 'Schedule Reports' },

  { resource: 'audit', action: 'read', scope: 'tenant', name: 'Read Tenant Audit Logs' },
  { resource: 'audit', action: 'read', scope: 'branch', name: 'Read Branch Audit Logs' },

  { resource: 'settings', action: 'tenant_read', scope: 'tenant', name: 'Read Tenant Settings' },
  { resource: 'settings', action: 'tenant_update', scope: 'tenant', name: 'Update Tenant Settings' },
  { resource: 'settings', action: 'branch_read', scope: 'branch', name: 'Read Branch Settings' },
  { resource: 'settings', action: 'branch_update', scope: 'branch', name: 'Update Branch Settings' },
];

const SYSTEM_ROLES = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Administrator',
    description: 'Full system access, manages all tenants',
    permissions: ['tenant:*', 'audit:read:tenant'],
  },
  {
    code: 'TENANT_ADMIN',
    name: 'Tenant Administrator',
    description: 'Full tenant access, manages branches and users',
    permissions: [
      'tenant:read:own', 'tenant:update:own',
      'branch:*', 'user:*', 'role:*',
      'academic_year:*', 'subject:*',
      'settings:tenant_*',
      'report:generate:tenant',
      'audit:read:tenant',
      'announcement:create:tenant',
    ],
  },
  {
    code: 'BRANCH_ADMIN',
    name: 'Branch Administrator',
    description: 'Full branch access',
    permissions: [
      'branch:read:branch', 'branch:update:branch',
      'user:read:branch', 'user:update:branch',
      'student:*', 'guardian:*', 'staff:*',
      'class:*', 'section:*',
      'attendance:*', 'fee:*', 'exam:*', 'timetable:*',
      'announcement:*', 'communication:*',
      'transport:*', 'library:*',
      'report:generate:branch', 'report:schedule:branch',
      'audit:read:branch',
      'settings:branch_*',
    ],
  },
  {
    code: 'PRINCIPAL',
    name: 'Principal',
    description: 'School principal with oversight access',
    permissions: [
      'branch:read:branch',
      'student:read:branch', 'staff:read:branch',
      'class:read:branch', 'section:read:branch',
      'attendance:read:branch', 'attendance:report:branch',
      'fee:read:branch', 'fee:report:branch',
      'exam:read:branch', 'exam:publish:branch', 'exam:report_card:branch',
      'timetable:read:branch',
      'announcement:*',
      'report:generate:branch',
      'audit:read:branch',
    ],
  },
  {
    code: 'TEACHER',
    name: 'Teacher',
    description: 'Teaching staff with class management access',
    permissions: [
      'student:read:branch',
      'class:read:branch', 'section:read:branch',
      'attendance:mark:branch', 'attendance:read:branch',
      'exam:read:branch', 'exam:result_entry:branch',
      'timetable:read:own',
      'announcement:read:tenant',
      'library:read:branch', 'library:issue:branch',
    ],
  },
  {
    code: 'ACCOUNTANT',
    name: 'Accountant',
    description: 'Financial management access',
    permissions: [
      'student:read:branch',
      'fee:*',
      'report:generate:branch',
    ],
  },
  {
    code: 'LIBRARIAN',
    name: 'Librarian',
    description: 'Library management access',
    permissions: [
      'student:read:branch', 'staff:read:branch',
      'library:*',
    ],
  },
  {
    code: 'TRANSPORT_MANAGER',
    name: 'Transport Manager',
    description: 'Transport operations management',
    permissions: [
      'student:read:branch',
      'transport:*',
    ],
  },
  {
    code: 'PARENT',
    name: 'Parent/Guardian',
    description: 'Parent portal access',
    permissions: [
      'student:read:own',
      'attendance:read:own',
      'fee:read:own',
      'exam:result_read:own',
      'timetable:read:own',
      'announcement:read:tenant',
    ],
  },
  {
    code: 'STUDENT',
    name: 'Student',
    description: 'Student portal access',
    permissions: [
      'student:read:own',
      'attendance:read:own',
      'exam:result_read:own',
      'timetable:read:own',
      'announcement:read:tenant',
      'library:read:branch',
    ],
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  console.log('📝 Creating permissions...');
  const permissionRecords = PERMISSIONS.map(p => ({
    code: `${p.resource}:${p.action}${p.scope ? ':' + p.scope : ''}`,
    name: p.name,
    description: `Permission to ${p.action} ${p.resource}${p.scope ? ' with ' + p.scope + ' scope' : ''}`,
    resource: p.resource,
    action: p.action,
    scope: p.scope || null,
  }));

  for (const permission of permissionRecords) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        scope: permission.scope,
      },
      create: permission,
    });
  }
  console.log(`✅ Created ${permissionRecords.length} permissions`);

  console.log('📝 Creating system roles...');
  for (const role of SYSTEM_ROLES) {
    const createdRole = await prisma.role.upsert({
      where: {
        tenantId_code: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tenantId: null as any,
          code: role.code,
        },
      },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: true,
        tenantId: null,
      },
    });

    const allPermissions = await prisma.permission.findMany();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchingPermissions = allPermissions.filter((p: any) => {
      return role.permissions.some(rp => {
        if (rp.includes('*')) {
          const [resource, action] = rp.split(':');
          if (action === '*') {
            return p.resource === resource;
          }
          return p.code.startsWith(rp.replace('*', ''));
        }
        return p.code === rp;
      });
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: createdRole.id },
    });

    for (const permission of matchingPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: createdRole.id,
          permissionId: permission.id,
        },
      });
    }

    console.log(`  ✅ ${role.code}: ${matchingPermissions.length} permissions`);
  }

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
