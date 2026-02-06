# Database Schema Design

**Document ID:** SCHOOL-ERP-DB-v1.0  
**Status:** APPROVED FOR IMPLEMENTATION  
**Last Updated:** 2026-01-14  
**Owner:** Principal Data Architect  
**Parent Documents:** SCHOOL-ERP-SCOPE-v1.0, SCHOOL-ERP-HLD-v1.0, SCHOOL-ERP-API-v1.0  

---

## 1. Design Principles

### 1.1 Core Constraints

| Constraint | Implementation |
|------------|----------------|
| **Primary Keys** | UUID v7 (time-sortable) for all tables |
| **Soft Deletes** | `deleted_at` timestamp column; never hard delete |
| **Multi-Tenant** | `tenant_id` column on all tenant-scoped tables |
| **Audit Trail** | `created_at`, `updated_at`, `created_by`, `updated_by` on all tables |
| **Referential Integrity** | Foreign keys with appropriate ON DELETE behavior |
| **Naming Convention** | snake_case for tables and columns |

### 1.2 Tenant Isolation Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      TENANT ISOLATION                            │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Tenant A   │    │   Tenant B   │    │   Tenant C   │      │
│  │ tenant_id=1  │    │ tenant_id=2  │    │ tenant_id=3  │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│                             ▼                                   │
│              ┌──────────────────────────────┐                   │
│              │    Row-Level Security (RLS)   │                   │
│              │    WHERE tenant_id = $1       │                   │
│              └──────────────────────────────┘                   │
│                             │                                   │
│                             ▼                                   │
│              ┌──────────────────────────────┐                   │
│              │      PostgreSQL Database      │                   │
│              └──────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Table Classification

| Scope | Description | Example Tables |
|-------|-------------|----------------|
| **System** | Platform-level, no tenant_id | `tenants`, `system_settings`, `permissions` |
| **Tenant** | Tenant-level, has tenant_id | `branches`, `users`, `roles` |
| **Branch** | Branch-level, has branch_id | `students`, `staff`, `classes` |
| **Historical** | Append-only, time-series | `attendance_records`, `fee_payments`, `audit_logs` |

---

## 2. Domain: Tenant & Branch

### 2.1 tenants

**Purpose:** Root table for all organizations using the platform. Every data record ultimately traces back to a tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique tenant identifier |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | Short code for URL/login (e.g., "springfield") |
| `name` | VARCHAR(255) | NOT NULL | Organization display name |
| `email` | VARCHAR(255) | NOT NULL | Primary contact email |
| `phone` | VARCHAR(20) | | Primary contact phone |
| `address_street` | VARCHAR(255) | | |
| `address_city` | VARCHAR(100) | | |
| `address_state` | VARCHAR(100) | | |
| `address_country` | VARCHAR(100) | | |
| `address_postal_code` | VARCHAR(20) | | |
| `logo_url` | VARCHAR(500) | | Organization logo |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, inactive, suspended |
| `subscription_tier` | ENUM | DEFAULT 'free' | free, standard, premium, enterprise |
| `subscription_expires_at` | TIMESTAMP | | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| `deleted_at` | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_tenants_code` UNIQUE on `code`
- `idx_tenants_status` on `status`

**Why this table exists:** Tenants are the root isolation boundary. All downstream data is scoped to a tenant.

---

### 2.2 tenant_settings

**Purpose:** Key-value store for tenant-specific configuration. Avoids schema changes for new settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `key` | VARCHAR(100) | NOT NULL | Setting key (e.g., "academic_year_format") |
| `value` | JSONB | NOT NULL | Setting value (flexible schema) |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(tenant_id, key)`

**Why this table exists:** Enables per-tenant customization (date formats, currency, feature flags) without schema migrations.

---

### 2.3 branches

**Purpose:** Physical or logical school campuses within a tenant. Students and staff belong to branches.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `parent_branch_id` | UUID | FK → branches | Self-reference for hierarchy |
| `code` | VARCHAR(50) | NOT NULL | Unique within tenant |
| `name` | VARCHAR(255) | NOT NULL | |
| `type` | ENUM | NOT NULL, DEFAULT 'branch' | main, branch, satellite |
| `email` | VARCHAR(255) | | |
| `phone` | VARCHAR(20) | | |
| `address_street` | VARCHAR(255) | | |
| `address_city` | VARCHAR(100) | | |
| `address_state` | VARCHAR(100) | | |
| `address_country` | VARCHAR(100) | | |
| `address_postal_code` | VARCHAR(20) | | |
| `principal_name` | VARCHAR(255) | | |
| `established_year` | INTEGER | | |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, inactive |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(tenant_id, code)`

**Indexes:**
- `idx_branches_tenant_id` on `tenant_id`
- `idx_branches_parent` on `parent_branch_id`
- `idx_branches_status` on `status`

**Why this table exists:** Multi-branch support is a core requirement. Branches scope students, staff, classes, and operations.

---

### 2.4 branch_settings

**Purpose:** Branch-specific configuration overrides.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `key` | VARCHAR(100) | NOT NULL | |
| `value` | JSONB | NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(branch_id, key)`

**Why this table exists:** Different branches may have different working hours, fee structures, or policies.

---

## 3. Domain: Users & Auth

### 3.1 users

**Purpose:** Authentication and identity for all human actors (admins, teachers, parents, students).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `email` | VARCHAR(255) | NOT NULL | Login identifier |
| `password_hash` | VARCHAR(255) | | bcrypt/argon2 hash |
| `first_name` | VARCHAR(100) | NOT NULL | |
| `last_name` | VARCHAR(100) | NOT NULL | |
| `phone` | VARCHAR(20) | | |
| `avatar_url` | VARCHAR(500) | | |
| `user_type` | ENUM | NOT NULL | admin, staff, teacher, parent, student |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, inactive, pending, suspended |
| `email_verified_at` | TIMESTAMP | | |
| `last_login_at` | TIMESTAMP | | |
| `password_changed_at` | TIMESTAMP | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(tenant_id, email)`

**Indexes:**
- `idx_users_tenant_email` UNIQUE on `(tenant_id, email)`
- `idx_users_tenant_id` on `tenant_id`
- `idx_users_status` on `status`
- `idx_users_user_type` on `user_type`

**Why this table exists:** Central authentication table. Decoupled from staff/student profiles to support multiple user types.

---

### 3.2 user_branches

**Purpose:** Many-to-many relationship between users and branches they can access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `is_primary` | BOOLEAN | DEFAULT false | User's default branch |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(user_id, branch_id)`

**Why this table exists:** Users (especially staff) may work across multiple branches.

---

### 3.3 auth_sessions

**Purpose:** Track active login sessions for security and session management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `refresh_token_hash` | VARCHAR(255) | NOT NULL | Hashed refresh token |
| `ip_address` | VARCHAR(45) | | IPv4/IPv6 |
| `user_agent` | VARCHAR(500) | | Browser/device info |
| `expires_at` | TIMESTAMP | NOT NULL | |
| `last_used_at` | TIMESTAMP | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `revoked_at` | TIMESTAMP | | Explicit logout |

**Indexes:**
- `idx_auth_sessions_user_id` on `user_id`
- `idx_auth_sessions_refresh_token` on `refresh_token_hash`
- `idx_auth_sessions_expires` on `expires_at`

**Why this table exists:** Enables session management, device tracking, and forced logout capabilities.

---

### 3.4 password_reset_tokens

**Purpose:** Temporary tokens for password recovery flow.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `token_hash` | VARCHAR(255) | NOT NULL | Hashed token |
| `expires_at` | TIMESTAMP | NOT NULL | |
| `used_at` | TIMESTAMP | | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Indexes:**
- `idx_password_reset_token` on `token_hash`

**Why this table exists:** Secure, time-limited password reset without storing plaintext tokens.

---

### 3.5 api_keys

**Purpose:** API keys for third-party integrations and service accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `user_id` | UUID | FK → users, NOT NULL | Creator |
| `name` | VARCHAR(100) | NOT NULL | Human-readable name |
| `key_prefix` | VARCHAR(20) | NOT NULL | First 8 chars for identification |
| `key_hash` | VARCHAR(255) | NOT NULL | Hashed key |
| `permissions` | JSONB | | Scoped permissions |
| `last_used_at` | TIMESTAMP | | |
| `expires_at` | TIMESTAMP | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `revoked_at` | TIMESTAMP | | |

**Indexes:**
- `idx_api_keys_key_hash` on `key_hash`
- `idx_api_keys_tenant` on `tenant_id`

**Why this table exists:** Enables programmatic access for integrations while maintaining security.

---

## 4. Domain: Roles & Permissions

### 4.1 permissions

**Purpose:** System-defined permissions. Static seed data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | VARCHAR(100) | UNIQUE, NOT NULL | e.g., "student:read:branch" |
| `name` | VARCHAR(255) | NOT NULL | Human-readable |
| `description` | TEXT | | |
| `resource` | VARCHAR(50) | NOT NULL | e.g., "student" |
| `action` | VARCHAR(50) | NOT NULL | e.g., "read" |
| `scope` | VARCHAR(50) | | own, branch, tenant, all |
| `created_at` | TIMESTAMP | NOT NULL | |

**Why this table exists:** Defines all possible permissions. Seeded at deployment, not user-editable.

---

### 4.2 roles

**Purpose:** Both system roles and custom tenant roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants | NULL for system roles |
| `code` | VARCHAR(50) | NOT NULL | e.g., "TEACHER" |
| `name` | VARCHAR(100) | NOT NULL | |
| `description` | TEXT | | |
| `is_system` | BOOLEAN | NOT NULL, DEFAULT false | System roles cannot be modified |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(tenant_id, code)` with NULL handling

**Indexes:**
- `idx_roles_tenant_id` on `tenant_id`
- `idx_roles_is_system` on `is_system`

**Why this table exists:** Supports both platform-wide system roles and tenant-specific custom roles.

---

### 4.3 role_permissions

**Purpose:** Many-to-many between roles and permissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `role_id` | UUID | FK → roles, NOT NULL | |
| `permission_id` | UUID | FK → permissions, NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(role_id, permission_id)`

**Why this table exists:** Flexible permission assignment to roles.

---

### 4.4 user_roles

**Purpose:** Assign roles to users, optionally scoped to a branch.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `role_id` | UUID | FK → roles, NOT NULL | |
| `branch_id` | UUID | FK → branches | Scope to specific branch |
| `created_at` | TIMESTAMP | NOT NULL | |
| `created_by` | UUID | FK → users | |

**Unique Constraint:** `(user_id, role_id, branch_id)` with NULL handling

**Indexes:**
- `idx_user_roles_user` on `user_id`
- `idx_user_roles_role` on `role_id`

**Why this table exists:** A user can have different roles in different branches (e.g., Teacher in Branch A, Admin in Branch B).

---

## 5. Domain: Students & Guardians

### 5.1 students

**Purpose:** Core student profile and demographic data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | Current branch |
| `user_id` | UUID | FK → users | Linked user account |
| `admission_number` | VARCHAR(50) | NOT NULL | |
| `first_name` | VARCHAR(100) | NOT NULL | |
| `last_name` | VARCHAR(100) | NOT NULL | |
| `date_of_birth` | DATE | NOT NULL | |
| `gender` | ENUM | NOT NULL | male, female, other |
| `blood_group` | VARCHAR(5) | | |
| `nationality` | VARCHAR(100) | | |
| `religion` | VARCHAR(100) | | |
| `category` | VARCHAR(100) | | Reservation category |
| `address_street` | VARCHAR(255) | | |
| `address_city` | VARCHAR(100) | | |
| `address_state` | VARCHAR(100) | | |
| `address_country` | VARCHAR(100) | | |
| `address_postal_code` | VARCHAR(20) | | |
| `photo_url` | VARCHAR(500) | | |
| `admission_date` | DATE | NOT NULL | |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, inactive, transferred, graduated, withdrawn |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |
| `created_by` | UUID | FK → users | |
| `updated_by` | UUID | FK → users | |

**Unique Constraint:** `(tenant_id, admission_number)`

**Indexes:**
- `idx_students_tenant` on `tenant_id`
- `idx_students_branch` on `branch_id`
- `idx_students_admission` UNIQUE on `(tenant_id, admission_number)`
- `idx_students_status` on `status`
- `idx_students_name` on `(first_name, last_name)`

**Why this table exists:** Central student record, decoupled from enrollment which changes yearly.

---

### 5.2 student_enrollments

**Purpose:** Track student's class/section assignment per academic year. Historical record.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `student_id` | UUID | FK → students, NOT NULL | |
| `academic_year_id` | UUID | FK → academic_years, NOT NULL | |
| `class_id` | UUID | FK → classes, NOT NULL | |
| `section_id` | UUID | FK → sections, NOT NULL | |
| `roll_number` | VARCHAR(20) | | |
| `enrollment_date` | DATE | NOT NULL | |
| `is_current` | BOOLEAN | NOT NULL, DEFAULT true | |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, promoted, transferred, withdrawn |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(student_id, academic_year_id)`

**Indexes:**
- `idx_enrollments_student` on `student_id`
- `idx_enrollments_class` on `class_id`
- `idx_enrollments_section` on `section_id`
- `idx_enrollments_current` on `is_current` WHERE `is_current = true`

**Why this table exists:** Students change classes yearly. This provides historical tracking and supports promotions.

---

### 5.3 guardians

**Purpose:** Parent/guardian information linked to students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `user_id` | UUID | FK → users | Linked user account |
| `first_name` | VARCHAR(100) | NOT NULL | |
| `last_name` | VARCHAR(100) | NOT NULL | |
| `email` | VARCHAR(255) | | |
| `phone` | VARCHAR(20) | NOT NULL | |
| `occupation` | VARCHAR(100) | | |
| `address_street` | VARCHAR(255) | | |
| `address_city` | VARCHAR(100) | | |
| `address_state` | VARCHAR(100) | | |
| `address_country` | VARCHAR(100) | | |
| `address_postal_code` | VARCHAR(20) | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Indexes:**
- `idx_guardians_tenant` on `tenant_id`
- `idx_guardians_email` on `email`

**Why this table exists:** Guardians are separate entities that can be linked to multiple students (siblings).

---

### 5.4 student_guardians

**Purpose:** Many-to-many between students and guardians with relationship type.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `student_id` | UUID | FK → students, NOT NULL | |
| `guardian_id` | UUID | FK → guardians, NOT NULL | |
| `relationship` | ENUM | NOT NULL | father, mother, guardian, grandparent, other |
| `is_primary` | BOOLEAN | DEFAULT false | Primary contact |
| `is_emergency_contact` | BOOLEAN | DEFAULT false | |
| `can_pickup` | BOOLEAN | DEFAULT true | Authorized for pickup |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(student_id, guardian_id)`

**Why this table exists:** A student can have multiple guardians, and a guardian can have multiple children (siblings).

---

### 5.5 student_documents

**Purpose:** Store references to uploaded student documents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `student_id` | UUID | FK → students, NOT NULL | |
| `document_type` | ENUM | NOT NULL | birth_certificate, transfer_certificate, id_proof, photo, medical_record, other |
| `name` | VARCHAR(255) | NOT NULL | |
| `file_url` | VARCHAR(500) | NOT NULL | |
| `file_size` | INTEGER | | Bytes |
| `mime_type` | VARCHAR(100) | | |
| `uploaded_by` | UUID | FK → users | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Indexes:**
- `idx_student_documents_student` on `student_id`

**Why this table exists:** Track required documents for admission and compliance.

---

### 5.6 student_medical_info

**Purpose:** Medical information for emergency situations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `student_id` | UUID | FK → students, UNIQUE, NOT NULL | One-to-one |
| `allergies` | JSONB | | Array of allergies |
| `medical_conditions` | JSONB | | Array of conditions |
| `blood_group` | VARCHAR(5) | | |
| `emergency_contact_name` | VARCHAR(255) | | |
| `emergency_contact_phone` | VARCHAR(20) | | |
| `emergency_contact_relationship` | VARCHAR(50) | | |
| `doctor_name` | VARCHAR(255) | | |
| `doctor_phone` | VARCHAR(20) | | |
| `insurance_info` | JSONB | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Why this table exists:** Sensitive medical data separated for privacy; not always needed in queries.

---

### 5.7 student_transfers

**Purpose:** Track student transfers between branches.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `student_id` | UUID | FK → students, NOT NULL | |
| `from_branch_id` | UUID | FK → branches, NOT NULL | |
| `to_branch_id` | UUID | FK → branches, NOT NULL | |
| `from_class_id` | UUID | FK → classes | |
| `to_class_id` | UUID | FK → classes | |
| `transfer_date` | DATE | NOT NULL | |
| `reason` | TEXT | | |
| `status` | ENUM | NOT NULL, DEFAULT 'pending' | pending, approved, completed, cancelled |
| `approved_by` | UUID | FK → users | |
| `approved_at` | TIMESTAMP | | |
| `transfer_certificate_url` | VARCHAR(500) | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `created_by` | UUID | FK → users | |

**Indexes:**
- `idx_transfers_student` on `student_id`
- `idx_transfers_status` on `status`

**Why this table exists:** Track inter-branch transfers with approval workflow.

---

## 6. Domain: Academic Structure

### 6.1 academic_years

**Purpose:** Define academic years for the organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `name` | VARCHAR(50) | NOT NULL | e.g., "2026-27" |
| `start_date` | DATE | NOT NULL | |
| `end_date` | DATE | NOT NULL | |
| `is_current` | BOOLEAN | NOT NULL, DEFAULT false | |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | draft, active, completed |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(tenant_id, name)`

**Indexes:**
- `idx_academic_years_tenant` on `tenant_id`
- `idx_academic_years_current` on `is_current` WHERE `is_current = true`

**Why this table exists:** Academic year scopes enrollments, fees, exams, timetables.

---

### 6.2 classes

**Purpose:** Grade/class definitions per branch and academic year.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `academic_year_id` | UUID | FK → academic_years, NOT NULL | |
| `name` | VARCHAR(100) | NOT NULL | e.g., "Grade 10" |
| `code` | VARCHAR(20) | NOT NULL | e.g., "10" |
| `display_order` | INTEGER | NOT NULL | For sorting |
| `description` | TEXT | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(branch_id, academic_year_id, code)`

**Indexes:**
- `idx_classes_branch` on `branch_id`
- `idx_classes_academic_year` on `academic_year_id`
- `idx_classes_order` on `display_order`

**Why this table exists:** Classes are branch and year specific. Grade 10 in Branch A may differ from Branch B.

---

### 6.3 sections

**Purpose:** Subdivisions of classes (e.g., Section A, B, C).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `class_id` | UUID | FK → classes, NOT NULL | |
| `name` | VARCHAR(50) | NOT NULL | e.g., "Section A" |
| `code` | VARCHAR(10) | NOT NULL | e.g., "A" |
| `capacity` | INTEGER | | Max students |
| `class_teacher_id` | UUID | FK → staff | Assigned class teacher |
| `room` | VARCHAR(50) | | Physical room |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(class_id, code)`

**Indexes:**
- `idx_sections_class` on `class_id`
- `idx_sections_teacher` on `class_teacher_id`

**Why this table exists:** Sections enable smaller groups within a class for attendance, exams, etc.

---

### 6.4 subjects

**Purpose:** Subject master list for the tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `code` | VARCHAR(20) | NOT NULL | e.g., "MATH" |
| `name` | VARCHAR(100) | NOT NULL | e.g., "Mathematics" |
| `type` | ENUM | NOT NULL | core, elective, language, activity |
| `credit_hours` | INTEGER | | |
| `description` | TEXT | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(tenant_id, code)`

**Indexes:**
- `idx_subjects_tenant` on `tenant_id`
- `idx_subjects_type` on `type`

**Why this table exists:** Centralized subject catalog, reused across classes.

---

### 6.5 class_subjects

**Purpose:** Assign subjects to classes with optional weightage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `class_id` | UUID | FK → classes, NOT NULL | |
| `subject_id` | UUID | FK → subjects, NOT NULL | |
| `is_mandatory` | BOOLEAN | DEFAULT true | |
| `periods_per_week` | INTEGER | | Timetable hint |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(class_id, subject_id)`

**Why this table exists:** Different classes may have different subjects or different configurations.

---

## 7. Domain: Staff

### 7.1 designations

**Purpose:** Job titles/designations within the organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `name` | VARCHAR(100) | NOT NULL | e.g., "Senior Teacher" |
| `code` | VARCHAR(20) | NOT NULL | |
| `category` | ENUM | | teaching, non_teaching, admin |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(tenant_id, code)`

**Why this table exists:** Standardized designations for reporting and hierarchy.

---

### 7.2 departments

**Purpose:** Academic or administrative departments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `name` | VARCHAR(100) | NOT NULL | e.g., "Science Department" |
| `code` | VARCHAR(20) | NOT NULL | |
| `head_staff_id` | UUID | FK → staff | Department head |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(tenant_id, code)`

**Why this table exists:** Group staff by department for organizational structure.

---

### 7.3 staff

**Purpose:** Employee records for teaching and non-teaching staff.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `user_id` | UUID | FK → users | Linked user account |
| `employee_id` | VARCHAR(50) | NOT NULL | |
| `first_name` | VARCHAR(100) | NOT NULL | |
| `last_name` | VARCHAR(100) | NOT NULL | |
| `email` | VARCHAR(255) | | |
| `phone` | VARCHAR(20) | | |
| `date_of_birth` | DATE | | |
| `gender` | ENUM | | male, female, other |
| `date_of_joining` | DATE | NOT NULL | |
| `date_of_leaving` | DATE | | |
| `designation_id` | UUID | FK → designations, NOT NULL | |
| `department_id` | UUID | FK → departments | |
| `staff_type` | ENUM | NOT NULL | teaching, non_teaching, admin |
| `qualification` | VARCHAR(255) | | |
| `experience_years` | INTEGER | | |
| `address_street` | VARCHAR(255) | | |
| `address_city` | VARCHAR(100) | | |
| `address_state` | VARCHAR(100) | | |
| `address_country` | VARCHAR(100) | | |
| `address_postal_code` | VARCHAR(20) | | |
| `photo_url` | VARCHAR(500) | | |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, inactive, on_leave, resigned |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |
| `created_by` | UUID | FK → users | |
| `updated_by` | UUID | FK → users | |

**Unique Constraint:** `(tenant_id, employee_id)`

**Indexes:**
- `idx_staff_tenant` on `tenant_id`
- `idx_staff_employee_id` UNIQUE on `(tenant_id, employee_id)`
- `idx_staff_designation` on `designation_id`
- `idx_staff_department` on `department_id`
- `idx_staff_type` on `staff_type`
- `idx_staff_status` on `status`

**Why this table exists:** Central staff record, linked to user for authentication but separate for HR data.

---

### 7.4 staff_branches

**Purpose:** Assign staff to branches they work in.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `staff_id` | UUID | FK → staff, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `is_primary` | BOOLEAN | DEFAULT false | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(staff_id, branch_id)`

**Why this table exists:** Staff may work across multiple branches.

---

### 7.5 teacher_subjects

**Purpose:** Subjects a teacher is qualified/assigned to teach.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `staff_id` | UUID | FK → staff, NOT NULL | |
| `subject_id` | UUID | FK → subjects, NOT NULL | |
| `is_primary` | BOOLEAN | DEFAULT false | Main subject |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(staff_id, subject_id)`

**Why this table exists:** Track teacher competencies for timetable assignment.

---

### 7.6 teacher_class_assignments

**Purpose:** Assign teachers to specific class-subject combinations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `staff_id` | UUID | FK → staff, NOT NULL | |
| `class_id` | UUID | FK → classes, NOT NULL | |
| `section_id` | UUID | FK → sections | NULL means all sections |
| `subject_id` | UUID | FK → subjects, NOT NULL | |
| `academic_year_id` | UUID | FK → academic_years, NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(staff_id, class_id, section_id, subject_id, academic_year_id)`

**Why this table exists:** Links teachers to their teaching assignments for attendance, exam result entry.

---

## 8. Domain: Attendance

### 8.1 attendance_records

**Purpose:** Daily attendance records for students. High-volume historical table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `student_id` | UUID | FK → students, NOT NULL | |
| `class_id` | UUID | FK → classes, NOT NULL | |
| `section_id` | UUID | FK → sections, NOT NULL | |
| `academic_year_id` | UUID | FK → academic_years, NOT NULL | |
| `date` | DATE | NOT NULL | |
| `session` | ENUM | DEFAULT 'full_day' | morning, afternoon, full_day |
| `status` | ENUM | NOT NULL | present, absent, late, half_day, excused |
| `remarks` | VARCHAR(255) | | |
| `marked_by` | UUID | FK → users, NOT NULL | |
| `marked_at` | TIMESTAMP | NOT NULL | |
| `updated_by` | UUID | FK → users | |
| `updated_at` | TIMESTAMP | | |

**Unique Constraint:** `(student_id, date, session)`

**Indexes:**
- `idx_attendance_student_date` on `(student_id, date)`
- `idx_attendance_class_date` on `(class_id, section_id, date)`
- `idx_attendance_branch_date` on `(branch_id, date)`
- `idx_attendance_status` on `status`
- `idx_attendance_tenant_date` on `(tenant_id, date)` — for RLS

**Partitioning Strategy:** Partition by `date` (monthly or quarterly) for performance on large datasets.

**Why this table exists:** Core operational data. Queried frequently for daily marking and reporting.

---

### 8.2 staff_attendance_records

**Purpose:** Daily attendance for staff members.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `staff_id` | UUID | FK → staff, NOT NULL | |
| `date` | DATE | NOT NULL | |
| `check_in` | TIME | | |
| `check_out` | TIME | | |
| `status` | ENUM | NOT NULL | present, absent, late, half_day, on_leave |
| `leave_type` | VARCHAR(50) | | If on leave |
| `remarks` | VARCHAR(255) | | |
| `marked_by` | UUID | FK → users | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | | |

**Unique Constraint:** `(staff_id, date)`

**Indexes:**
- `idx_staff_attendance_staff_date` on `(staff_id, date)`
- `idx_staff_attendance_branch_date` on `(branch_id, date)`

**Why this table exists:** Track staff attendance separately from students for HR/payroll.

---

## 9. Domain: Fees & Payments

### 9.1 fee_types

**Purpose:** Categories of fees (Tuition, Transport, Lab, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `code` | VARCHAR(20) | NOT NULL | e.g., "TUITION" |
| `name` | VARCHAR(100) | NOT NULL | |
| `description` | TEXT | | |
| `is_refundable` | BOOLEAN | DEFAULT false | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(tenant_id, code)`

**Why this table exists:** Master list of fee categories for flexible fee structure creation.

---

### 9.2 fee_structures

**Purpose:** Define fee structures applicable to classes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `academic_year_id` | UUID | FK → academic_years, NOT NULL | |
| `name` | VARCHAR(100) | NOT NULL | e.g., "Grade 10 Fee 2026-27" |
| `description` | TEXT | | |
| `total_amount` | DECIMAL(12,2) | NOT NULL | Computed sum |
| `late_fee_type` | ENUM | | fixed, percentage |
| `late_fee_value` | DECIMAL(10,2) | | |
| `late_fee_grace_days` | INTEGER | | |
| `status` | ENUM | DEFAULT 'draft' | draft, active, archived |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |
| `created_by` | UUID | FK → users | |

**Indexes:**
- `idx_fee_structures_branch` on `branch_id`
- `idx_fee_structures_year` on `academic_year_id`

**Why this table exists:** Fee structures group fee components and apply to multiple classes.

---

### 9.3 fee_structure_components

**Purpose:** Individual fee items within a structure.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `fee_structure_id` | UUID | FK → fee_structures, NOT NULL | |
| `fee_type_id` | UUID | FK → fee_types, NOT NULL | |
| `amount` | DECIMAL(12,2) | NOT NULL | |
| `frequency` | ENUM | NOT NULL | one_time, monthly, quarterly, half_yearly, yearly |
| `due_day` | INTEGER | | Day of month for recurring |
| `is_mandatory` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Why this table exists:** Break down fee structure into line items for granular tracking.

---

### 9.4 fee_structure_classes

**Purpose:** Link fee structures to applicable classes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `fee_structure_id` | UUID | FK → fee_structures, NOT NULL | |
| `class_id` | UUID | FK → classes, NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(fee_structure_id, class_id)`

**Why this table exists:** A structure can apply to multiple classes; a class can have only one structure per year.

---

### 9.5 fee_structure_installments

**Purpose:** Define payment installments for a fee structure.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `fee_structure_id` | UUID | FK → fee_structures, NOT NULL | |
| `name` | VARCHAR(100) | NOT NULL | e.g., "Installment 1" |
| `amount` | DECIMAL(12,2) | NOT NULL | |
| `due_date` | DATE | NOT NULL | |
| `display_order` | INTEGER | NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Why this table exists:** Allow flexible payment schedules (quarterly, term-wise).

---

### 9.6 student_fee_assignments

**Purpose:** Assign fees to individual students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `student_id` | UUID | FK → students, NOT NULL | |
| `fee_structure_id` | UUID | FK → fee_structures, NOT NULL | |
| `academic_year_id` | UUID | FK → academic_years, NOT NULL | |
| `total_amount` | DECIMAL(12,2) | NOT NULL | May differ from structure (concessions) |
| `amount_paid` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Running total |
| `balance` | DECIMAL(12,2) | NOT NULL | Computed |
| `status` | ENUM | NOT NULL, DEFAULT 'pending' | pending, partial, paid, overdue, waived |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `created_by` | UUID | FK → users | |

**Unique Constraint:** `(student_id, academic_year_id)`

**Indexes:**
- `idx_fee_assignments_student` on `student_id`
- `idx_fee_assignments_status` on `status`

**Why this table exists:** Per-student fee ledger for tracking dues and payments.

---

### 9.7 fee_concessions

**Purpose:** Discounts/waivers applied to student fees.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `student_fee_assignment_id` | UUID | FK → student_fee_assignments, NOT NULL | |
| `fee_type_id` | UUID | FK → fee_types | NULL for overall concession |
| `concession_type` | ENUM | NOT NULL | fixed, percentage |
| `value` | DECIMAL(10,2) | NOT NULL | |
| `reason` | VARCHAR(255) | | |
| `approved_by` | UUID | FK → users | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `created_by` | UUID | FK → users | |

**Why this table exists:** Track scholarships, sibling discounts, and special waivers.

---

### 9.8 fee_payments

**Purpose:** Payment transactions. Financial audit trail.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `student_id` | UUID | FK → students, NOT NULL | |
| `student_fee_assignment_id` | UUID | FK → student_fee_assignments, NOT NULL | |
| `receipt_number` | VARCHAR(50) | NOT NULL | |
| `amount` | DECIMAL(12,2) | NOT NULL | |
| `payment_date` | DATE | NOT NULL | |
| `payment_mode` | ENUM | NOT NULL | cash, cheque, bank_transfer, online, dd |
| `reference_number` | VARCHAR(100) | | Cheque/transaction number |
| `bank_name` | VARCHAR(100) | | For cheque/DD |
| `remarks` | TEXT | | |
| `status` | ENUM | NOT NULL, DEFAULT 'completed' | completed, bounced, refunded |
| `received_by` | UUID | FK → users, NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(tenant_id, receipt_number)`

**Indexes:**
- `idx_payments_student` on `student_id`
- `idx_payments_receipt` UNIQUE on `(tenant_id, receipt_number)`
- `idx_payments_date` on `payment_date`
- `idx_payments_branch_date` on `(branch_id, payment_date)`

**Why this table exists:** Immutable payment records for financial accountability and reconciliation.

---

### 9.9 fee_payment_details

**Purpose:** Break down payment against specific fee components.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `fee_payment_id` | UUID | FK → fee_payments, NOT NULL | |
| `fee_type_id` | UUID | FK → fee_types, NOT NULL | |
| `amount` | DECIMAL(12,2) | NOT NULL | |

**Why this table exists:** Allocate payments to specific fee types for reporting.

---

## 10. Domain: Examinations & Results

### 10.1 exams

**Purpose:** Define examinations/assessments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `academic_year_id` | UUID | FK → academic_years, NOT NULL | |
| `name` | VARCHAR(100) | NOT NULL | e.g., "Mid-Term Exam" |
| `code` | VARCHAR(20) | NOT NULL | |
| `exam_type` | ENUM | NOT NULL | unit_test, mid_term, final, practical, assignment |
| `start_date` | DATE | NOT NULL | |
| `end_date` | DATE | NOT NULL | |
| `max_marks` | INTEGER | NOT NULL | Default max marks |
| `passing_marks` | INTEGER | NOT NULL | |
| `weightage` | DECIMAL(5,2) | | For GPA calculation |
| `grade_scale_id` | UUID | FK → grade_scales | |
| `status` | ENUM | NOT NULL, DEFAULT 'draft' | draft, scheduled, in_progress, completed, published |
| `results_published_at` | TIMESTAMP | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |
| `created_by` | UUID | FK → users | |

**Unique Constraint:** `(branch_id, academic_year_id, code)`

**Indexes:**
- `idx_exams_branch` on `branch_id`
- `idx_exams_year` on `academic_year_id`
- `idx_exams_status` on `status`

**Why this table exists:** Central exam definition, linked to schedules and results.

---

### 10.2 exam_classes

**Purpose:** Link exams to applicable classes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `exam_id` | UUID | FK → exams, NOT NULL | |
| `class_id` | UUID | FK → classes, NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(exam_id, class_id)`

**Why this table exists:** An exam can apply to multiple classes.

---

### 10.3 exam_schedules

**Purpose:** Subject-wise exam schedule with date/time.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `exam_id` | UUID | FK → exams, NOT NULL | |
| `class_id` | UUID | FK → classes, NOT NULL | |
| `subject_id` | UUID | FK → subjects, NOT NULL | |
| `exam_date` | DATE | NOT NULL | |
| `start_time` | TIME | NOT NULL | |
| `end_time` | TIME | NOT NULL | |
| `max_marks` | INTEGER | NOT NULL | Can override exam default |
| `passing_marks` | INTEGER | NOT NULL | |
| `room` | VARCHAR(50) | | |
| `invigilator_id` | UUID | FK → staff | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(exam_id, class_id, subject_id)`

**Indexes:**
- `idx_exam_schedules_exam` on `exam_id`
- `idx_exam_schedules_date` on `exam_date`

**Why this table exists:** Detailed scheduling for each subject within an exam.

---

### 10.4 exam_results

**Purpose:** Student results per subject. High-volume historical data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `exam_schedule_id` | UUID | FK → exam_schedules, NOT NULL | |
| `student_id` | UUID | FK → students, NOT NULL | |
| `marks_obtained` | DECIMAL(6,2) | | NULL if absent |
| `is_absent` | BOOLEAN | NOT NULL, DEFAULT false | |
| `grade` | VARCHAR(5) | | Computed from grade scale |
| `grade_points` | DECIMAL(4,2) | | |
| `remarks` | VARCHAR(255) | | |
| `entered_by` | UUID | FK → users, NOT NULL | |
| `entered_at` | TIMESTAMP | NOT NULL | |
| `updated_by` | UUID | FK → users | |
| `updated_at` | TIMESTAMP | | |

**Unique Constraint:** `(exam_schedule_id, student_id)`

**Indexes:**
- `idx_results_schedule` on `exam_schedule_id`
- `idx_results_student` on `student_id`
- `idx_results_tenant` on `tenant_id` — for RLS

**Why this table exists:** Core assessment data. Queried for report cards and analytics.

---

### 10.5 grade_scales

**Purpose:** Define grading systems (A-F, percentage-based, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `name` | VARCHAR(100) | NOT NULL | e.g., "CBSE Grading" |
| `description` | TEXT | | |
| `is_default` | BOOLEAN | DEFAULT false | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Why this table exists:** Different boards/standards use different grading systems.

---

### 10.6 grade_scale_ranges

**Purpose:** Define grade boundaries within a scale.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `grade_scale_id` | UUID | FK → grade_scales, NOT NULL | |
| `grade` | VARCHAR(5) | NOT NULL | e.g., "A+" |
| `min_percentage` | DECIMAL(5,2) | NOT NULL | |
| `max_percentage` | DECIMAL(5,2) | NOT NULL | |
| `grade_points` | DECIMAL(4,2) | | For GPA |
| `description` | VARCHAR(100) | | e.g., "Outstanding" |
| `display_order` | INTEGER | NOT NULL | |

**Why this table exists:** Map percentage ranges to grades for automatic grade computation.

---

### 10.7 report_cards

**Purpose:** Generated report cards for students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `student_id` | UUID | FK → students, NOT NULL | |
| `academic_year_id` | UUID | FK → academic_years, NOT NULL | |
| `class_id` | UUID | FK → classes, NOT NULL | |
| `term` | VARCHAR(50) | | e.g., "Final" |
| `total_marks` | DECIMAL(8,2) | | |
| `marks_obtained` | DECIMAL(8,2) | | |
| `percentage` | DECIMAL(5,2) | | |
| `grade` | VARCHAR(5) | | Overall grade |
| `rank` | INTEGER | | Class rank |
| `attendance_percentage` | DECIMAL(5,2) | | |
| `remarks` | TEXT | | Teacher remarks |
| `generated_at` | TIMESTAMP | NOT NULL | |
| `file_url` | VARCHAR(500) | | PDF URL |
| `created_by` | UUID | FK → users | |

**Unique Constraint:** `(student_id, academic_year_id, term)`

**Indexes:**
- `idx_report_cards_student` on `student_id`
- `idx_report_cards_year` on `academic_year_id`

**Why this table exists:** Snapshot of aggregated results for official record-keeping.

---

## 11. Domain: Timetables

### 11.1 periods

**Purpose:** Define time slots for the day.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `name` | VARCHAR(50) | NOT NULL | e.g., "Period 1" |
| `start_time` | TIME | NOT NULL | |
| `end_time` | TIME | NOT NULL | |
| `type` | ENUM | NOT NULL | class, break, lunch, assembly |
| `display_order` | INTEGER | NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(branch_id, name)`

**Why this table exists:** Standard time slots that apply across the branch.

---

### 11.2 timetables

**Purpose:** Header for class timetable configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `academic_year_id` | UUID | FK → academic_years, NOT NULL | |
| `class_id` | UUID | FK → classes, NOT NULL | |
| `section_id` | UUID | FK → sections, NOT NULL | |
| `effective_from` | DATE | NOT NULL | |
| `effective_until` | DATE | | NULL means currently active |
| `status` | ENUM | NOT NULL, DEFAULT 'draft' | draft, active, archived |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `created_by` | UUID | FK → users | |

**Unique Constraint:** `(section_id, effective_from)`

**Indexes:**
- `idx_timetables_section` on `section_id`
- `idx_timetables_year` on `academic_year_id`
- `idx_timetables_status` on `status`

**Why this table exists:** Timetables can change mid-year; effective dates track history.

---

### 11.3 timetable_entries

**Purpose:** Individual slots in a timetable.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `timetable_id` | UUID | FK → timetables, NOT NULL | |
| `day_of_week` | ENUM | NOT NULL | monday, tuesday, wednesday, thursday, friday, saturday |
| `period_id` | UUID | FK → periods, NOT NULL | |
| `subject_id` | UUID | FK → subjects | NULL for non-class periods |
| `teacher_id` | UUID | FK → staff | |
| `room` | VARCHAR(50) | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `(timetable_id, day_of_week, period_id)`

**Indexes:**
- `idx_timetable_entries_timetable` on `timetable_id`
- `idx_timetable_entries_teacher` on `teacher_id`

**Why this table exists:** Map day+period to subject+teacher for each section.

---

## 12. Domain: Communications

### 12.1 announcements

**Purpose:** School-wide or targeted announcements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches | NULL for tenant-wide |
| `title` | VARCHAR(255) | NOT NULL | |
| `content` | TEXT | NOT NULL | |
| `priority` | ENUM | NOT NULL, DEFAULT 'normal' | low, normal, high, urgent |
| `target_type` | ENUM | NOT NULL | all, branch, class, section, role |
| `target_roles` | JSONB | | Array of role codes |
| `valid_from` | TIMESTAMP | | |
| `valid_until` | TIMESTAMP | | |
| `is_published` | BOOLEAN | NOT NULL, DEFAULT false | |
| `published_at` | TIMESTAMP | | |
| `attachments` | JSONB | | Array of file URLs |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |
| `created_by` | UUID | FK → users, NOT NULL | |

**Indexes:**
- `idx_announcements_tenant` on `tenant_id`
- `idx_announcements_branch` on `branch_id`
- `idx_announcements_published` on `is_published`
- `idx_announcements_valid` on `(valid_from, valid_until)`

**Why this table exists:** Central communication channel for school updates.

---

### 12.2 announcement_targets

**Purpose:** Specific targets for announcements (classes, sections).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `announcement_id` | UUID | FK → announcements, NOT NULL | |
| `target_type` | ENUM | NOT NULL | class, section |
| `target_id` | UUID | NOT NULL | class_id or section_id |
| `created_at` | TIMESTAMP | NOT NULL | |

**Why this table exists:** Many-to-many targeting for granular announcement delivery.

---

### 12.3 circulars

**Purpose:** Official circulars with document attachments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches | |
| `circular_number` | VARCHAR(50) | NOT NULL | |
| `title` | VARCHAR(255) | NOT NULL | |
| `content` | TEXT | NOT NULL | |
| `category` | VARCHAR(50) | | e.g., "Academic", "Administrative" |
| `issue_date` | DATE | NOT NULL | |
| `file_url` | VARCHAR(500) | | PDF attachment |
| `is_published` | BOOLEAN | NOT NULL, DEFAULT false | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |
| `created_by` | UUID | FK → users, NOT NULL | |

**Unique Constraint:** `(tenant_id, circular_number)`

**Why this table exists:** Formal numbered circulars for official communication.

---

### 12.4 notification_templates

**Purpose:** Reusable notification message templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `code` | VARCHAR(50) | NOT NULL | e.g., "FEE_REMINDER" |
| `name` | VARCHAR(100) | NOT NULL | |
| `subject` | VARCHAR(255) | | For email |
| `body` | TEXT | NOT NULL | With placeholders |
| `channel` | ENUM | NOT NULL | email, sms, both |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(tenant_id, code)`

**Why this table exists:** Consistent messaging with template variables.

---

### 12.5 notification_logs

**Purpose:** Track sent notifications for audit.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `template_id` | UUID | FK → notification_templates | |
| `channel` | ENUM | NOT NULL | email, sms |
| `recipient_type` | ENUM | NOT NULL | user, guardian, staff |
| `recipient_id` | UUID | NOT NULL | |
| `recipient_address` | VARCHAR(255) | NOT NULL | Email or phone |
| `subject` | VARCHAR(255) | | |
| `content` | TEXT | NOT NULL | Rendered content |
| `status` | ENUM | NOT NULL | queued, sent, delivered, failed |
| `error_message` | TEXT | | If failed |
| `sent_at` | TIMESTAMP | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `created_by` | UUID | FK → users | |

**Indexes:**
- `idx_notification_logs_tenant` on `tenant_id`
- `idx_notification_logs_recipient` on `(recipient_type, recipient_id)`
- `idx_notification_logs_status` on `status`
- `idx_notification_logs_date` on `created_at`

**Why this table exists:** Audit trail for all outgoing communications.

---

## 13. Domain: Transport

### 13.1 vehicles

**Purpose:** Vehicle fleet for student transport.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `vehicle_number` | VARCHAR(20) | NOT NULL | Registration number |
| `vehicle_type` | ENUM | NOT NULL | bus, van, car |
| `make` | VARCHAR(50) | | |
| `model` | VARCHAR(50) | | |
| `capacity` | INTEGER | NOT NULL | |
| `fuel_type` | ENUM | | petrol, diesel, electric, cng |
| `insurance_expiry` | DATE | | |
| `fitness_expiry` | DATE | | |
| `gps_device_id` | VARCHAR(100) | | |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, maintenance, inactive |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(tenant_id, vehicle_number)`

**Indexes:**
- `idx_vehicles_branch` on `branch_id`
- `idx_vehicles_status` on `status`

**Why this table exists:** Track vehicle inventory and compliance documents.

---

### 13.2 transport_routes

**Purpose:** Define pickup/drop routes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `code` | VARCHAR(20) | NOT NULL | e.g., "R01" |
| `name` | VARCHAR(100) | NOT NULL | e.g., "North Zone" |
| `vehicle_id` | UUID | FK → vehicles | |
| `driver_id` | UUID | FK → staff | |
| `helper_id` | UUID | FK → staff | |
| `route_type` | ENUM | NOT NULL | pickup, drop, both |
| `start_time` | TIME | NOT NULL | |
| `end_time` | TIME | NOT NULL | |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, inactive |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(branch_id, code)`

**Indexes:**
- `idx_routes_branch` on `branch_id`
- `idx_routes_vehicle` on `vehicle_id`

**Why this table exists:** Core transport route definitions.

---

### 13.3 route_stops

**Purpose:** Stops along a route with timing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `route_id` | UUID | FK → transport_routes, NOT NULL | |
| `name` | VARCHAR(100) | NOT NULL | Stop name |
| `address` | VARCHAR(255) | | |
| `latitude` | DECIMAL(10,7) | | |
| `longitude` | DECIMAL(10,7) | | |
| `arrival_time` | TIME | NOT NULL | |
| `sequence` | INTEGER | NOT NULL | Order in route |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Indexes:**
- `idx_route_stops_route` on `route_id`
- `idx_route_stops_sequence` on `(route_id, sequence)`

**Why this table exists:** Track stops with timing for parent communication.

---

### 13.4 student_transport_assignments

**Purpose:** Assign students to transport routes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `student_id` | UUID | FK → students, NOT NULL | |
| `route_id` | UUID | FK → transport_routes, NOT NULL | |
| `stop_id` | UUID | FK → route_stops, NOT NULL | |
| `assignment_type` | ENUM | NOT NULL | pickup, drop, both |
| `effective_from` | DATE | NOT NULL | |
| `effective_until` | DATE | | |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | active, inactive |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `created_by` | UUID | FK → users | |

**Indexes:**
- `idx_transport_assignments_student` on `student_id`
- `idx_transport_assignments_route` on `route_id`
- `idx_transport_assignments_status` on `status`

**Why this table exists:** Track which students use transport and their pickup points.

---

## 14. Domain: Library

### 14.1 book_categories

**Purpose:** Book classification categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `name` | VARCHAR(100) | NOT NULL | e.g., "Science Fiction" |
| `code` | VARCHAR(20) | NOT NULL | |
| `parent_category_id` | UUID | FK → book_categories | For hierarchy |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Unique Constraint:** `(tenant_id, code)`

**Why this table exists:** Organize books for browsing and reporting.

---

### 14.2 books

**Purpose:** Library book catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `branch_id` | UUID | FK → branches, NOT NULL | |
| `isbn` | VARCHAR(20) | | |
| `title` | VARCHAR(255) | NOT NULL | |
| `authors` | JSONB | NOT NULL | Array of author names |
| `publisher` | VARCHAR(100) | | |
| `publication_year` | INTEGER | | |
| `category_id` | UUID | FK → book_categories | |
| `total_copies` | INTEGER | NOT NULL, DEFAULT 1 | |
| `available_copies` | INTEGER | NOT NULL, DEFAULT 1 | Computed/maintained |
| `shelf_location` | VARCHAR(50) | | |
| `description` | TEXT | | |
| `cover_image_url` | VARCHAR(500) | | |
| `status` | ENUM | NOT NULL, DEFAULT 'available' | available, all_issued, retired |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | | |

**Indexes:**
- `idx_books_branch` on `branch_id`
- `idx_books_isbn` on `isbn`
- `idx_books_category` on `category_id`
- `idx_books_title` GIN on `title` — for search

**Why this table exists:** Catalog of books available in the library.

---

### 14.3 book_issues

**Purpose:** Track book checkouts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `book_id` | UUID | FK → books, NOT NULL | |
| `member_type` | ENUM | NOT NULL | student, staff |
| `member_id` | UUID | NOT NULL | student_id or staff_id |
| `issue_date` | DATE | NOT NULL | |
| `due_date` | DATE | NOT NULL | |
| `return_date` | DATE | | NULL if not returned |
| `return_condition` | ENUM | | good, damaged, lost |
| `status` | ENUM | NOT NULL, DEFAULT 'issued' | issued, returned, overdue, lost |
| `issued_by` | UUID | FK → users, NOT NULL | |
| `returned_to` | UUID | FK → users | |
| `remarks` | VARCHAR(255) | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | | |

**Indexes:**
- `idx_book_issues_book` on `book_id`
- `idx_book_issues_member` on `(member_type, member_id)`
- `idx_book_issues_status` on `status`
- `idx_book_issues_due` on `due_date` WHERE `status = 'issued'`

**Why this table exists:** Track active and historical book loans.

---

### 14.4 library_fines

**Purpose:** Fines for overdue/lost books.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `book_issue_id` | UUID | FK → book_issues, NOT NULL | |
| `fine_type` | ENUM | NOT NULL | overdue, lost, damaged |
| `amount` | DECIMAL(10,2) | NOT NULL | |
| `days_overdue` | INTEGER | | For overdue fines |
| `status` | ENUM | NOT NULL, DEFAULT 'pending' | pending, paid, waived |
| `paid_at` | TIMESTAMP | | |
| `paid_amount` | DECIMAL(10,2) | | |
| `waived_by` | UUID | FK → users | |
| `waived_reason` | VARCHAR(255) | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | | |

**Indexes:**
- `idx_library_fines_issue` on `book_issue_id`
- `idx_library_fines_status` on `status`

**Why this table exists:** Track and collect library fines.

---

## 15. Domain: Audit & Reporting

### 15.1 audit_logs

**Purpose:** Comprehensive audit trail for all system actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants | NULL for system events |
| `branch_id` | UUID | FK → branches | |
| `user_id` | UUID | FK → users | NULL for system actions |
| `action` | ENUM | NOT NULL | create, read, update, delete, login, logout, export, other |
| `entity_type` | VARCHAR(50) | NOT NULL | e.g., "student", "fee_payment" |
| `entity_id` | UUID | | |
| `changes` | JSONB | | Old/new values for updates |
| `request_path` | VARCHAR(255) | | API endpoint |
| `request_method` | VARCHAR(10) | | HTTP method |
| `ip_address` | VARCHAR(45) | | |
| `user_agent` | VARCHAR(500) | | |
| `response_status` | INTEGER | | HTTP status code |
| `duration_ms` | INTEGER | | Request duration |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_audit_logs_tenant` on `tenant_id`
- `idx_audit_logs_user` on `user_id`
- `idx_audit_logs_entity` on `(entity_type, entity_id)`
- `idx_audit_logs_action` on `action`
- `idx_audit_logs_created` on `created_at`

**Partitioning:** Partition by `created_at` (monthly) for performance. Auto-archive old partitions.

**Why this table exists:** Compliance, debugging, security investigations. Append-only.

---

### 15.2 report_templates

**Purpose:** Pre-defined report templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | e.g., "ATTENDANCE_MONTHLY" |
| `name` | VARCHAR(100) | NOT NULL | |
| `description` | TEXT | | |
| `category` | VARCHAR(50) | NOT NULL | attendance, fee, exam, student, etc. |
| `parameters` | JSONB | NOT NULL | Required parameters schema |
| `query_template` | TEXT | | SQL or query builder config |
| `formats` | JSONB | NOT NULL | Supported formats ["pdf", "csv", "excel"] |
| `is_system` | BOOLEAN | NOT NULL, DEFAULT true | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Why this table exists:** System-defined reports with parameterization.

---

### 15.3 generated_reports

**Purpose:** Track generated report instances.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `template_id` | UUID | FK → report_templates, NOT NULL | |
| `parameters` | JSONB | NOT NULL | Actual parameters used |
| `format` | ENUM | NOT NULL | pdf, csv, excel |
| `status` | ENUM | NOT NULL | queued, processing, completed, failed |
| `file_url` | VARCHAR(500) | | Generated file |
| `file_size` | INTEGER | | |
| `error_message` | TEXT | | If failed |
| `started_at` | TIMESTAMP | | |
| `completed_at` | TIMESTAMP | | |
| `expires_at` | TIMESTAMP | | Auto-delete after |
| `created_at` | TIMESTAMP | NOT NULL | |
| `created_by` | UUID | FK → users, NOT NULL | |

**Indexes:**
- `idx_generated_reports_tenant` on `tenant_id`
- `idx_generated_reports_status` on `status`
- `idx_generated_reports_user` on `created_by`

**Why this table exists:** Track report generation jobs and provide download links.

---

### 15.4 scheduled_reports

**Purpose:** Automated scheduled report generation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants, NOT NULL | |
| `template_id` | UUID | FK → report_templates, NOT NULL | |
| `parameters` | JSONB | NOT NULL | |
| `format` | ENUM | NOT NULL | |
| `frequency` | ENUM | NOT NULL | daily, weekly, monthly |
| `day_of_week` | INTEGER | | 0-6 for weekly |
| `day_of_month` | INTEGER | | 1-28 for monthly |
| `time_of_day` | TIME | NOT NULL | |
| `recipients` | JSONB | NOT NULL | Email addresses |
| `is_enabled` | BOOLEAN | NOT NULL, DEFAULT true | |
| `last_run_at` | TIMESTAMP | | |
| `next_run_at` | TIMESTAMP | | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `created_by` | UUID | FK → users, NOT NULL | |

**Indexes:**
- `idx_scheduled_reports_next_run` on `next_run_at` WHERE `is_enabled = true`

**Why this table exists:** Automate recurring reports for stakeholders.

---

## 16. Indexing Strategy

### 16.1 Tenant Isolation Index

Every tenant-scoped table MUST have an index on `tenant_id` for RLS performance:

```sql
CREATE INDEX idx_{table}_tenant ON {table} (tenant_id);
```

### 16.2 High-Read Tables

| Table | Index Strategy |
|-------|----------------|
| `students` | Composite on `(branch_id, status)`, B-tree on `admission_number` |
| `users` | Unique on `(tenant_id, email)` |
| `attendance_records` | Composite on `(class_id, section_id, date)`, partition by date |
| `fee_payments` | Composite on `(branch_id, payment_date)` |
| `exam_results` | Composite on `(exam_schedule_id, student_id)` |

### 16.3 Report-Heavy Tables

| Table | Index Strategy |
|-------|----------------|
| `attendance_records` | Covering index for monthly aggregation |
| `fee_payments` | Index on `(payment_date, payment_mode)` for collection reports |
| `audit_logs` | BRIN index on `created_at` (time-series data) |

### 16.4 Full-Text Search

Tables requiring search capabilities:
- `students`: GIN index on `(first_name || ' ' || last_name)`
- `books`: GIN index on `title`
- `announcements`: GIN index on `title || content`

---

## 17. Data Classification

### 17.1 Source vs Derived Data

| Classification | Tables | Notes |
|----------------|--------|-------|
| **Source (Immutable)** | `fee_payments`, `attendance_records`, `exam_results`, `audit_logs` | Never modified after creation |
| **Source (Mutable)** | `students`, `staff`, `users`, `branches` | Can be updated, soft deleted |
| **Derived** | `report_cards`, `student_fee_assignments.balance` | Computed from source data |
| **Configuration** | `tenant_settings`, `fee_structures`, `grade_scales` | Rarely changing configuration |

### 17.2 PII Data Locations

| Table | PII Columns | Handling |
|-------|-------------|----------|
| `users` | `email`, `phone`, `password_hash` | Encrypted at rest, mask in logs |
| `students` | `first_name`, `last_name`, `date_of_birth`, address | Encrypted at rest |
| `guardians` | `email`, `phone`, address | Encrypted at rest |
| `staff` | All personal details | Encrypted at rest |
| `student_medical_info` | All columns | Separate table, additional access control |

---

## 18. Document Sign-Off

| Role | Status |
|------|--------|
| Principal Data Architect | ✅ Approved |
| Backend Lead | ⏳ Pending |
| Security Lead | ⏳ Pending |
| DBA | ⏳ Pending |

---

**This document is the authoritative database schema reference. All ORM implementations (Prisma/TypeORM) must align with this specification.**
