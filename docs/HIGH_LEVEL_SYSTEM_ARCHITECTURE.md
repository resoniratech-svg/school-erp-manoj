# High-Level System Architecture (HLD)

**Document ID:** SCHOOL-ERP-HLD-v1.0  
**Status:** APPROVED FOR IMPLEMENTATION  
**Last Updated:** 2026-01-14  
**Owner:** Principal Software Architect  
**Parent Document:** SCHOOL-ERP-SCOPE-v1.0  

---

## 1. Architecture Overview

### 1.1 Architecture Style

**Modular Monolith with Service Boundaries** — designed for eventual microservices extraction.

| Decision | Rationale |
|----------|-----------|
| Not pure microservices | Premature distribution adds complexity; v1 needs speed |
| Not monolithic god-service | Clear module boundaries enable future extraction |
| API Gateway pattern | Single entry point for all clients; centralized auth/rate-limiting |
| Shared database with schema isolation | Simplifies transactions; tenant isolation via row-level security |

### 1.2 System Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│    [Web App]    [Future Mobile]    [Third-Party Integrations]    [Admin]    │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Routing   │ │ Rate Limit  │ │ Auth Check  │ │  Logging    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────────────┐
│  AUTH SERVICE   │ │  CORE SERVICES  │ │        DOMAIN SERVICES              │
│                 │ │                 │ │                                     │
│ • Authentication│ │ • Tenant        │ │ • Student      • Attendance         │
│ • Token Mgmt    │ │ • Branch        │ │ • Academic     • Fee                │
│ • Session       │ │ • User          │ │ • Staff        • Examination        │
│ • API Keys      │ │ • Role          │ │ • Timetable    • Communication      │
│                 │ │ • Permission    │ │ • Transport    • Library            │
└────────┬────────┘ └────────┬────────┘ └─────────────────┬───────────────────┘
         │                   │                             │
         └───────────────────┴─────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SHARED INFRASTRUCTURE                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Audit     │ │  Reporting  │ │   Config    │ │   Cache     │           │
│  │   Logger    │ │   Engine    │ │   Manager   │ │   Layer     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                          │
│  ┌───────────────────────────────────────┐  ┌─────────────────────────────┐ │
│  │         PostgreSQL (Primary)          │  │    Redis (Cache/Session)    │ │
│  │  • Multi-tenant with RLS              │  │  • Session store            │ │
│  │  • Schema per logical domain          │  │  • API rate limiting        │ │
│  │  • Audit tables                       │  │  • Temporary data           │ │
│  └───────────────────────────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Services Catalog

### 2.1 Service Classification

| Tier | Services | Characteristics |
|------|----------|-----------------|
| **Tier 0: Gateway** | API Gateway | Entry point, no business logic |
| **Tier 1: Identity** | Auth Service | Authentication, tokens, sessions |
| **Tier 2: Core** | Tenant, Branch, User, Role | Foundational; all other services depend on these |
| **Tier 3: Domain** | Student, Academic, Staff, Attendance, Fee, Exam, Timetable, Communication, Transport, Library | Business logic; depend on Tier 2 |
| **Tier 4: Cross-Cutting** | Audit, Reporting | Observability; consume events from all tiers |

---

## 3. Service Specifications

### 3.1 API Gateway

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Single entry point for all API requests; routing, rate limiting, authentication verification |
| **Owned Data** | None (stateless) |
| **API Responsibility** | Route requests to appropriate services; enforce rate limits; validate JWT tokens |
| **Dependencies** | Auth Service (token validation) |

### 3.2 Auth Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Handle authentication, token issuance, session management, API key management |
| **Owned Data** | `auth_sessions`, `refresh_tokens`, `api_keys`, `password_reset_tokens` |
| **API Responsibility** | Login, logout, token refresh, password reset, API key CRUD |
| **Dependencies** | User Service (user lookup), Tenant Service (tenant validation) |

**Key APIs:**
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/password/reset`
- `POST /auth/password/change`
- `GET/POST/DELETE /auth/api-keys`

### 3.3 Tenant Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Organization (tenant) onboarding, configuration, lifecycle management |
| **Owned Data** | `tenants`, `tenant_settings`, `tenant_subscriptions` |
| **API Responsibility** | Tenant CRUD, tenant configuration, tenant status management |
| **Dependencies** | None (root service) |

**Key APIs:**
- `POST /tenants` (create organization)
- `GET /tenants/:id`
- `PATCH /tenants/:id`
- `GET /tenants/:id/settings`
- `PATCH /tenants/:id/settings`

### 3.4 Branch Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Branch/campus management within a tenant, branch hierarchy |
| **Owned Data** | `branches`, `branch_settings`, `branch_hierarchy` |
| **API Responsibility** | Branch CRUD, branch hierarchy management, branch-level configuration |
| **Dependencies** | Tenant Service |

**Key APIs:**
- `POST /tenants/:tenantId/branches`
- `GET /tenants/:tenantId/branches`
- `GET /branches/:id`
- `PATCH /branches/:id`
- `GET /branches/:id/hierarchy`

### 3.5 User Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | User account management, profile management, multi-branch user access |
| **Owned Data** | `users`, `user_profiles`, `user_branch_access` |
| **API Responsibility** | User CRUD, profile management, branch access assignment |
| **Dependencies** | Tenant Service, Branch Service |

**Key APIs:**
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `GET /users/:id/branches`
- `POST /users/:id/branches`
- `GET /branches/:branchId/users`

### 3.6 Role & Permission Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Role management, permission assignment, access control |
| **Owned Data** | `roles`, `permissions`, `role_permissions`, `user_roles` |
| **API Responsibility** | Role CRUD, permission management, role assignment to users |
| **Dependencies** | Tenant Service, User Service |

**Key APIs:**
- `GET /roles` (system + custom roles)
- `POST /tenants/:tenantId/roles` (custom role)
- `GET /roles/:id/permissions`
- `PUT /roles/:id/permissions`
- `POST /users/:id/roles`
- `GET /users/:id/permissions` (computed)

### 3.7 Student Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Student lifecycle management: registration, enrollment, transfers, status |
| **Owned Data** | `students`, `student_enrollments`, `student_guardians`, `student_documents`, `student_transfers` |
| **API Responsibility** | Student CRUD, enrollment management, guardian linking, transfer processing |
| **Dependencies** | Tenant Service, Branch Service, Academic Service (class/section) |

**Key APIs:**
- `POST /students`
- `GET /students/:id`
- `PATCH /students/:id`
- `POST /students/:id/enroll`
- `POST /students/:id/transfer`
- `GET /students/:id/guardians`
- `GET /branches/:branchId/students`
- `GET /classes/:classId/students`

### 3.8 Academic Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Academic structure: years, classes, sections, subjects, curriculum |
| **Owned Data** | `academic_years`, `classes`, `sections`, `subjects`, `class_subjects`, `curricula` |
| **API Responsibility** | Academic year management, class/section CRUD, subject mapping |
| **Dependencies** | Tenant Service, Branch Service |

**Key APIs:**
- `POST /academic-years`
- `GET /academic-years`
- `GET /academic-years/:id/classes`
- `POST /classes`
- `GET /classes/:id/sections`
- `POST /sections`
- `GET /subjects`
- `POST /classes/:id/subjects`

### 3.9 Staff Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Staff (non-teaching and teaching) management, designations, departments |
| **Owned Data** | `staff`, `staff_profiles`, `designations`, `departments`, `staff_branch_assignments` |
| **API Responsibility** | Staff CRUD, designation management, department assignment |
| **Dependencies** | Tenant Service, Branch Service, User Service |

**Key APIs:**
- `POST /staff`
- `GET /staff/:id`
- `PATCH /staff/:id`
- `GET /branches/:branchId/staff`
- `GET /designations`
- `POST /designations`
- `GET /departments`
- `POST /departments`

### 3.10 Attendance Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Daily attendance marking, attendance tracking, reports |
| **Owned Data** | `attendance_records`, `attendance_summaries` |
| **API Responsibility** | Mark attendance, retrieve attendance, generate attendance reports |
| **Dependencies** | Student Service, Academic Service (class/section), Staff Service (for staff attendance) |

**Key APIs:**
- `POST /attendance` (bulk mark)
- `GET /attendance/students/:studentId`
- `GET /attendance/classes/:classId/date/:date`
- `GET /attendance/reports/summary`
- `GET /attendance/reports/student/:studentId`

### 3.11 Fee Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Fee structure, fee assignment, payment recording, dues tracking |
| **Owned Data** | `fee_structures`, `fee_types`, `fee_assignments`, `fee_payments`, `fee_receipts`, `fee_dues` |
| **API Responsibility** | Fee structure CRUD, assign fees, record payments, generate receipts, track dues |
| **Dependencies** | Tenant Service, Branch Service, Student Service, Academic Service |

**Key APIs:**
- `POST /fee-structures`
- `GET /fee-structures`
- `POST /students/:id/fees/assign`
- `GET /students/:id/fees`
- `POST /students/:id/fees/payments`
- `GET /students/:id/fees/receipts`
- `GET /branches/:branchId/fees/dues`
- `GET /fees/reports/collection`

### 3.12 Examination Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Exam scheduling, grade entry, report card generation |
| **Owned Data** | `exams`, `exam_schedules`, `exam_results`, `grade_scales`, `report_cards` |
| **API Responsibility** | Exam CRUD, schedule management, result entry, report card generation |
| **Dependencies** | Academic Service, Student Service, Staff Service (examiner) |

**Key APIs:**
- `POST /exams`
- `GET /exams`
- `POST /exams/:id/schedule`
- `POST /exams/:id/results` (bulk entry)
- `GET /students/:id/results`
- `GET /students/:id/report-card`
- `GET /classes/:classId/results`

### 3.13 Timetable Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Period configuration, teacher-subject mapping, timetable generation |
| **Owned Data** | `periods`, `timetables`, `timetable_entries`, `teacher_subject_assignments` |
| **API Responsibility** | Period CRUD, timetable generation, conflict detection, teacher assignment |
| **Dependencies** | Academic Service, Staff Service, Branch Service |

**Key APIs:**
- `POST /periods`
- `GET /branches/:branchId/periods`
- `POST /timetables`
- `GET /classes/:classId/timetable`
- `GET /teachers/:teacherId/timetable`
- `POST /timetables/validate` (conflict check)

### 3.14 Communication Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Announcements, circulars, notification dispatch (hooks for email/SMS) |
| **Owned Data** | `announcements`, `circulars`, `notification_logs`, `notification_templates` |
| **API Responsibility** | Announcement CRUD, circular management, notification dispatch |
| **Dependencies** | Tenant Service, Branch Service, User Service, Student Service |

**Key APIs:**
- `POST /announcements`
- `GET /announcements`
- `POST /circulars`
- `GET /circulars`
- `POST /notifications/dispatch`
- `GET /notifications/logs`

### 3.15 Transport Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Route management, vehicle tracking, student-route assignment |
| **Owned Data** | `routes`, `vehicles`, `drivers`, `route_stops`, `student_transport_assignments` |
| **API Responsibility** | Route CRUD, vehicle management, student assignment to routes |
| **Dependencies** | Branch Service, Student Service, Staff Service (driver) |

**Key APIs:**
- `POST /routes`
- `GET /branches/:branchId/routes`
- `POST /vehicles`
- `GET /vehicles`
- `POST /students/:id/transport`
- `GET /routes/:id/students`

### 3.16 Library Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Book catalog, issue/return, fine management |
| **Owned Data** | `books`, `book_categories`, `book_issues`, `book_returns`, `library_fines` |
| **API Responsibility** | Book CRUD, issue/return processing, fine calculation |
| **Dependencies** | Branch Service, Student Service, Staff Service |

**Key APIs:**
- `POST /books`
- `GET /books`
- `POST /books/:id/issue`
- `POST /books/:id/return`
- `GET /students/:id/library/history`
- `GET /students/:id/library/fines`

### 3.17 Audit Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Action logging, data change tracking, compliance reporting |
| **Owned Data** | `audit_logs`, `data_change_logs` |
| **API Responsibility** | Log retrieval, audit report generation |
| **Dependencies** | All services (receives events) |

**Key APIs:**
- `GET /audit/logs`
- `GET /audit/logs/user/:userId`
- `GET /audit/logs/entity/:entityType/:entityId`
- `GET /audit/reports`

### 3.18 Reporting Service

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Pre-built reports, data aggregation, export functionality |
| **Owned Data** | `report_definitions`, `report_schedules`, `generated_reports` |
| **API Responsibility** | Report generation, export to CSV/PDF, scheduled reports |
| **Dependencies** | All domain services (read-only access) |

**Key APIs:**
- `GET /reports/templates`
- `POST /reports/generate`
- `GET /reports/:id/download`
- `POST /reports/schedule`

---

## 4. Service Dependency Matrix

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    DEPENDS ON →                              │
                    │ Tenant │ Branch │ User │ Role │ Student │ Academic │ Staff  │
┌───────────────────┼────────┼────────┼──────┼──────┼─────────┼──────────┼────────┤
│ Auth              │   ✓    │        │  ✓   │      │         │          │        │
│ Branch            │   ✓    │        │      │      │         │          │        │
│ User              │   ✓    │   ✓    │      │      │         │          │        │
│ Role              │   ✓    │        │  ✓   │      │         │          │        │
│ Student           │   ✓    │   ✓    │      │      │         │    ✓     │        │
│ Academic          │   ✓    │   ✓    │      │      │         │          │        │
│ Staff             │   ✓    │   ✓    │  ✓   │      │         │          │        │
│ Attendance        │        │        │      │      │    ✓    │    ✓     │   ✓    │
│ Fee               │   ✓    │   ✓    │      │      │    ✓    │    ✓     │        │
│ Examination       │        │        │      │      │    ✓    │    ✓     │   ✓    │
│ Timetable         │        │   ✓    │      │      │         │    ✓     │   ✓    │
│ Communication     │   ✓    │   ✓    │  ✓   │      │    ✓    │          │        │
│ Transport         │        │   ✓    │      │      │    ✓    │          │   ✓    │
│ Library           │        │   ✓    │      │      │    ✓    │          │   ✓    │
│ Audit             │   *    │   *    │  *   │  *   │    *    │    *     │   *    │
│ Reporting         │   *    │   *    │  *   │  *   │    *    │    *     │   *    │
└───────────────────┴────────┴────────┴──────┴──────┴─────────┴──────────┴────────┘

✓ = Direct dependency (service calls)
* = Read-only/Event consumption
```

---

## 5. Cross-Cutting Concerns

### 5.1 Authentication & Authorization

| Concern | Implementation |
|---------|----------------|
| **Authentication** | JWT-based; issued by Auth Service; validated at API Gateway |
| **Authorization** | Permission-based; checked at service level via middleware |
| **Token Structure** | Access token (15 min) + Refresh token (7 days) |
| **Multi-Tenancy** | Tenant ID embedded in JWT; enforced at every service |
| **Multi-Branch** | Branch access list in JWT; branch-level permission check |

**JWT Payload Structure:**
```
{
  "sub": "user_id",
  "tenant_id": "tenant_uuid",
  "branch_ids": ["branch_uuid_1", "branch_uuid_2"],
  "roles": ["TEACHER", "CLASS_TEACHER"],
  "permissions": ["student:read", "attendance:write"],
  "exp": 1234567890
}
```

### 5.2 Tenant Isolation

| Layer | Isolation Strategy |
|-------|-------------------|
| **API** | Tenant ID extracted from JWT; all queries scoped to tenant |
| **Database** | Row-Level Security (RLS) with tenant_id column on all tables |
| **Cache** | Cache keys prefixed with tenant_id |
| **Files** | Storage paths prefixed with tenant_id |

### 5.3 Auditing

| Event Type | Captured Data |
|------------|---------------|
| **API Calls** | Endpoint, method, user, tenant, branch, timestamp, response code |
| **Data Changes** | Entity type, entity ID, old value, new value, user, timestamp |
| **Auth Events** | Login, logout, failed attempts, password changes |
| **System Events** | Service errors, rate limit hits, permission denials |

### 5.4 Error Handling

| Category | HTTP Code | Response Structure |
|----------|-----------|-------------------|
| **Validation Error** | 400 | `{ "error": "VALIDATION_ERROR", "details": [...] }` |
| **Authentication** | 401 | `{ "error": "UNAUTHORIZED", "message": "..." }` |
| **Authorization** | 403 | `{ "error": "FORBIDDEN", "message": "..." }` |
| **Not Found** | 404 | `{ "error": "NOT_FOUND", "resource": "..." }` |
| **Conflict** | 409 | `{ "error": "CONFLICT", "message": "..." }` |
| **Server Error** | 500 | `{ "error": "INTERNAL_ERROR", "reference": "error_id" }` |

### 5.5 Configuration Management

| Config Type | Storage | Example |
|-------------|---------|---------|
| **Environment** | Environment variables | Database URL, API keys, secrets |
| **Tenant Config** | Database | Feature flags, limits, preferences |
| **Branch Config** | Database | Working hours, academic calendar |
| **System Config** | Database + Cache | Rate limits, global settings |

---

## 6. Repository Structure

### 6.1 Decision: Monorepo

| Factor | Monorepo | Polyrepo |
|--------|----------|----------|
| Code sharing | ✅ Easy | ❌ Complex |
| Refactoring | ✅ Atomic | ❌ Multi-repo PRs |
| CI/CD | ✅ Unified | ❌ Per-repo setup |
| Team size (< 20) | ✅ Ideal | ❌ Overkill |
| v1 velocity | ✅ Faster | ❌ Slower |

**Decision:** Monorepo with clear module boundaries.

### 6.2 Top-Level Folder Layout

```
school-erp/
├── apps/
│   ├── api/                    # Main API application (Express/Fastify)
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── tenant/
│   │   │   │   ├── branch/
│   │   │   │   ├── user/
│   │   │   │   ├── role/
│   │   │   │   ├── student/
│   │   │   │   ├── academic/
│   │   │   │   ├── staff/
│   │   │   │   ├── attendance/
│   │   │   │   ├── fee/
│   │   │   │   ├── examination/
│   │   │   │   ├── timetable/
│   │   │   │   ├── communication/
│   │   │   │   ├── transport/
│   │   │   │   ├── library/
│   │   │   │   ├── audit/
│   │   │   │   └── reporting/
│   │   │   ├── middleware/     # Auth, tenant, error handling
│   │   │   ├── config/         # App configuration
│   │   │   └── main.ts         # Application entry
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── web/                    # Frontend (Next.js) - separate concern
│       └── ...
│
├── packages/
│   ├── database/               # Prisma schema, migrations, seed
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   ├── shared/                 # Shared types, constants, utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   ├── constants/      # Enums, magic values
│   │   │   ├── utils/          # Pure utility functions
│   │   │   └── validators/     # Zod schemas
│   │   └── package.json
│   │
│   └── api-client/             # Generated API client (for frontend)
│       └── ...
│
├── docs/                       # Architecture docs, ADRs
│   ├── PRODUCT_SCOPE_AND_EXECUTION_BOUNDARY.md
│   ├── HIGH_LEVEL_SYSTEM_ARCHITECTURE.md
│   └── adr/                    # Architecture Decision Records
│
├── scripts/                    # Dev scripts, setup scripts
├── .github/                    # CI/CD workflows
├── docker-compose.yml          # Local development
├── package.json                # Workspace root
└── turbo.json                  # Monorepo build orchestration
```

### 6.3 Module Structure (Inside Each Feature Module)

```
modules/student/
├── student.controller.ts       # HTTP handlers
├── student.service.ts          # Business logic
├── student.repository.ts       # Data access
├── student.routes.ts           # Route definitions
├── student.validator.ts        # Request validation (Zod)
├── student.types.ts            # Module-specific types
└── __tests__/
    ├── student.service.test.ts
    └── student.controller.test.ts
```

### 6.4 Shared Libraries Strategy

| Package | Purpose | Consumers |
|---------|---------|-----------|
| `@school-erp/database` | Prisma client, migrations | API |
| `@school-erp/shared` | Types, validators, utils | API, Web, API Client |
| `@school-erp/api-client` | Type-safe API client | Web, Mobile (future) |

---

## 7. Technology Stack (Recommended)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Node.js 20+ | Team familiarity, ecosystem |
| **Language** | TypeScript 5+ | Type safety, maintainability |
| **API Framework** | Hono / Express | Lightweight, well-documented |
| **Database** | PostgreSQL 15+ | RLS support, JSON, reliability |
| **ORM** | Prisma | Type-safe, migrations, great DX |
| **Validation** | Zod | Runtime + compile-time safety |
| **Auth** | JWT (jose library) | Standard, stateless |
| **Cache** | Redis | Sessions, rate limiting |
| **Testing** | Vitest + Supertest | Fast, Jest-compatible |
| **API Docs** | OpenAPI 3.1 | Industry standard |
| **Monorepo** | Turborepo | Fast builds, caching |

---

## 8. API Versioning Strategy

| Aspect | Decision |
|--------|----------|
| **Versioning Scheme** | URL-based: `/api/v1/...` |
| **Breaking Changes** | New version (`/api/v2/...`) |
| **Deprecation Policy** | 6-month notice, then sunset |
| **Non-Breaking Changes** | Additive; same version |

---

## 9. Security Architecture

| Control | Implementation |
|---------|----------------|
| **Transport** | HTTPS only; HSTS headers |
| **Authentication** | JWT with RS256; short-lived access tokens |
| **Authorization** | RBAC + feature-level permissions |
| **Input Validation** | Zod schemas on all endpoints |
| **SQL Injection** | Prisma parameterized queries |
| **Rate Limiting** | Per-tenant, per-user limits |
| **Secrets** | Environment variables; never in code |
| **Audit** | All write operations logged |

---

## 10. Document Sign-Off

| Role | Status |
|------|--------|
| Principal Architect | ✅ Approved |
| Engineering Lead | ⏳ Pending |
| Security Lead | ⏳ Pending |
| DevOps Lead | ⏳ Pending |

---

**This document is the authoritative reference for system architecture. All implementation must align with this specification.**
