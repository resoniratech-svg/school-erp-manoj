# Backend Scaffold Specification

**Document ID:** SCHOOL-ERP-BACKEND-SCAFFOLD-v1.0  
**Status:** APPROVED FOR IMPLEMENTATION  
**Last Updated:** 2026-01-14  
**Owner:** Principal Backend Engineer  
**Parent Documents:** SCHOOL-ERP-SCOPE-v1.0, SCHOOL-ERP-HLD-v1.0, SCHOOL-ERP-API-v1.0, SCHOOL-ERP-DB-v1.0  

---

## 1. Technology Stack

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| **Runtime** | Node.js | 20+ LTS | Native ESM, performance |
| **Language** | TypeScript | 5.3+ | Type safety, DX |
| **Framework** | Hono | 4.x | Lightweight, type-safe, edge-ready |
| **ORM** | Prisma | 5.x | Type-safe queries, migrations |
| **Database** | PostgreSQL | 15+ | Multi-tenant support, JSONB |
| **Validation** | Zod | 3.x | Runtime + compile-time validation |
| **Auth** | JWT | - | Stateless authentication |
| **Monorepo** | Turborepo | 2.x | Build caching, task orchestration |
| **Package Manager** | pnpm | 8.x | Fast, disk-efficient |
| **Testing** | Vitest | 1.x | Fast, ESM-native |

---

## 2. Repository Structure

```
school-erp/
├── apps/
│   └── api/                          # Main API application
│       ├── src/
│       │   ├── index.ts              # Application entry point
│       │   ├── app.ts                # Hono app setup
│       │   ├── config/               # Configuration loading
│       │   │   ├── index.ts
│       │   │   ├── env.ts            # Environment variables
│       │   │   └── constants.ts      # App constants
│       │   ├── modules/              # Feature modules (Clean Architecture)
│       │   │   ├── auth/
│       │   │   ├── tenant/
│       │   │   ├── branch/
│       │   │   ├── user/
│       │   │   ├── role/
│       │   │   ├── student/          # Sample module (detailed below)
│       │   │   ├── guardian/
│       │   │   ├── academic/
│       │   │   ├── staff/
│       │   │   ├── attendance/
│       │   │   ├── fee/
│       │   │   ├── exam/
│       │   │   ├── timetable/
│       │   │   ├── communication/
│       │   │   ├── transport/
│       │   │   ├── library/
│       │   │   ├── audit/
│       │   │   └── report/
│       │   ├── middleware/           # Global middleware
│       │   │   ├── index.ts
│       │   │   ├── auth.middleware.ts
│       │   │   ├── tenant.middleware.ts
│       │   │   ├── permission.middleware.ts
│       │   │   ├── rate-limit.middleware.ts
│       │   │   ├── request-id.middleware.ts
│       │   │   ├── logger.middleware.ts
│       │   │   └── error.middleware.ts
│       │   ├── lib/                  # Shared utilities (app-specific)
│       │   │   ├── jwt.ts
│       │   │   ├── password.ts
│       │   │   ├── pagination.ts
│       │   │   ├── filter.ts
│       │   │   └── response.ts
│       │   └── types/                # App-specific types
│       │       ├── context.ts        # Hono context extensions
│       │       └── express.d.ts
│       ├── tests/
│       │   ├── setup.ts
│       │   ├── fixtures/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
│
├── packages/
│   ├── database/                     # Prisma package
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   ├── migrations/           # Migration files
│   │   │   └── seed.ts               # Seed data
│   │   ├── src/
│   │   │   ├── index.ts              # PrismaClient export
│   │   │   ├── client.ts             # Singleton client
│   │   │   └── extensions/           # Prisma extensions
│   │   │       ├── soft-delete.ts
│   │   │       ├── audit.ts
│   │   │       └── tenant.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                       # Shared utilities
│       ├── src/
│       │   ├── index.ts
│       │   ├── types/                # Shared types
│       │   │   ├── api.types.ts      # API response types
│       │   │   ├── pagination.types.ts
│       │   │   └── enums.ts          # Shared enums
│       │   ├── errors/               # Error classes
│       │   │   ├── index.ts
│       │   │   ├── base.error.ts
│       │   │   ├── validation.error.ts
│       │   │   ├── not-found.error.ts
│       │   │   ├── unauthorized.error.ts
│       │   │   ├── forbidden.error.ts
│       │   │   └── conflict.error.ts
│       │   ├── utils/                # Utility functions
│       │   │   ├── uuid.ts
│       │   │   ├── date.ts
│       │   │   ├── string.ts
│       │   │   └── object.ts
│       │   └── constants/
│       │       ├── permissions.ts
│       │       └── roles.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                             # Documentation
│   ├── api/                          # API documentation
│   ├── architecture/                 # Architecture decisions
│   └── guides/                       # Developer guides
│
├── scripts/                          # Build/deployment scripts
│   ├── db-migrate.ts
│   ├── db-seed.ts
│   ├── generate-permissions.ts
│   └── health-check.ts
│
├── config/                           # Shared configuration
│   ├── eslint/
│   │   └── base.js
│   ├── typescript/
│   │   └── base.json
│   └── prettier/
│       └── base.json
│
├── .env.example                      # Environment template
├── .gitignore
├── docker-compose.yml                # Local development
├── turbo.json                        # Turborepo config
├── pnpm-workspace.yaml               # Workspace config
├── package.json                      # Root package
└── README.md
```

---

## 3. Sample Module Structure: Student

```
apps/api/src/modules/student/
├── index.ts                          # Module exports (routes only)
├── student.routes.ts                 # Route definitions
├── student.controller.ts             # HTTP handlers (thin)
├── student.service.ts                # Business logic
├── student.repository.ts             # Data access (Prisma only)
├── student.validator.ts              # Zod schemas
├── student.types.ts                  # Module-specific types
├── student.mapper.ts                 # Entity ↔ DTO mapping
└── __tests__/                        # Module tests
    ├── student.service.test.ts
    ├── student.repository.test.ts
    └── student.controller.test.ts
```

---

## 4. Layer Responsibilities

### 4.1 Routes (`*.routes.ts`)

**Responsibility:** Define API routes and wire middleware/controllers.

```typescript
// student.routes.ts
import { Hono } from 'hono';
import { StudentController } from './student.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { permissionMiddleware } from '@/middleware/permission.middleware';
import { validateBody, validateQuery } from '@/middleware/validation.middleware';
import { 
  createStudentSchema, 
  updateStudentSchema, 
  listStudentsQuerySchema 
} from './student.validator';

export const studentRoutes = new Hono();

const controller = new StudentController();

studentRoutes.use('*', authMiddleware);

studentRoutes.post(
  '/',
  permissionMiddleware('student:create'),
  validateBody(createStudentSchema),
  controller.create
);

studentRoutes.get(
  '/',
  permissionMiddleware('student:read'),
  validateQuery(listStudentsQuerySchema),
  controller.list
);

studentRoutes.get(
  '/:id',
  permissionMiddleware('student:read'),
  controller.getById
);

studentRoutes.patch(
  '/:id',
  permissionMiddleware('student:update'),
  validateBody(updateStudentSchema),
  controller.update
);

studentRoutes.delete(
  '/:id',
  permissionMiddleware('student:delete'),
  controller.delete
);

// Nested routes
studentRoutes.post(
  '/:id/enroll',
  permissionMiddleware('student:enroll'),
  controller.enroll
);

studentRoutes.get(
  '/:id/guardians',
  permissionMiddleware('student:read'),
  controller.listGuardians
);
```

### 4.2 Controller (`*.controller.ts`)

**Responsibility:** Handle HTTP request/response. Delegate to service. No business logic.

```typescript
// student.controller.ts
import type { Context } from 'hono';
import { StudentService } from './student.service';
import { successResponse, createdResponse, noContentResponse } from '@/lib/response';
import type { AppContext } from '@/types/context';

export class StudentController {
  private service: StudentService;

  constructor() {
    this.service = new StudentService();
  }

  create = async (c: AppContext) => {
    const body = c.get('validatedBody');
    const ctx = c.get('requestContext');
    
    const student = await this.service.create(body, ctx);
    
    return createdResponse(c, student);
  };

  list = async (c: AppContext) => {
    const query = c.get('validatedQuery');
    const ctx = c.get('requestContext');
    
    const result = await this.service.list(query, ctx);
    
    return successResponse(c, result.data, result.meta);
  };

  getById = async (c: AppContext) => {
    const { id } = c.req.param();
    const ctx = c.get('requestContext');
    
    const student = await this.service.getById(id, ctx);
    
    return successResponse(c, student);
  };

  update = async (c: AppContext) => {
    const { id } = c.req.param();
    const body = c.get('validatedBody');
    const ctx = c.get('requestContext');
    
    const student = await this.service.update(id, body, ctx);
    
    return successResponse(c, student);
  };

  delete = async (c: AppContext) => {
    const { id } = c.req.param();
    const ctx = c.get('requestContext');
    
    await this.service.delete(id, ctx);
    
    return noContentResponse(c);
  };

  enroll = async (c: AppContext) => {
    const { id } = c.req.param();
    const body = c.get('validatedBody');
    const ctx = c.get('requestContext');
    
    const enrollment = await this.service.enroll(id, body, ctx);
    
    return createdResponse(c, enrollment);
  };

  listGuardians = async (c: AppContext) => {
    const { id } = c.req.param();
    const ctx = c.get('requestContext');
    
    const guardians = await this.service.listGuardians(id, ctx);
    
    return successResponse(c, guardians);
  };
}
```

### 4.3 Service (`*.service.ts`)

**Responsibility:** Business logic, orchestration, validation rules. Calls repository.

```typescript
// student.service.ts
import { StudentRepository } from './student.repository';
import { GuardianRepository } from '../guardian/guardian.repository';
import { StudentMapper } from './student.mapper';
import { NotFoundError, ConflictError, ForbiddenError } from '@school-erp/shared';
import type { 
  CreateStudentInput, 
  UpdateStudentInput, 
  ListStudentsQuery,
  StudentResponse 
} from './student.types';
import type { RequestContext } from '@/types/context';
import { db } from '@school-erp/database';

export class StudentService {
  private repository: StudentRepository;
  private guardianRepository: GuardianRepository;

  constructor() {
    this.repository = new StudentRepository();
    this.guardianRepository = new GuardianRepository();
  }

  async create(
    input: CreateStudentInput, 
    ctx: RequestContext
  ): Promise<StudentResponse> {
    // Business rule: Check admission number uniqueness
    const existing = await this.repository.findByAdmissionNumber(
      ctx.tenantId,
      input.admissionNumber
    );
    
    if (existing) {
      throw new ConflictError('Admission number already exists');
    }

    // Business rule: Validate branch access
    if (!ctx.branches.includes(input.branchId)) {
      throw new ForbiddenError('No access to this branch');
    }

    // Transaction: Create student + guardian + enrollment
    const student = await db.$transaction(async (tx) => {
      // Create student
      const newStudent = await this.repository.create(tx, {
        ...input,
        tenantId: ctx.tenantId,
        createdBy: ctx.userId,
      });

      // Create guardian if provided
      if (input.guardian) {
        const guardian = await this.guardianRepository.create(tx, {
          ...input.guardian,
          tenantId: ctx.tenantId,
        });

        await this.repository.linkGuardian(tx, newStudent.id, guardian.id, {
          relationship: input.guardian.relationship,
          isPrimary: true,
        });
      }

      // Create initial enrollment if provided
      if (input.enrollment) {
        await this.repository.createEnrollment(tx, newStudent.id, input.enrollment);
      }

      return newStudent;
    });

    return StudentMapper.toResponse(student);
  }

  async list(
    query: ListStudentsQuery, 
    ctx: RequestContext
  ): Promise<{ data: StudentResponse[]; meta: PaginationMeta }> {
    // Filter by accessible branches
    const effectiveBranchIds = query.branchId 
      ? [query.branchId].filter(id => ctx.branches.includes(id))
      : ctx.branches;

    if (effectiveBranchIds.length === 0) {
      return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }

    const { students, total } = await this.repository.findMany({
      tenantId: ctx.tenantId,
      branchIds: effectiveBranchIds,
      ...query,
    });

    return {
      data: students.map(StudentMapper.toResponse),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getById(id: string, ctx: RequestContext): Promise<StudentResponse> {
    const student = await this.repository.findById(id, ctx.tenantId);
    
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check branch access
    if (!ctx.branches.includes(student.branchId)) {
      throw new ForbiddenError('No access to this student');
    }

    return StudentMapper.toResponse(student);
  }

  async update(
    id: string, 
    input: UpdateStudentInput, 
    ctx: RequestContext
  ): Promise<StudentResponse> {
    const student = await this.repository.findById(id, ctx.tenantId);
    
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    if (!ctx.branches.includes(student.branchId)) {
      throw new ForbiddenError('No access to this student');
    }

    const updated = await this.repository.update(id, {
      ...input,
      updatedBy: ctx.userId,
    });

    return StudentMapper.toResponse(updated);
  }

  async delete(id: string, ctx: RequestContext): Promise<void> {
    const student = await this.repository.findById(id, ctx.tenantId);
    
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    if (!ctx.branches.includes(student.branchId)) {
      throw new ForbiddenError('No access to this student');
    }

    // Soft delete
    await this.repository.softDelete(id, ctx.userId);
  }

  // ... additional methods
}
```

### 4.4 Repository (`*.repository.ts`)

**Responsibility:** Data access ONLY. Prisma queries. No business logic.

```typescript
// student.repository.ts
import { db, type PrismaClient, type Prisma } from '@school-erp/database';
import type { Student, StudentEnrollment } from '@prisma/client';

export class StudentRepository {
  async findById(
    id: string, 
    tenantId: string
  ): Promise<Student | null> {
    return db.student.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        branch: true,
        currentEnrollment: {
          include: {
            class: true,
            section: true,
            academicYear: true,
          },
        },
      },
    });
  }

  async findByAdmissionNumber(
    tenantId: string, 
    admissionNumber: string
  ): Promise<Student | null> {
    return db.student.findFirst({
      where: {
        tenantId,
        admissionNumber,
        deletedAt: null,
      },
    });
  }

  async findMany(params: {
    tenantId: string;
    branchIds: string[];
    classId?: string;
    sectionId?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
    sort?: string;
  }): Promise<{ students: Student[]; total: number }> {
    const where: Prisma.StudentWhereInput = {
      tenantId: params.tenantId,
      branchId: { in: params.branchIds },
      deletedAt: null,
      ...(params.status && { status: params.status }),
      ...(params.search && {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { admissionNumber: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Handle class/section filter via enrollment
    if (params.classId || params.sectionId) {
      where.enrollments = {
        some: {
          isCurrent: true,
          ...(params.classId && { classId: params.classId }),
          ...(params.sectionId && { sectionId: params.sectionId }),
        },
      };
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          branch: true,
          currentEnrollment: {
            include: {
              class: true,
              section: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: this.parseSort(params.sort),
      }),
      db.student.count({ where }),
    ]);

    return { students, total };
  }

  async create(
    tx: Prisma.TransactionClient | PrismaClient,
    data: Prisma.StudentCreateInput
  ): Promise<Student> {
    return tx.student.create({
      data,
      include: {
        branch: true,
      },
    });
  }

  async update(
    id: string, 
    data: Prisma.StudentUpdateInput
  ): Promise<Student> {
    return db.student.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        branch: true,
        currentEnrollment: true,
      },
    });
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await db.student.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });
  }

  async createEnrollment(
    tx: Prisma.TransactionClient | PrismaClient,
    studentId: string,
    data: Omit<StudentEnrollment, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>
  ): Promise<StudentEnrollment> {
    return tx.studentEnrollment.create({
      data: {
        ...data,
        studentId,
        isCurrent: true,
      },
    });
  }

  async linkGuardian(
    tx: Prisma.TransactionClient | PrismaClient,
    studentId: string,
    guardianId: string,
    data: { relationship: string; isPrimary: boolean }
  ): Promise<void> {
    await tx.studentGuardian.create({
      data: {
        studentId,
        guardianId,
        relationship: data.relationship,
        isPrimary: data.isPrimary,
      },
    });
  }

  private parseSort(sort?: string): Prisma.StudentOrderByWithRelationInput[] {
    if (!sort) {
      return [{ createdAt: 'desc' }];
    }

    return sort.split(',').map((field) => {
      const desc = field.startsWith('-');
      const fieldName = desc ? field.slice(1) : field;
      return { [fieldName]: desc ? 'desc' : 'asc' };
    });
  }
}
```

### 4.5 Validator (`*.validator.ts`)

**Responsibility:** Zod schemas for request validation.

```typescript
// student.validator.ts
import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
});

export const guardianInputSchema = z.object({
  relationship: z.enum(['father', 'mother', 'guardian', 'grandparent', 'other']),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(1).max(20),
  occupation: z.string().max(100).optional(),
  createUserAccount: z.boolean().default(true),
});

export const enrollmentInputSchema = z.object({
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().max(20).optional(),
  admissionDate: z.string().datetime(),
});

export const createStudentSchema = z.object({
  admissionNumber: z.string().max(50).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().max(5).optional(),
  nationality: z.string().max(100).optional(),
  religion: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  address: addressSchema.optional(),
  branchId: z.string().uuid(),
  enrollment: enrollmentInputSchema.optional(),
  guardian: guardianInputSchema.optional(),
  medicalInfo: z.object({
    allergies: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    emergencyContact: z.string().optional(),
  }).optional(),
});

export const updateStudentSchema = createStudentSchema.partial().omit({
  branchId: true,
  enrollment: true,
  guardian: true,
});

export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  branchId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'transferred', 'graduated', 'withdrawn']).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  search: z.string().max(100).optional(),
  sort: z.string().max(100).optional(),
});

export const enrollStudentSchema = z.object({
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().max(20).optional(),
  effectiveDate: z.string().datetime(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
```

### 4.6 Types (`*.types.ts`)

**Responsibility:** Module-specific TypeScript types.

```typescript
// student.types.ts
import type { Student, StudentEnrollment, Branch, Class, Section } from '@prisma/client';

export type StudentWithRelations = Student & {
  branch: Branch;
  currentEnrollment?: StudentEnrollment & {
    class: Class;
    section: Section;
  };
};

export interface StudentResponse {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  branch: {
    id: string;
    name: string;
  };
  currentEnrollment?: {
    academicYear: string;
    class: string;
    section: string;
    rollNumber: string | null;
  };
  createdAt: string;
}

export interface StudentListItem {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  status: string;
  class?: string;
  section?: string;
}
```

### 4.7 Mapper (`*.mapper.ts`)

**Responsibility:** Transform between entities and DTOs.

```typescript
// student.mapper.ts
import type { StudentWithRelations, StudentResponse } from './student.types';

export class StudentMapper {
  static toResponse(student: StudentWithRelations): StudentResponse {
    return {
      id: student.id,
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth.toISOString(),
      gender: student.gender,
      status: student.status,
      branch: {
        id: student.branch.id,
        name: student.branch.name,
      },
      currentEnrollment: student.currentEnrollment
        ? {
            academicYear: student.currentEnrollment.academicYear?.name ?? '',
            class: student.currentEnrollment.class.name,
            section: student.currentEnrollment.section.name,
            rollNumber: student.currentEnrollment.rollNumber,
          }
        : undefined,
      createdAt: student.createdAt.toISOString(),
    };
  }
}
```

---

## 5. Naming Conventions

### 5.1 File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Routes | `{module}.routes.ts` | `student.routes.ts` |
| Controller | `{module}.controller.ts` | `student.controller.ts` |
| Service | `{module}.service.ts` | `student.service.ts` |
| Repository | `{module}.repository.ts` | `student.repository.ts` |
| Validator | `{module}.validator.ts` | `student.validator.ts` |
| Types | `{module}.types.ts` | `student.types.ts` |
| Mapper | `{module}.mapper.ts` | `student.mapper.ts` |
| Middleware | `{name}.middleware.ts` | `auth.middleware.ts` |
| Tests | `{module}.{layer}.test.ts` | `student.service.test.ts` |

### 5.2 Code Naming

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `StudentService` |
| Interfaces/Types | PascalCase | `StudentResponse` |
| Functions/Methods | camelCase | `findById`, `createStudent` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Environment Variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| Database Tables | snake_case | `students`, `academic_years` |
| Database Columns | snake_case | `first_name`, `created_at` |
| API Endpoints | kebab-case | `/api/v1/academic-years` |
| Query Parameters | camelCase | `branchId`, `academicYearId` |

### 5.3 Import Order

```typescript
// 1. Node.js built-ins
import { randomUUID } from 'crypto';

// 2. External packages
import { Hono } from 'hono';
import { z } from 'zod';

// 3. Internal packages (monorepo)
import { db } from '@school-erp/database';
import { NotFoundError } from '@school-erp/shared';

// 4. Relative imports - parent directories
import { authMiddleware } from '@/middleware/auth.middleware';

// 5. Relative imports - same directory
import { StudentService } from './student.service';
import type { StudentResponse } from './student.types';
```

---

## 6. Error Handling Pattern

### 6.1 Error Classes

```typescript
// packages/shared/src/errors/base.error.ts
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

// packages/shared/src/errors/not-found.error.ts
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
  }
}

// packages/shared/src/errors/validation.error.ts
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly errors: { field: string; message: string }[];

  constructor(errors: { field: string; message: string }[]) {
    super('Validation failed');
    this.errors = errors;
  }

  toJSON() {
    return this.errors.map((e) => ({
      code: this.code,
      field: e.field,
      message: e.message,
    }));
  }
}

// packages/shared/src/errors/conflict.error.ts
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
}

// packages/shared/src/errors/forbidden.error.ts
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';
}

// packages/shared/src/errors/unauthorized.error.ts
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'UNAUTHORIZED';
}
```

### 6.2 Error Middleware

```typescript
// apps/api/src/middleware/error.middleware.ts
import type { ErrorHandler } from 'hono';
import { AppError, ValidationError } from '@school-erp/shared';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';

export const errorMiddleware: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId');

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      code: 'VALIDATION_ERROR',
      field: e.path.join('.'),
      message: e.message,
    }));

    return c.json(
      {
        success: false,
        data: null,
        meta: null,
        errors,
      },
      400
    );
  }

  // Application errors
  if (err instanceof AppError) {
    logger.warn({
      requestId,
      error: err.code,
      message: err.message,
    });

    const errors = err instanceof ValidationError 
      ? err.toJSON() 
      : [err.toJSON()];

    return c.json(
      {
        success: false,
        data: null,
        meta: null,
        errors,
      },
      err.statusCode
    );
  }

  // Unexpected errors
  logger.error({
    requestId,
    error: err.message,
    stack: err.stack,
  });

  return c.json(
    {
      success: false,
      data: null,
      meta: null,
      errors: [
        {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      ],
    },
    500
  );
};
```

---

## 7. Logging Strategy

### 7.1 Logger Configuration

```typescript
// apps/api/src/lib/logger.ts
import pino from 'pino';
import { env } from '@/config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
  redact: ['req.headers.authorization', 'password', 'passwordHash'],
});

export type Logger = typeof logger;
```

### 7.2 Request Logging Middleware

```typescript
// apps/api/src/middleware/logger.middleware.ts
import type { MiddlewareHandler } from 'hono';
import { logger } from '@/lib/logger';

export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const requestId = c.get('requestId');

  logger.info({
    requestId,
    method: c.req.method,
    path: c.req.path,
    query: c.req.query(),
    userAgent: c.req.header('user-agent'),
  });

  await next();

  const duration = Date.now() - start;

  logger.info({
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
  });
};
```

### 7.3 Log Levels

| Level | Usage |
|-------|-------|
| `error` | Unhandled exceptions, critical failures |
| `warn` | Handled errors, deprecation warnings |
| `info` | Request/response, significant events |
| `debug` | Detailed flow information |
| `trace` | Fine-grained debugging |

---

## 8. Transaction Handling

### 8.1 Transaction Pattern

```typescript
// Service layer handles transactions
async createWithRelations(input: CreateInput, ctx: RequestContext) {
  return db.$transaction(async (tx) => {
    // All operations use `tx` instead of `db`
    const parent = await this.repository.create(tx, parentData);
    const child = await this.childRepository.create(tx, { ...childData, parentId: parent.id });
    
    return { parent, child };
  });
}
```

### 8.2 Repository Transaction Support

```typescript
// Repository accepts optional transaction client
async create(
  tx: Prisma.TransactionClient | PrismaClient = db,
  data: CreateData
): Promise<Entity> {
  return tx.entity.create({ data });
}
```

### 8.3 Transaction Rules

1. **Services own transactions** - Controllers never start transactions
2. **Repositories accept transaction client** - Pass `tx` or default to `db`
3. **Keep transactions short** - Avoid long-running operations inside transactions
4. **Handle rollback** - Prisma auto-rollbacks on error; no manual handling needed

---

## 9. Tenant Isolation

### 9.1 Tenant Middleware

```typescript
// apps/api/src/middleware/tenant.middleware.ts
import type { MiddlewareHandler } from 'hono';
import { UnauthorizedError } from '@school-erp/shared';
import type { JWTPayload } from '@/lib/jwt';

export const tenantMiddleware: MiddlewareHandler = async (c, next) => {
  const payload = c.get('jwtPayload') as JWTPayload;
  
  if (!payload?.tenantId) {
    throw new UnauthorizedError('Tenant context required');
  }

  // Super admin can override tenant
  const headerTenantId = c.req.header('X-Tenant-ID');
  if (headerTenantId && payload.isSuperAdmin) {
    c.set('tenantId', headerTenantId);
  } else {
    c.set('tenantId', payload.tenantId);
  }

  // Set request context for downstream use
  c.set('requestContext', {
    tenantId: c.get('tenantId'),
    userId: payload.userId,
    branches: payload.branches,
    permissions: payload.permissions,
  });

  await next();
};
```

### 9.2 Repository Tenant Enforcement

```typescript
// EVERY query MUST include tenantId
async findById(id: string, tenantId: string): Promise<Entity | null> {
  return db.entity.findFirst({
    where: {
      id,
      tenantId, // MANDATORY
      deletedAt: null,
    },
  });
}

// List queries MUST filter by tenantId
async findMany(params: { tenantId: string; /* ... */ }): Promise<Entity[]> {
  return db.entity.findMany({
    where: {
      tenantId: params.tenantId, // MANDATORY
      deletedAt: null,
      // other filters...
    },
  });
}
```

### 9.3 Prisma Extension (Optional)

```typescript
// packages/database/src/extensions/tenant.ts
import { Prisma } from '@prisma/client';

export const tenantExtension = Prisma.defineExtension({
  query: {
    $allOperations({ operation, args, query }) {
      // Automatically inject tenantId for tenant-scoped models
      // Use with caution - explicit is preferred
      return query(args);
    },
  },
});
```

---

## 10. Permission Checking

### 10.1 Permission Middleware

```typescript
// apps/api/src/middleware/permission.middleware.ts
import type { MiddlewareHandler } from 'hono';
import { ForbiddenError } from '@school-erp/shared';
import type { RequestContext } from '@/types/context';

export const permissionMiddleware = (
  requiredPermission: string
): MiddlewareHandler => {
  return async (c, next) => {
    const ctx = c.get('requestContext') as RequestContext;

    if (!ctx) {
      throw new ForbiddenError('No context available');
    }

    // Super admin bypasses permission check
    if (ctx.isSuperAdmin) {
      await next();
      return;
    }

    // Check if user has the required permission
    const hasPermission = ctx.permissions.some((p) => {
      // Exact match
      if (p === requiredPermission) return true;
      
      // Wildcard match (e.g., "student:*" matches "student:read")
      const [resource, action] = requiredPermission.split(':');
      const [pResource, pAction] = p.split(':');
      
      if (pResource === resource && pAction === '*') return true;
      
      return false;
    });

    if (!hasPermission) {
      throw new ForbiddenError('Insufficient permissions');
    }

    await next();
  };
};
```

### 10.2 Permission Scopes

```typescript
// Service layer checks scope
async getById(id: string, ctx: RequestContext): Promise<Entity> {
  const entity = await this.repository.findById(id, ctx.tenantId);
  
  if (!entity) {
    throw new NotFoundError('Entity not found');
  }

  // Scope check: Does user have access to this entity's branch?
  const hasPermissionScope = this.checkPermissionScope(entity, ctx);
  
  if (!hasPermissionScope) {
    throw new ForbiddenError('No access to this resource');
  }

  return entity;
}

private checkPermissionScope(entity: Entity, ctx: RequestContext): boolean {
  // Branch-scoped: User must have access to entity's branch
  if (entity.branchId && !ctx.branches.includes(entity.branchId)) {
    return false;
  }
  
  // Owner-scoped: Check if user owns the resource
  // ... additional scope checks
  
  return true;
}
```

---

## 11. Soft Delete Handling

### 11.1 Repository Pattern

```typescript
// All read queries MUST exclude soft-deleted records
async findById(id: string, tenantId: string): Promise<Entity | null> {
  return db.entity.findFirst({
    where: {
      id,
      tenantId,
      deletedAt: null, // MANDATORY
    },
  });
}

// Soft delete implementation
async softDelete(id: string, deletedBy: string): Promise<void> {
  await db.entity.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedBy: deletedBy,
    },
  });
}

// Hard delete (admin only, rare cases)
async hardDelete(id: string): Promise<void> {
  await db.entity.delete({ where: { id } });
}
```

### 11.2 Prisma Extension (Optional)

```typescript
// packages/database/src/extensions/soft-delete.ts
import { Prisma } from '@prisma/client';

export const softDeleteExtension = Prisma.defineExtension({
  model: {
    $allModels: {
      async softDelete<T>(
        this: T,
        id: string,
        deletedBy?: string
      ): Promise<void> {
        const context = Prisma.getExtensionContext(this);
        await (context as any).update({
          where: { id },
          data: {
            deletedAt: new Date(),
            ...(deletedBy && { updatedBy: deletedBy }),
          },
        });
      },
    },
  },
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});
```

---

## 12. Response Utilities

```typescript
// apps/api/src/lib/response.ts
import type { Context } from 'hono';
import type { PaginationMeta } from '@school-erp/shared';

export function successResponse<T>(
  c: Context,
  data: T,
  meta?: PaginationMeta
) {
  return c.json({
    success: true,
    data,
    meta: meta ?? null,
    errors: null,
  }, 200);
}

export function createdResponse<T>(c: Context, data: T) {
  return c.json({
    success: true,
    data,
    meta: null,
    errors: null,
  }, 201);
}

export function noContentResponse(c: Context) {
  return c.body(null, 204);
}
```

---

## 13. Request Context

```typescript
// apps/api/src/types/context.ts
import type { Context } from 'hono';

export interface RequestContext {
  tenantId: string;
  userId: string;
  branches: string[];
  permissions: string[];
  isSuperAdmin?: boolean;
}

export interface AppVariables {
  requestId: string;
  tenantId: string;
  requestContext: RequestContext;
  validatedBody: unknown;
  validatedQuery: unknown;
}

export type AppContext = Context<{ Variables: AppVariables }>;
```

---

## 14. Document Sign-Off

| Role | Status |
|------|--------|
| Principal Backend Engineer | ✅ Approved |
| Tech Lead | ⏳ Pending |
| Security Lead | ⏳ Pending |

---

**This document is the authoritative backend scaffold specification. All module implementations must follow these conventions.**
