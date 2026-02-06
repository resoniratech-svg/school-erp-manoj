# Backend Module Implementation Plan

**Document ID:** SCHOOL-ERP-IMPL-PLAN-v1.0  
**Status:** APPROVED FOR IMPLEMENTATION  
**Last Updated:** 2026-01-14  
**Owner:** Principal Backend Engineer  
**Parent Documents:** SCHOOL-ERP-BACKEND-SCAFFOLD-v1.0, SCHOOL-ERP-API-v1.0, SCHOOL-ERP-DB-v1.0  

---

## 1. Executive Summary

This document defines the module-by-module implementation plan for the School ERP backend. Modules are ordered by **dependency graph** and **business criticality**. Each module includes responsibilities, entities, APIs, dependencies, and risk assessment.

**Total Modules:** 17  
**Estimated Timeline:** 12-16 weeks (with parallel tracks)  

---

## 2. Implementation Order & Priority Matrix

| Order | Module | Priority | Unblocks | Risk Level | Effort |
|-------|--------|----------|----------|------------|--------|
| 1 | **Database/Prisma** | P0 | Everything | 🔴 High | 2 weeks |
| 2 | **Shared Package** | P0 | All modules | 🟡 Medium | 1 week |
| 3 | **Auth** | P0 | All authenticated modules | 🔴 High | 2 weeks |
| 4 | **Tenant** | P0 | Branch, User, all tenant-scoped | 🔴 High | 1 week |
| 5 | **Branch** | P0 | Student, Staff, Academic | 🟡 Medium | 1 week |
| 6 | **User** | P0 | Role, Staff, Guardian | 🟡 Medium | 1.5 weeks |
| 7 | **Role** | P0 | Permission checks everywhere | 🔴 High | 1 week |
| 8 | **Academic** | P0 | Student, Attendance, Exam, Timetable | 🟡 Medium | 2 weeks |
| 9 | **Staff** | P1 | Attendance, Timetable | 🟡 Medium | 1.5 weeks |
| 10 | **Student** | P1 | Attendance, Fee, Exam, Transport | 🟡 Medium | 2 weeks |
| 11 | **Guardian** | P1 | Student (parent portal) | 🟢 Low | 1 week |
| 12 | **Attendance** | P1 | Reports | 🟡 Medium | 1.5 weeks |
| 13 | **Fee** | P1 | Reports (financial critical) | 🔴 High | 2.5 weeks |
| 14 | **Exam** | P1 | Report Cards | 🟡 Medium | 2 weeks |
| 15 | **Timetable** | P1 | - | 🟢 Low | 1 week |
| 16 | **Communication** | P1 | - | 🟢 Low | 1 week |
| 17 | **Transport** | P1 | - | 🟢 Low | 1 week |
| 18 | **Library** | P1 | - | 🟢 Low | 1 week |
| 19 | **Audit** | P0 | - (cross-cutting) | 🟡 Medium | 1 week |
| 20 | **Report** | P1 | - | 🟡 Medium | 1.5 weeks |

---

## 3. Dependency Graph

```
                    ┌─────────────────┐
                    │   Database      │
                    │   (Prisma)      │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │     Shared      │
                    │   (Errors,      │
                    │    Types)       │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
   │    Auth     │    │   Tenant    │    │   Audit    │
   │             │    │             │    │  (cross)   │
   └──────┬──────┘    └──────┬──────┘    └────────────┘
          │                  │
          └────────┬─────────┘
                   │
            ┌──────▼──────┐
            │   Branch    │
            └──────┬──────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
┌────▼────┐  ┌─────▼─────┐  ┌────▼────┐
│  User   │  │ Academic  │  │  Staff  │
└────┬────┘  └─────┬─────┘  └────┬────┘
     │             │             │
     └──────┬──────┼─────────────┘
            │      │
      ┌─────▼──────▼─────┐
      │      Role        │
      │   (Permissions)  │
      └────────┬─────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│Student│  │Guardian│  │(other)│
└───┬───┘  └───┬───┘  └───────┘
    │          │
    │          │
┌───▼──────────▼───┐
│                  │
│   Attendance     │
│   Fee            │
│   Exam           │
│   Timetable      │
│   Transport      │
│   Communication  │
│   Library        │
│                  │
└────────┬─────────┘
         │
    ┌────▼────┐
    │ Report  │
    └─────────┘
```

---

## 4. Module Specifications

---

### 4.1 Module: Database (Prisma)

**Priority:** P0 | **Risk:** 🔴 High | **Effort:** 2 weeks

**Location:** `packages/database`

#### Responsibilities
- Define complete Prisma schema from DB spec
- Set up migrations workflow
- Implement Prisma extensions (soft-delete, audit)
- Seed system data (permissions, system roles)
- Export typed PrismaClient singleton

#### Key Entities (All 60+ tables)
- Core: `tenants`, `branches`, `users`, `roles`, `permissions`
- Student: `students`, `student_enrollments`, `guardians`
- Staff: `staff`, `designations`, `departments`
- Academic: `academic_years`, `classes`, `sections`, `subjects`
- Operations: `attendance_records`, `fee_payments`, `exam_results`
- Supporting: `vehicles`, `books`, `announcements`, `audit_logs`

#### Critical Deliverables
- [ ] Complete `schema.prisma` matching DB spec
- [ ] Migration: initial schema
- [ ] Prisma extensions: `softDelete`, `auditLog`, `tenantScope`
- [ ] Seed script: permissions, system roles
- [ ] Type exports for all models

#### Transaction-Sensitive Operations
- N/A (foundation layer)

#### Test Strategy
- Unit: Schema validation
- Integration: Migration up/down, seed idempotency
- No E2E at this layer

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `permissions` | ~100 | All permission codes |
| `roles` (system) | 10 | SUPER_ADMIN, TENANT_ADMIN, etc. |
| `role_permissions` | ~200 | System role → permission mappings |

---

### 4.2 Module: Shared Package

**Priority:** P0 | **Risk:** 🟡 Medium | **Effort:** 1 week

**Location:** `packages/shared`

#### Responsibilities
- Error classes (AppError hierarchy)
- Shared types (API envelope, pagination)
- Utility functions (UUID, date, string)
- Permission constants
- Role constants

#### Key Entities
- N/A (no database entities)

#### Critical Deliverables
- [ ] Error classes: `NotFoundError`, `ValidationError`, `ForbiddenError`, `ConflictError`, `UnauthorizedError`
- [ ] Types: `ApiResponse<T>`, `PaginationMeta`, `PaginatedResponse<T>`
- [ ] Enums: All shared enums from schema
- [ ] Utils: `generateUUID`, `formatDate`, `slugify`
- [ ] Constants: `PERMISSIONS`, `SYSTEM_ROLES`

#### Test Strategy
- Unit: All utility functions
- No integration/E2E

---

### 4.3 Module: Auth

**Priority:** P0 | **Risk:** 🔴 High | **Effort:** 2 weeks

**Location:** `apps/api/src/modules/auth`

#### Responsibilities
- User authentication (login/logout)
- JWT token generation & refresh
- Password management (hash, reset, change)
- Session management
- API key authentication

#### Key Entities
- `users` (read-only for auth)
- `auth_sessions`
- `password_reset_tokens`
- `api_keys`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | User login |
| POST | `/auth/logout` | User logout |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/password/forgot` | Request password reset |
| POST | `/auth/password/reset` | Reset with token |
| POST | `/auth/password/change` | Change own password |
| GET | `/auth/me` | Get current user |
| GET | `/auth/sessions` | List active sessions |
| DELETE | `/auth/sessions/:id` | Revoke session |
| CRUD | `/auth/api-keys` | API key management |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, User (read), Role (read)
- **Depended by:** ALL authenticated modules

#### Transaction-Sensitive Operations
- `login`: Create session atomically
- `password/reset`: Invalidate token on use

#### Test Strategy
- Unit: JWT generation, password hashing
- Integration: Login flow, token refresh, session management
- E2E: Full auth flows with real DB

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| Test users | 5 | Super admin, tenant admin, teacher, parent, student |

---

### 4.4 Module: Tenant

**Priority:** P0 | **Risk:** 🔴 High | **Effort:** 1 week

**Location:** `apps/api/src/modules/tenant`

#### Responsibilities
- Tenant CRUD (Super Admin only)
- Tenant settings management
- Tenant statistics
- Tenant provisioning (with initial admin)

#### Key Entities
- `tenants`
- `tenant_settings`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/tenants` | Create tenant (+ admin) |
| GET | `/tenants` | List tenants (super admin) |
| GET | `/tenants/:id` | Get tenant details |
| PATCH | `/tenants/:id` | Update tenant |
| DELETE | `/tenants/:id` | Deactivate tenant |
| GET | `/tenants/:id/settings` | Get settings |
| PATCH | `/tenants/:id/settings` | Update settings |
| GET | `/tenants/:id/stats` | Get statistics |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth (middleware)
- **Depended by:** Branch, User, ALL tenant-scoped modules

#### Transaction-Sensitive Operations
- `POST /tenants`: Create tenant + admin user + initial role assignment

#### Test Strategy
- Unit: Service logic, settings merge
- Integration: Tenant creation with admin
- E2E: Full tenant provisioning flow

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `tenants` | 2 | Test tenant A, B |
| `tenant_settings` | 10 | Default settings per tenant |

---

### 4.5 Module: Branch

**Priority:** P0 | **Risk:** 🟡 Medium | **Effort:** 1 week

**Location:** `apps/api/src/modules/branch`

#### Responsibilities
- Branch CRUD within tenant
- Branch hierarchy management
- Branch settings
- Branch statistics

#### Key Entities
- `branches`
- `branch_settings`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/branches` | Create branch |
| GET | `/branches` | List branches |
| GET | `/branches/:id` | Get branch details |
| PATCH | `/branches/:id` | Update branch |
| DELETE | `/branches/:id` | Deactivate branch |
| GET | `/branches/:id/settings` | Get settings |
| PATCH | `/branches/:id/settings` | Update settings |
| GET | `/branches/:id/hierarchy` | Get branch tree |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant
- **Depended by:** User, Student, Staff, Academic, ALL branch-scoped

#### Transaction-Sensitive Operations
- None critical

#### Test Strategy
- Unit: Hierarchy traversal
- Integration: Branch CRUD, settings
- E2E: Branch creation within tenant

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `branches` | 4 | 2 per tenant (main + satellite) |

---

### 4.6 Module: User

**Priority:** P0 | **Risk:** 🟡 Medium | **Effort:** 1.5 weeks

**Location:** `apps/api/src/modules/user`

#### Responsibilities
- User CRUD (not auth)
- User-branch assignments
- User-role assignments
- User status management

#### Key Entities
- `users`
- `user_branches`
- `user_roles`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/users` | Create user |
| GET | `/users` | List users |
| GET | `/users/:id` | Get user details |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Deactivate user |
| POST | `/users/:id/activate` | Activate user |
| GET | `/users/:id/branches` | Get user branches |
| POST | `/users/:id/branches` | Assign branches |
| DELETE | `/users/:id/branches/:branchId` | Remove branch |
| GET | `/users/:id/roles` | Get user roles |
| POST | `/users/:id/roles` | Assign roles |
| DELETE | `/users/:id/roles/:roleId` | Remove role |
| GET | `/users/:id/permissions` | Get computed permissions |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch, Role
- **Depended by:** Staff, Student (user linking), Guardian

#### Transaction-Sensitive Operations
- `POST /users`: Create user + assign branches + assign roles
- `DELETE /users`: Soft delete + revoke sessions

#### Test Strategy
- Unit: Permission computation
- Integration: User creation with roles/branches
- E2E: Full user management flow

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `users` | 20 | Various user types across tenants |
| `user_branches` | 25 | User-branch mappings |
| `user_roles` | 20 | User-role mappings |

---

### 4.7 Module: Role

**Priority:** P0 | **Risk:** 🔴 High | **Effort:** 1 week

**Location:** `apps/api/src/modules/role`

#### Responsibilities
- Role CRUD (custom roles)
- System role listing
- Permission listing
- Role-permission management

#### Key Entities
- `permissions` (read-only)
- `roles`
- `role_permissions`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/roles` | List all roles |
| POST | `/roles` | Create custom role |
| GET | `/roles/:id` | Get role details |
| PATCH | `/roles/:id` | Update role |
| DELETE | `/roles/:id` | Delete custom role |
| GET | `/roles/:id/permissions` | Get role permissions |
| PUT | `/roles/:id/permissions` | Set role permissions |
| GET | `/roles/permissions` | List all permissions |
| GET | `/roles/system` | List system roles |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant
- **Depended by:** User, ALL permission-protected endpoints

#### Transaction-Sensitive Operations
- `DELETE /roles/:id`: Check no users assigned, then delete

#### Test Strategy
- Unit: Permission inheritance logic
- Integration: Role CRUD, permission assignment
- E2E: Custom role creation and assignment

#### Seed Data Requirements
Seeded by Database module (permissions, system roles)

---

### 4.8 Module: Academic

**Priority:** P0 | **Risk:** 🟡 Medium | **Effort:** 2 weeks

**Location:** `apps/api/src/modules/academic`

#### Responsibilities
- Academic year management
- Class management
- Section management
- Subject management
- Class-subject assignments

#### Key Entities
- `academic_years`
- `classes`
- `sections`
- `subjects`
- `class_subjects`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/academic/years` | Create academic year |
| GET | `/academic/years` | List academic years |
| PATCH | `/academic/years/:id` | Update academic year |
| POST | `/academic/years/:id/activate` | Set current year |
| POST | `/academic/classes` | Create class |
| GET | `/academic/classes` | List classes |
| PATCH | `/academic/classes/:id` | Update class |
| GET | `/academic/classes/:id/sections` | List sections |
| GET | `/academic/classes/:id/subjects` | List subjects |
| POST | `/academic/classes/:id/subjects` | Assign subjects |
| POST | `/academic/sections` | Create section |
| PATCH | `/academic/sections/:id` | Update section |
| POST | `/academic/subjects` | Create subject |
| GET | `/academic/subjects` | List subjects |
| PATCH | `/academic/subjects/:id` | Update subject |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch
- **Depended by:** Student (enrollment), Attendance, Exam, Timetable, Fee

#### Transaction-Sensitive Operations
- `POST /academic/years/:id/activate`: Deactivate current, activate new
- `POST /academic/classes`: Create class + default sections

#### Test Strategy
- Unit: Year validation, class ordering
- Integration: Class-section-subject hierarchy
- E2E: Full academic structure setup

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `academic_years` | 2 | Current + previous |
| `classes` | 12 | Grade 1-12 per branch |
| `sections` | 36 | 3 sections per class |
| `subjects` | 15 | Core subjects |
| `class_subjects` | 100+ | Subject assignments |

---

### 4.9 Module: Staff

**Priority:** P1 | **Risk:** 🟡 Medium | **Effort:** 1.5 weeks

**Location:** `apps/api/src/modules/staff`

#### Responsibilities
- Staff CRUD
- Designation management
- Department management
- Staff-branch assignments
- Teacher-subject assignments
- Teacher-class assignments

#### Key Entities
- `staff`
- `designations`
- `departments`
- `staff_branches`
- `teacher_subjects`
- `teacher_class_assignments`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/staff` | Create staff |
| GET | `/staff` | List staff |
| GET | `/staff/:id` | Get staff details |
| PATCH | `/staff/:id` | Update staff |
| DELETE | `/staff/:id` | Deactivate staff |
| GET | `/staff/:id/branches` | Get assigned branches |
| POST | `/staff/:id/branches` | Assign to branch |
| GET | `/staff/:id/subjects` | Get teaching subjects |
| POST | `/staff/:id/subjects` | Assign subjects |
| GET | `/staff/:id/classes` | Get assigned classes |
| CRUD | `/staff/designations` | Designation management |
| CRUD | `/staff/departments` | Department management |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch, User, Academic
- **Depended by:** Attendance (staff), Timetable, Exam (invigilator)

#### Transaction-Sensitive Operations
- `POST /staff`: Create staff + user + branch assignments + role assignment

#### Test Strategy
- Unit: Teacher assignment validation
- Integration: Staff creation with user linking
- E2E: Full staff onboarding

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `designations` | 10 | Principal, Teacher, etc. |
| `departments` | 5 | Science, Arts, Admin, etc. |
| `staff` | 30 | Teachers + non-teaching |
| `teacher_subjects` | 50 | Subject expertise |
| `teacher_class_assignments` | 80 | Class assignments |

---

### 4.10 Module: Student

**Priority:** P1 | **Risk:** 🟡 Medium | **Effort:** 2 weeks

**Location:** `apps/api/src/modules/student`

#### Responsibilities
- Student registration & CRUD
- Student enrollment management
- Student-guardian linking
- Document management
- Medical info management
- Transfer management
- Promotion workflow

#### Key Entities
- `students`
- `student_enrollments`
- `student_guardians`
- `student_documents`
- `student_medical_info`
- `student_transfers`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/students` | Register student |
| GET | `/students` | List students |
| GET | `/students/:id` | Get student details |
| PATCH | `/students/:id` | Update student |
| DELETE | `/students/:id` | Deactivate student |
| POST | `/students/:id/enroll` | Enroll in class |
| POST | `/students/:id/promote` | Promote to next class |
| POST | `/students/:id/transfer` | Transfer to branch |
| GET | `/students/:id/guardians` | List guardians |
| POST | `/students/:id/guardians` | Add guardian |
| DELETE | `/students/:id/guardians/:gid` | Remove guardian |
| GET | `/students/:id/documents` | List documents |
| POST | `/students/:id/documents` | Upload document |
| GET | `/students/:id/history` | Enrollment history |
| GET | `/students/:id/siblings` | Get siblings |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch, User, Academic, Guardian
- **Depended by:** Attendance, Fee, Exam, Transport, Library

#### Transaction-Sensitive Operations
- `POST /students`: Create student + guardian + user + enrollment
- `POST /students/:id/transfer`: Update student + create transfer record + update enrollment
- `POST /students/:id/promote`: Deactivate current enrollment + create new enrollment

#### Test Strategy
- Unit: Admission number generation, sibling detection
- Integration: Student registration with guardian
- E2E: Full admission workflow

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `students` | 200 | Spread across classes |
| `student_enrollments` | 400 | Current + historical |
| `student_guardians` | 300 | Parent links |

---

### 4.11 Module: Guardian

**Priority:** P1 | **Risk:** 🟢 Low | **Effort:** 1 week

**Location:** `apps/api/src/modules/guardian`

#### Responsibilities
- Guardian CRUD
- Guardian-student linking
- Guardian user account management

#### Key Entities
- `guardians`
- `student_guardians` (shared with Student)

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/guardians` | Create guardian |
| GET | `/guardians` | List guardians |
| GET | `/guardians/:id` | Get guardian details |
| PATCH | `/guardians/:id` | Update guardian |
| DELETE | `/guardians/:id` | Deactivate guardian |
| GET | `/guardians/:id/children` | List linked students |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, User
- **Depended by:** Student (guardian linking)

#### Transaction-Sensitive Operations
- `POST /guardians`: Create guardian + user account (optional)

#### Test Strategy
- Unit: Relationship validation
- Integration: Guardian creation with user
- E2E: Guardian-student linking

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `guardians` | 150 | Parent records |

---

### 4.12 Module: Attendance

**Priority:** P1 | **Risk:** 🟡 Medium | **Effort:** 1.5 weeks

**Location:** `apps/api/src/modules/attendance`

#### Responsibilities
- Student attendance marking (bulk)
- Staff attendance marking
- Attendance queries & summaries
- Daily/monthly reports

#### Key Entities
- `attendance_records`
- `staff_attendance_records`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/attendance/students` | Mark student attendance |
| GET | `/attendance/students` | Get attendance records |
| PATCH | `/attendance/students/:id` | Update record |
| GET | `/attendance/students/class/:classId/date/:date` | Class attendance |
| GET | `/attendance/students/:studentId` | Student attendance |
| GET | `/attendance/students/:studentId/summary` | Attendance summary |
| POST | `/attendance/staff` | Mark staff attendance |
| GET | `/attendance/staff` | Get staff attendance |
| GET | `/attendance/reports/daily` | Daily report |
| GET | `/attendance/reports/monthly` | Monthly report |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch, Academic, Student, Staff
- **Depended by:** Report (attendance reports)

#### Transaction-Sensitive Operations
- `POST /attendance/students`: Bulk insert (upsert for correction)

#### Test Strategy
- Unit: Attendance percentage calculation
- Integration: Bulk marking, duplicate handling
- E2E: Daily attendance workflow

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `attendance_records` | 10,000+ | 3 months of data |
| `staff_attendance_records` | 1,000+ | 3 months of data |

---

### 4.13 Module: Fee

**Priority:** P1 | **Risk:** 🔴 High | **Effort:** 2.5 weeks

**Location:** `apps/api/src/modules/fee`

#### Responsibilities
- Fee type management
- Fee structure creation
- Fee assignment to students
- Payment recording
- Receipt generation
- Concession management
- Collection reports

#### Key Entities
- `fee_types`
- `fee_structures`
- `fee_structure_components`
- `fee_structure_classes`
- `fee_structure_installments`
- `student_fee_assignments`
- `fee_concessions`
- `fee_payments`
- `fee_payment_details`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| CRUD | `/fees/types` | Fee type management |
| POST | `/fees/structures` | Create fee structure |
| GET | `/fees/structures` | List structures |
| GET | `/fees/structures/:id` | Get structure details |
| PATCH | `/fees/structures/:id` | Update structure |
| POST | `/fees/assign` | Assign fees to students |
| GET | `/fees/students/:studentId` | Get student fees |
| GET | `/fees/students/:studentId/dues` | Get dues |
| POST | `/fees/students/:studentId/payments` | Record payment |
| GET | `/fees/students/:studentId/payments` | List payments |
| GET | `/fees/students/:studentId/receipts/:id` | Get receipt |
| POST | `/fees/students/:studentId/concession` | Apply concession |
| GET | `/fees/reports/collection` | Collection report |
| GET | `/fees/reports/dues` | Dues report |
| GET | `/fees/reports/defaulters` | Defaulters list |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch, Academic, Student
- **Depended by:** Report (financial reports)

#### Transaction-Sensitive Operations
- `POST /fees/structures`: Create structure + components + installments
- `POST /fees/assign`: Bulk fee assignment (can be 100s of students)
- `POST /fees/students/:studentId/payments`: Create payment + update assignment balance + create payment details
- `POST /fees/students/:studentId/concession`: Apply concession + recalculate balance

#### Test Strategy
- Unit: Balance calculation, late fee computation
- Integration: Payment recording, receipt generation
- E2E: Full fee collection workflow

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `fee_types` | 8 | Tuition, Transport, Lab, etc. |
| `fee_structures` | 12 | One per class |
| `student_fee_assignments` | 200 | All students |
| `fee_payments` | 300 | Payment history |

---

### 4.14 Module: Exam

**Priority:** P1 | **Risk:** 🟡 Medium | **Effort:** 2 weeks

**Location:** `apps/api/src/modules/exam`

#### Responsibilities
- Exam creation & scheduling
- Result entry (bulk)
- Grade computation
- Grade scale management
- Report card generation

#### Key Entities
- `exams`
- `exam_classes`
- `exam_schedules`
- `exam_results`
- `grade_scales`
- `grade_scale_ranges`
- `report_cards`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/exams` | Create exam |
| GET | `/exams` | List exams |
| GET | `/exams/:id` | Get exam details |
| PATCH | `/exams/:id` | Update exam |
| DELETE | `/exams/:id` | Delete exam |
| POST | `/exams/:id/schedule` | Create schedule |
| GET | `/exams/:id/schedule` | Get schedule |
| POST | `/exams/:id/results` | Enter results (bulk) |
| GET | `/exams/:id/results` | Get results |
| PATCH | `/exams/:id/results/:resultId` | Update result |
| POST | `/exams/:id/publish` | Publish results |
| CRUD | `/exams/grade-scales` | Grade scale management |
| GET | `/exams/report-cards/students/:studentId` | Get report cards |
| POST | `/exams/report-cards/generate` | Generate report cards |
| GET | `/exams/report-cards/:id/download` | Download PDF |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch, Academic, Student, Staff
- **Depended by:** Report (academic reports)

#### Transaction-Sensitive Operations
- `POST /exams/:id/results`: Bulk insert results + compute grades
- `POST /exams/report-cards/generate`: Aggregate all results + generate PDF

#### Test Strategy
- Unit: Grade computation, rank calculation
- Integration: Result entry, report card generation
- E2E: Full exam workflow

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `grade_scales` | 2 | CBSE, ICSE |
| `exams` | 4 | Unit tests, mid-term, final |
| `exam_schedules` | 50+ | Subject schedules |
| `exam_results` | 1,000+ | Result data |

---

### 4.15 Module: Timetable

**Priority:** P1 | **Risk:** 🟢 Low | **Effort:** 1 week

**Location:** `apps/api/src/modules/timetable`

#### Responsibilities
- Period definition
- Timetable creation
- Teacher assignment
- Conflict validation

#### Key Entities
- `periods`
- `timetables`
- `timetable_entries`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| CRUD | `/timetables/periods` | Period management |
| POST | `/timetables` | Create timetable |
| GET | `/timetables` | List timetables |
| GET | `/timetables/:id` | Get timetable |
| PATCH | `/timetables/:id` | Update timetable |
| GET | `/timetables/classes/:classId` | Class timetable |
| GET | `/timetables/teachers/:teacherId` | Teacher timetable |
| POST | `/timetables/validate` | Validate for conflicts |
| CRUD | `/timetables/assignments` | Teacher assignments |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch, Academic, Staff
- **Depended by:** None directly

#### Transaction-Sensitive Operations
- `POST /timetables`: Create timetable + entries

#### Test Strategy
- Unit: Conflict detection
- Integration: Timetable creation
- E2E: Full timetable setup

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `periods` | 10 | Daily periods |
| `timetables` | 36 | One per section |
| `timetable_entries` | 200+ | Schedule entries |

---

### 4.16 Module: Communication

**Priority:** P1 | **Risk:** 🟢 Low | **Effort:** 1 week

**Location:** `apps/api/src/modules/communication`

#### Responsibilities
- Announcement management
- Circular management
- Notification dispatch (email/SMS)
- Notification templates

#### Key Entities
- `announcements`
- `announcement_targets`
- `circulars`
- `notification_templates`
- `notification_logs`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| CRUD | `/communications/announcements` | Announcement management |
| POST | `/communications/announcements/:id/publish` | Publish |
| CRUD | `/communications/circulars` | Circular management |
| POST | `/communications/notifications/dispatch` | Send notifications |
| GET | `/communications/notifications` | List notifications |
| GET | `/communications/notifications/logs` | Dispatch logs |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch, User
- **Depended by:** None directly

#### Transaction-Sensitive Operations
- `POST /communications/notifications/dispatch`: Queue notifications

#### Test Strategy
- Unit: Template rendering
- Integration: Notification dispatch
- E2E: Announcement workflow

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `notification_templates` | 10 | Standard templates |
| `announcements` | 5 | Sample announcements |

---

### 4.17 Module: Transport

**Priority:** P1 | **Risk:** 🟢 Low | **Effort:** 1 week

**Location:** `apps/api/src/modules/transport`

#### Responsibilities
- Vehicle management
- Route management
- Stop management
- Student transport assignment

#### Key Entities
- `vehicles`
- `transport_routes`
- `route_stops`
- `student_transport_assignments`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| CRUD | `/transport/vehicles` | Vehicle management |
| CRUD | `/transport/routes` | Route management |
| CRUD | `/transport/routes/:id/stops` | Stop management |
| GET | `/transport/routes/:id/students` | Students on route |
| POST | `/transport/students/:studentId/assign` | Assign to route |
| GET | `/transport/students/:studentId` | Get assignment |
| DELETE | `/transport/students/:studentId/assign` | Remove assignment |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch, Student, Staff
- **Depended by:** None directly

#### Transaction-Sensitive Operations
- `POST /transport/routes`: Create route + stops

#### Test Strategy
- Unit: Stop sequencing
- Integration: Route creation
- E2E: Transport assignment

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `vehicles` | 5 | Fleet |
| `transport_routes` | 4 | Routes |
| `route_stops` | 20 | Stop points |
| `student_transport_assignments` | 50 | Assignments |

---

### 4.18 Module: Library

**Priority:** P1 | **Risk:** 🟢 Low | **Effort:** 1 week

**Location:** `apps/api/src/modules/library`

#### Responsibilities
- Book catalog management
- Category management
- Book issue/return
- Fine management

#### Key Entities
- `book_categories`
- `books`
- `book_issues`
- `library_fines`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| CRUD | `/library/categories` | Category management |
| CRUD | `/library/books` | Book management |
| POST | `/library/books/:id/issue` | Issue book |
| POST | `/library/books/:id/return` | Return book |
| GET | `/library/books/:id/history` | Issue history |
| GET | `/library/members/:memberId/history` | Borrowing history |
| GET | `/library/members/:memberId/current` | Current issues |
| GET | `/library/members/:memberId/fines` | Pending fines |
| POST | `/library/members/:memberId/fines/:fineId/pay` | Pay fine |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, Tenant, Branch, Student, Staff
- **Depended by:** None directly

#### Transaction-Sensitive Operations
- `POST /library/books/:id/issue`: Create issue + decrement available copies
- `POST /library/books/:id/return`: Update issue + increment available copies + compute fine

#### Test Strategy
- Unit: Fine calculation, overdue detection
- Integration: Issue/return workflow
- E2E: Library operations

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `book_categories` | 10 | Categories |
| `books` | 100 | Book catalog |
| `book_issues` | 50 | Issue history |

---

### 4.19 Module: Audit

**Priority:** P0 | **Risk:** 🟡 Medium | **Effort:** 1 week

**Location:** `apps/api/src/modules/audit`

#### Responsibilities
- Audit log querying
- Entity history tracking
- Activity reports
- Login reports

#### Key Entities
- `audit_logs`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/audit/logs` | List audit logs |
| GET | `/audit/logs/:id` | Get log details |
| GET | `/audit/logs/user/:userId` | User activity |
| GET | `/audit/logs/entity/:type/:id` | Entity history |
| GET | `/audit/reports/activity` | Activity report |
| GET | `/audit/reports/changes` | Data changes report |
| GET | `/audit/reports/login` | Login report |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth
- **Depended by:** None (cross-cutting concern)

**Note:** Audit logging is implemented as middleware/Prisma extension, not per-module.

#### Transaction-Sensitive Operations
- None (append-only)

#### Test Strategy
- Unit: Log filtering, aggregation
- Integration: Audit log queries
- E2E: Full audit trail verification

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `audit_logs` | 1,000+ | Sample audit data |

---

### 4.20 Module: Report

**Priority:** P1 | **Risk:** 🟡 Medium | **Effort:** 1.5 weeks

**Location:** `apps/api/src/modules/report`

#### Responsibilities
- Report template management
- Report generation (sync/async)
- Report scheduling
- Export formats (PDF, CSV, Excel)

#### Key Entities
- `report_templates`
- `generated_reports`
- `scheduled_reports`

#### Critical APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/reports/templates` | List templates |
| GET | `/reports/templates/:id` | Get template details |
| POST | `/reports/generate` | Generate report |
| GET | `/reports` | List generated reports |
| GET | `/reports/:id` | Get report details |
| GET | `/reports/:id/download` | Download report |
| POST | `/reports/schedule` | Schedule report |
| GET | `/reports/schedules` | List scheduled |
| DELETE | `/reports/schedules/:id` | Cancel scheduled |

#### Cross-Module Dependencies
- **Depends on:** Database, Shared, Auth, ALL data modules
- **Depended by:** None

#### Transaction-Sensitive Operations
- `POST /reports/generate`: Create report record + queue job (async)

#### Test Strategy
- Unit: Template parameter validation
- Integration: Report generation
- E2E: Scheduled report workflow

#### Seed Data Requirements
| Entity | Records | Purpose |
|--------|---------|---------|
| `report_templates` | 15 | System templates |

---

## 5. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
**Goal:** Core infrastructure enabling all other work

| Week | Module | Deliverable |
|------|--------|-------------|
| 1-2 | Database | Schema, migrations, seed |
| 1 | Shared | Errors, types, utils |
| 2-3 | Auth | Login, JWT, sessions |
| 3 | Tenant | Tenant CRUD, settings |
| 4 | Branch | Branch CRUD, hierarchy |
| 4 | Audit | Audit middleware, log queries |

**Milestone:** Can create tenants, branches, authenticate users

### Phase 2: Access Control (Weeks 5-6)
**Goal:** Complete user and permission system

| Week | Module | Deliverable |
|------|--------|-------------|
| 5 | User | User CRUD, branch/role assignment |
| 5-6 | Role | Role CRUD, permissions |
| 6 | Academic | Years, classes, sections, subjects |

**Milestone:** Complete RBAC system operational

### Phase 3: Core Operations (Weeks 7-10)
**Goal:** Student and staff lifecycle, daily operations

| Week | Module | Deliverable |
|------|--------|-------------|
| 7-8 | Staff | Staff CRUD, teacher assignments |
| 8-9 | Student | Student registration, enrollment |
| 9 | Guardian | Guardian management |
| 9-10 | Attendance | Attendance marking, reports |

**Milestone:** Can manage students, staff, mark attendance

### Phase 4: Financial & Academic (Weeks 11-14)
**Goal:** Fee collection, examinations

| Week | Module | Deliverable |
|------|--------|-------------|
| 11-12 | Fee | Fee structures, payments, receipts |
| 12-13 | Exam | Exams, results, report cards |
| 13-14 | Timetable | Periods, timetables |

**Milestone:** Complete fee and exam workflows

### Phase 5: Supporting Modules (Weeks 15-16)
**Goal:** Additional features

| Week | Module | Deliverable |
|------|--------|-------------|
| 15 | Communication | Announcements, notifications |
| 15 | Transport | Routes, assignments |
| 15-16 | Library | Books, issue/return |
| 16 | Report | Report generation, scheduling |

**Milestone:** Full system operational

---

## 6. Risk Mitigation

### High-Risk Modules

| Module | Risk | Mitigation |
|--------|------|------------|
| **Auth** | Security vulnerabilities | Security review, penetration testing |
| **Fee** | Financial data integrity | Double-entry validation, audit trail |
| **Role** | Permission bypass | Comprehensive permission tests |
| **Database** | Schema mismatch | Schema validation, migration testing |

### Technical Debt Prevention

1. **Code Review Gate:** All PRs require 2 approvals
2. **Test Coverage:** Minimum 80% for services
3. **Documentation:** OpenAPI spec for each module
4. **Refactoring Windows:** 1 day per week for tech debt

---

## 7. Testing Requirements Summary

| Module | Unit | Integration | E2E |
|--------|------|-------------|-----|
| Database | Schema validation | Migrations | - |
| Shared | All utils | - | - |
| Auth | JWT, password | Login flow | Full auth |
| Tenant | Service logic | Tenant creation | Provisioning |
| Branch | Hierarchy | CRUD | - |
| User | Permission compute | User + roles | Management |
| Role | Inheritance | CRUD | Custom roles |
| Academic | Validation | Hierarchy | Structure setup |
| Staff | Assignments | Creation | Onboarding |
| Student | Admission logic | Registration | Full admission |
| Guardian | Relationships | Creation | Linking |
| Attendance | Calculations | Bulk marking | Daily workflow |
| Fee | Balance calc | Payment | Collection |
| Exam | Grade compute | Result entry | Full exam |
| Timetable | Conflict detect | Creation | Setup |
| Communication | Templates | Dispatch | - |
| Transport | Sequencing | Routes | - |
| Library | Fine calc | Issue/return | - |
| Audit | Filtering | Queries | Verification |
| Report | Parameters | Generation | Scheduling |

---

## 8. Document Sign-Off

| Role | Status |
|------|--------|
| Principal Backend Engineer | ✅ Approved |
| Tech Lead | ⏳ Pending |
| Product Manager | ⏳ Pending |
| QA Lead | ⏳ Pending |

---

**This document is the authoritative implementation plan. All module work must follow this sequence and specification.**
