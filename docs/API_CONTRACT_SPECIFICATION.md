# API Contract Specification

**Document ID:** SCHOOL-ERP-API-v1.0  
**Status:** APPROVED FOR IMPLEMENTATION  
**Last Updated:** 2026-01-14  
**Owner:** Principal Backend Architect  
**Parent Documents:** SCHOOL-ERP-SCOPE-v1.0, SCHOOL-ERP-HLD-v1.0  

---

## 1. Global API Standards

### 1.1 Base Configuration

| Setting | Value |
|---------|-------|
| **Base URL** | `/api/v1` |
| **Protocol** | HTTPS only |
| **Content-Type** | `application/json` |
| **Authentication** | JWT Bearer Token |
| **API Version** | URL-based (`/api/v1`, `/api/v2`) |

### 1.2 Authentication Header

```
Authorization: Bearer <jwt_token>
```

For API key authentication (integrations):
```
X-API-Key: <api_key>
```

### 1.3 Tenant Context

All requests (except `/auth/login` and public endpoints) must include tenant context via:
- **JWT Token**: Tenant ID embedded in token claims
- **Header Override** (super-admin only): `X-Tenant-ID: <tenant_uuid>`

### 1.4 Standard Response Envelope

**Success Response:**
```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "errors": null
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "meta": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Email is required",
      "field": "email"
    }
  ]
}
```

### 1.5 HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Success (GET, PATCH) |
| `201` | Created (POST) |
| `204` | No Content (DELETE) |
| `400` | Validation Error |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Resource Not Found |
| `409` | Conflict (duplicate, state conflict) |
| `422` | Unprocessable Entity (business rule violation) |
| `429` | Rate Limited |
| `500` | Internal Server Error |

### 1.6 Pagination Contract

**Request Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Items per page (max: 100) |

**Response Meta:**
```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 247,
    "totalPages": 13
  }
}
```

### 1.7 Filtering Convention

**Query Parameter Format:** `filter[field]=value`

**Operators:**
| Operator | Example | Description |
|----------|---------|-------------|
| `eq` (default) | `filter[status]=active` | Equals |
| `ne` | `filter[status][ne]=inactive` | Not equals |
| `gt` | `filter[created_at][gt]=2026-01-01` | Greater than |
| `gte` | `filter[amount][gte]=100` | Greater than or equal |
| `lt` | `filter[created_at][lt]=2026-12-31` | Less than |
| `lte` | `filter[amount][lte]=1000` | Less than or equal |
| `in` | `filter[status][in]=active,pending` | In list |
| `like` | `filter[name][like]=john` | Contains (case-insensitive) |

### 1.8 Sorting Convention

**Query Parameter Format:** `sort=field` or `sort=-field` (descending)

**Multiple Sort:**
```
?sort=-created_at,name
```

### 1.9 Field Selection

**Query Parameter:** `fields=field1,field2,field3`

```
GET /api/v1/students?fields=id,first_name,last_name,email
```

### 1.10 Search

**Query Parameter:** `search=term`

Performs full-text search across searchable fields defined per resource.

---

## 2. Permission Notation

| Symbol | Meaning |
|--------|---------|
| `🔓` | Public (no auth required) |
| `🔐` | Authenticated (any valid token) |
| `👑` | Super Admin only |
| `🏢` | Tenant Admin only |
| `🏫` | Branch Admin only |
| `👨‍🏫` | Teacher only |
| `💰` | Accountant only |
| `📖` | Read-only endpoint |

---

## 3. API Groups

---

### 3.1 Auth APIs

**Base Path:** `/api/v1/auth`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/login` | User login | 🔓 | - |
| `POST` | `/logout` | User logout | 🔐 | - |
| `POST` | `/refresh` | Refresh access token | 🔓 | Valid refresh token |
| `POST` | `/password/forgot` | Request password reset | 🔓 | - |
| `POST` | `/password/reset` | Reset password with token | 🔓 | Valid reset token |
| `POST` | `/password/change` | Change own password | 🔐 | - |
| `GET` | `/me` | Get current user info | 🔐 | - |
| `GET` | `/sessions` | List active sessions | 🔐 | - |
| `DELETE` | `/sessions/:id` | Revoke session | 🔐 | Own session or admin |
| `GET` | `/api-keys` | List API keys | 🔐 | `api_key:read` |
| `POST` | `/api-keys` | Create API key | 🔐 | `api_key:write` |
| `DELETE` | `/api-keys/:id` | Revoke API key | 🔐 | `api_key:delete` |

#### 3.1.1 POST /login

**Request:**
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "tenant_code": "string (optional, for multi-tenant login)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 900,
    "token_type": "Bearer",
    "user": {
      "id": "uuid",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "tenant_id": "uuid",
      "branches": ["uuid"],
      "roles": ["string"],
      "permissions": ["string"]
    }
  }
}
```

#### 3.1.2 POST /refresh

**Request:**
```json
{
  "refresh_token": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "expires_in": 900
  }
}
```

#### 3.1.3 POST /password/forgot

**Request:**
```json
{
  "email": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "If the email exists, a reset link has been sent"
  }
}
```

#### 3.1.4 POST /api-keys

**Request:**
```json
{
  "name": "string (required)",
  "expires_at": "datetime (optional)",
  "permissions": ["string"] 
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "key": "api_key_shown_only_once",
    "prefix": "sk_live_xxxx",
    "permissions": ["string"],
    "expires_at": "datetime",
    "created_at": "datetime"
  }
}
```

---

### 3.2 Tenant APIs

**Base Path:** `/api/v1/tenants`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/` | Create tenant | 👑 | `tenant:create` |
| `GET` | `/` | List tenants | 👑 | `tenant:read` |
| `GET` | `/:id` | Get tenant details | 🏢 | `tenant:read` |
| `PATCH` | `/:id` | Update tenant | 🏢 | `tenant:update` |
| `DELETE` | `/:id` | Deactivate tenant | 👑 | `tenant:delete` |
| `GET` | `/:id/settings` | Get tenant settings | 🏢 | `tenant:read` |
| `PATCH` | `/:id/settings` | Update tenant settings | 🏢 | `tenant:update` |
| `GET` | `/:id/stats` | Get tenant statistics | 🏢 | `tenant:read` |

#### 3.2.1 POST /tenants

**Request:**
```json
{
  "name": "string (required)",
  "code": "string (required, unique, alphanumeric)",
  "email": "string (required)",
  "phone": "string (optional)",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postal_code": "string"
  },
  "admin": {
    "email": "string (required)",
    "first_name": "string (required)",
    "last_name": "string (required)",
    "password": "string (required)"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "code": "string",
    "status": "active",
    "created_at": "datetime",
    "admin": {
      "id": "uuid",
      "email": "string"
    }
  }
}
```

#### 3.2.2 GET /tenants/:id/settings

**Response (200):**
```json
{
  "success": true,
  "data": {
    "academic_year_format": "YYYY-YY",
    "date_format": "DD/MM/YYYY",
    "timezone": "Asia/Kolkata",
    "currency": "INR",
    "attendance_marking_deadline": "10:00",
    "fee_due_reminder_days": [7, 3, 1],
    "features": {
      "transport": true,
      "library": true,
      "examination": true
    }
  }
}
```

---

### 3.3 Branch APIs

**Base Path:** `/api/v1/branches`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/` | Create branch | 🏢 | `branch:create` |
| `GET` | `/` | List branches | 🔐 | `branch:read` |
| `GET` | `/:id` | Get branch details | 🔐 | `branch:read` |
| `PATCH` | `/:id` | Update branch | 🏫 | `branch:update` |
| `DELETE` | `/:id` | Deactivate branch | 🏢 | `branch:delete` |
| `GET` | `/:id/settings` | Get branch settings | 🏫 | `branch:read` |
| `PATCH` | `/:id/settings` | Update branch settings | 🏫 | `branch:update` |
| `GET` | `/:id/stats` | Get branch statistics | 🏫 | `branch:read` |
| `GET` | `/:id/hierarchy` | Get branch hierarchy | 🏢 | `branch:read` |

#### 3.3.1 POST /branches

**Request:**
```json
{
  "name": "string (required)",
  "code": "string (required, unique within tenant)",
  "type": "enum: main | branch | satellite",
  "parent_branch_id": "uuid (optional, for hierarchy)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postal_code": "string"
  },
  "principal_name": "string (optional)",
  "established_year": "integer (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "name": "string",
    "code": "string",
    "type": "string",
    "status": "active",
    "created_at": "datetime"
  }
}
```

#### 3.3.2 GET /branches

**Query Parameters:**
- `filter[status]=active|inactive`
- `filter[type]=main|branch|satellite`
- `search=term`
- `sort=-created_at`
- `page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "code": "string",
      "type": "string",
      "status": "string",
      "student_count": 500,
      "staff_count": 45
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 3.4 User APIs

**Base Path:** `/api/v1/users`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/` | Create user | 🏫 | `user:create` |
| `GET` | `/` | List users | 🏫 | `user:read` |
| `GET` | `/:id` | Get user details | 🔐 | `user:read` |
| `PATCH` | `/:id` | Update user | 🏫 | `user:update` |
| `DELETE` | `/:id` | Deactivate user | 🏫 | `user:delete` |
| `POST` | `/:id/activate` | Activate user | 🏫 | `user:update` |
| `POST` | `/:id/deactivate` | Deactivate user | 🏫 | `user:update` |
| `GET` | `/:id/branches` | Get user's branches | 🔐 | `user:read` |
| `POST` | `/:id/branches` | Assign branches | 🏫 | `user:update` |
| `DELETE` | `/:id/branches/:branchId` | Remove branch access | 🏫 | `user:update` |
| `GET` | `/:id/roles` | Get user's roles | 🔐 | `user:read` |
| `POST` | `/:id/roles` | Assign roles | 🏫 | `role:assign` |
| `DELETE` | `/:id/roles/:roleId` | Remove role | 🏫 | `role:assign` |
| `GET` | `/:id/permissions` | Get computed permissions | 🔐 | `user:read` |
| `POST` | `/:id/password/reset` | Admin reset password | 🏫 | `user:update` |

#### 3.4.1 POST /users

**Request:**
```json
{
  "email": "string (required)",
  "first_name": "string (required)",
  "last_name": "string (required)",
  "phone": "string (optional)",
  "password": "string (optional, auto-generated if not provided)",
  "user_type": "enum: admin | staff | teacher | parent | student",
  "branch_ids": ["uuid (required, at least one)"],
  "role_ids": ["uuid (optional)"],
  "send_welcome_email": "boolean (default: true)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "user_type": "string",
    "status": "active",
    "branches": [
      {
        "id": "uuid",
        "name": "string"
      }
    ],
    "roles": [
      {
        "id": "uuid",
        "name": "string"
      }
    ],
    "created_at": "datetime"
  }
}
```

#### 3.4.2 GET /users

**Query Parameters:**
- `filter[status]=active|inactive|pending`
- `filter[user_type]=admin|staff|teacher|parent|student`
- `filter[branch_id]=uuid`
- `filter[role_id]=uuid`
- `search=term` (searches name, email)
- `sort=-created_at`
- `page=1&limit=20`

---

### 3.5 Role & Permission APIs

**Base Path:** `/api/v1/roles`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `GET` | `/` | List all roles | 🔐 | `role:read` |
| `POST` | `/` | Create custom role | 🏢 | `role:create` |
| `GET` | `/:id` | Get role details | 🔐 | `role:read` |
| `PATCH` | `/:id` | Update role | 🏢 | `role:update` |
| `DELETE` | `/:id` | Delete custom role | 🏢 | `role:delete` |
| `GET` | `/:id/permissions` | Get role permissions | 🔐 | `role:read` |
| `PUT` | `/:id/permissions` | Set role permissions | 🏢 | `role:update` |
| `GET` | `/permissions` | List all permissions | 🔐 | `role:read` |
| `GET` | `/system` | List system roles | 🔐 | `role:read` |

#### 3.5.1 System Roles (Pre-defined)

| Role | Code | Description |
|------|------|-------------|
| Super Admin | `SUPER_ADMIN` | Full system access (platform level) |
| Tenant Admin | `TENANT_ADMIN` | Full tenant access |
| Branch Admin | `BRANCH_ADMIN` | Full branch access |
| Teacher | `TEACHER` | Teaching staff access |
| Class Teacher | `CLASS_TEACHER` | Teacher + class management |
| Accountant | `ACCOUNTANT` | Fee & financial access |
| Librarian | `LIBRARIAN` | Library management |
| Transport Manager | `TRANSPORT_MANAGER` | Transport management |
| Parent | `PARENT` | Parent portal access |
| Student | `STUDENT` | Student portal access |

#### 3.5.2 Permission Structure

**Format:** `resource:action` or `resource:action:scope`

**Resources:**
- `tenant`, `branch`, `user`, `role`, `student`, `academic`, `staff`
- `attendance`, `fee`, `exam`, `timetable`, `communication`
- `transport`, `library`, `audit`, `report`

**Actions:**
- `create`, `read`, `update`, `delete`, `list`, `export`

**Scopes:**
- `own` - Own records only
- `branch` - Branch-level access
- `tenant` - Tenant-level access
- `all` - Global access (super admin)

**Example Permissions:**
```
student:read:branch      - Read students in own branch
attendance:write:own     - Mark attendance for own classes
fee:read:tenant          - View fees across all branches
report:export:branch     - Export reports for own branch
```

#### 3.5.3 POST /roles

**Request:**
```json
{
  "name": "string (required)",
  "code": "string (required, unique within tenant)",
  "description": "string (optional)",
  "permissions": ["string (permission codes)"],
  "inherits_from": "uuid (optional, copy from another role)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "code": "string",
    "is_system": false,
    "permissions": ["string"],
    "user_count": 0,
    "created_at": "datetime"
  }
}
```

#### 3.5.4 GET /roles/permissions

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "resource": "student",
      "actions": [
        {
          "code": "student:create",
          "name": "Create Student",
          "description": "Register new students"
        },
        {
          "code": "student:read",
          "name": "View Students",
          "description": "View student profiles"
        }
      ]
    }
  ]
}
```

---

### 3.6 Student APIs

**Base Path:** `/api/v1/students`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/` | Register student | 🏫 | `student:create` |
| `GET` | `/` | List students | 🔐 | `student:read` |
| `GET` | `/:id` | Get student details | 🔐 | `student:read` |
| `PATCH` | `/:id` | Update student | 🏫 | `student:update` |
| `DELETE` | `/:id` | Deactivate student | 🏫 | `student:delete` |
| `POST` | `/:id/enroll` | Enroll in class/section | 🏫 | `student:enroll` |
| `POST` | `/:id/promote` | Promote to next class | 🏫 | `student:promote` |
| `POST` | `/:id/transfer` | Transfer to another branch | 🏢 | `student:transfer` |
| `GET` | `/:id/guardians` | List guardians | 🔐 | `student:read` |
| `POST` | `/:id/guardians` | Add guardian | 🏫 | `student:update` |
| `DELETE` | `/:id/guardians/:guardianId` | Remove guardian | 🏫 | `student:update` |
| `GET` | `/:id/documents` | List documents | 🔐 | `student:read` |
| `POST` | `/:id/documents` | Upload document | 🏫 | `student:update` |
| `GET` | `/:id/history` | Get enrollment history | 🔐 | `student:read` |
| `GET` | `/:id/siblings` | Get siblings | 🔐 | `student:read` |

#### 3.6.1 POST /students

**Request:**
```json
{
  "admission_number": "string (optional, auto-generated)",
  "first_name": "string (required)",
  "last_name": "string (required)",
  "date_of_birth": "date (required)",
  "gender": "enum: male | female | other",
  "blood_group": "string (optional)",
  "nationality": "string (optional)",
  "religion": "string (optional)",
  "category": "string (optional)",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postal_code": "string"
  },
  "branch_id": "uuid (required)",
  "enrollment": {
    "academic_year_id": "uuid (required)",
    "class_id": "uuid (required)",
    "section_id": "uuid (required)",
    "roll_number": "string (optional)",
    "admission_date": "date (required)"
  },
  "guardian": {
    "relationship": "enum: father | mother | guardian",
    "first_name": "string (required)",
    "last_name": "string (required)",
    "email": "string (required)",
    "phone": "string (required)",
    "occupation": "string (optional)",
    "create_user_account": "boolean (default: true)"
  },
  "medical_info": {
    "allergies": ["string"],
    "conditions": ["string"],
    "emergency_contact": "string"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "admission_number": "string",
    "first_name": "string",
    "last_name": "string",
    "date_of_birth": "date",
    "gender": "string",
    "status": "active",
    "branch": {
      "id": "uuid",
      "name": "string"
    },
    "current_enrollment": {
      "academic_year": "string",
      "class": "string",
      "section": "string",
      "roll_number": "string"
    },
    "guardian": {
      "id": "uuid",
      "name": "string",
      "relationship": "string"
    },
    "created_at": "datetime"
  }
}
```

#### 3.6.2 GET /students

**Query Parameters:**
- `filter[branch_id]=uuid`
- `filter[class_id]=uuid`
- `filter[section_id]=uuid`
- `filter[academic_year_id]=uuid`
- `filter[status]=active|inactive|transferred|graduated`
- `filter[gender]=male|female|other`
- `search=term` (name, admission number)
- `sort=-admission_number`
- `page=1&limit=20`

#### 3.6.3 POST /students/:id/enroll

**Request:**
```json
{
  "academic_year_id": "uuid (required)",
  "class_id": "uuid (required)",
  "section_id": "uuid (required)",
  "roll_number": "string (optional)",
  "effective_date": "date (required)"
}
```

#### 3.6.4 POST /students/:id/transfer

**Request:**
```json
{
  "target_branch_id": "uuid (required)",
  "target_class_id": "uuid (optional)",
  "target_section_id": "uuid (optional)",
  "transfer_date": "date (required)",
  "reason": "string (optional)",
  "transfer_certificate_required": "boolean (default: false)"
}
```

---

### 3.7 Academic APIs

**Base Path:** `/api/v1/academic`

#### Academic Years

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/years` | Create academic year | 🏢 | `academic:create` |
| `GET` | `/years` | List academic years | 🔐 | `academic:read` |
| `GET` | `/years/:id` | Get academic year | 🔐 | `academic:read` |
| `PATCH` | `/years/:id` | Update academic year | 🏢 | `academic:update` |
| `POST` | `/years/:id/activate` | Set as current year | 🏢 | `academic:update` |

#### Classes

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/classes` | Create class | 🏫 | `academic:create` |
| `GET` | `/classes` | List classes | 🔐 | `academic:read` |
| `GET` | `/classes/:id` | Get class details | 🔐 | `academic:read` |
| `PATCH` | `/classes/:id` | Update class | 🏫 | `academic:update` |
| `DELETE` | `/classes/:id` | Delete class | 🏫 | `academic:delete` |
| `GET` | `/classes/:id/sections` | List sections | 🔐 | `academic:read` |
| `GET` | `/classes/:id/subjects` | List subjects | 🔐 | `academic:read` |
| `POST` | `/classes/:id/subjects` | Assign subjects | 🏫 | `academic:update` |
| `GET` | `/classes/:id/students` | List students | 🔐 | `student:read` |

#### Sections

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/sections` | Create section | 🏫 | `academic:create` |
| `GET` | `/sections/:id` | Get section details | 🔐 | `academic:read` |
| `PATCH` | `/sections/:id` | Update section | 🏫 | `academic:update` |
| `DELETE` | `/sections/:id` | Delete section | 🏫 | `academic:delete` |

#### Subjects

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/subjects` | Create subject | 🏢 | `academic:create` |
| `GET` | `/subjects` | List subjects | 🔐 | `academic:read` |
| `GET` | `/subjects/:id` | Get subject details | 🔐 | `academic:read` |
| `PATCH` | `/subjects/:id` | Update subject | 🏢 | `academic:update` |

#### 3.7.1 POST /academic/years

**Request:**
```json
{
  "name": "string (required, e.g., '2026-27')",
  "start_date": "date (required)",
  "end_date": "date (required)",
  "is_current": "boolean (default: false)"
}
```

#### 3.7.2 POST /academic/classes

**Request:**
```json
{
  "name": "string (required, e.g., 'Grade 10')",
  "code": "string (required, e.g., '10')",
  "display_order": "integer (required)",
  "branch_id": "uuid (required)",
  "academic_year_id": "uuid (required)",
  "description": "string (optional)"
}
```

#### 3.7.3 POST /academic/sections

**Request:**
```json
{
  "name": "string (required, e.g., 'Section A')",
  "code": "string (required, e.g., 'A')",
  "class_id": "uuid (required)",
  "capacity": "integer (optional)",
  "class_teacher_id": "uuid (optional)"
}
```

#### 3.7.4 POST /academic/subjects

**Request:**
```json
{
  "name": "string (required)",
  "code": "string (required)",
  "type": "enum: core | elective | language | activity",
  "credit_hours": "integer (optional)",
  "description": "string (optional)"
}
```

---

### 3.8 Staff APIs

**Base Path:** `/api/v1/staff`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/` | Create staff | 🏫 | `staff:create` |
| `GET` | `/` | List staff | 🔐 | `staff:read` |
| `GET` | `/:id` | Get staff details | 🔐 | `staff:read` |
| `PATCH` | `/:id` | Update staff | 🏫 | `staff:update` |
| `DELETE` | `/:id` | Deactivate staff | 🏫 | `staff:delete` |
| `GET` | `/:id/branches` | Get assigned branches | 🔐 | `staff:read` |
| `POST` | `/:id/branches` | Assign to branch | 🏢 | `staff:update` |
| `GET` | `/:id/subjects` | Get teaching subjects | 🔐 | `staff:read` |
| `POST` | `/:id/subjects` | Assign subjects | 🏫 | `staff:update` |
| `GET` | `/:id/classes` | Get assigned classes | 🔐 | `staff:read` |

#### Designations

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/designations` | Create designation | 🏢 | `staff:create` |
| `GET` | `/designations` | List designations | 🔐 | `staff:read` |
| `PATCH` | `/designations/:id` | Update designation | 🏢 | `staff:update` |

#### Departments

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/departments` | Create department | 🏢 | `staff:create` |
| `GET` | `/departments` | List departments | 🔐 | `staff:read` |
| `PATCH` | `/departments/:id` | Update department | 🏢 | `staff:update` |

#### 3.8.1 POST /staff

**Request:**
```json
{
  "employee_id": "string (optional, auto-generated)",
  "first_name": "string (required)",
  "last_name": "string (required)",
  "email": "string (required)",
  "phone": "string (optional)",
  "date_of_birth": "date (optional)",
  "gender": "enum: male | female | other",
  "date_of_joining": "date (required)",
  "designation_id": "uuid (required)",
  "department_id": "uuid (optional)",
  "staff_type": "enum: teaching | non_teaching | admin",
  "branch_ids": ["uuid (required)"],
  "qualification": "string (optional)",
  "experience_years": "integer (optional)",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postal_code": "string"
  },
  "create_user_account": "boolean (default: true)",
  "role_ids": ["uuid (optional)"]
}
```

---

### 3.9 Attendance APIs

**Base Path:** `/api/v1/attendance`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/students` | Mark student attendance | 👨‍🏫 | `attendance:write` |
| `GET` | `/students` | Get attendance records | 🔐 | `attendance:read` |
| `PATCH` | `/students/:id` | Update attendance record | 👨‍🏫 | `attendance:update` |
| `GET` | `/students/class/:classId/date/:date` | Get class attendance | 👨‍🏫 | `attendance:read` |
| `GET` | `/students/:studentId` | Get student attendance | 🔐 | `attendance:read` |
| `GET` | `/students/:studentId/summary` | Get attendance summary | 🔐 | `attendance:read` |
| `POST` | `/staff` | Mark staff attendance | 🏫 | `attendance:write` |
| `GET` | `/staff` | Get staff attendance | 🏫 | `attendance:read` |
| `GET` | `/reports/daily` | Daily attendance report | 🏫 | `attendance:read` |
| `GET` | `/reports/monthly` | Monthly attendance report | 🏫 | `attendance:read` |

#### 3.9.1 POST /attendance/students

**Request:**
```json
{
  "class_id": "uuid (required)",
  "section_id": "uuid (required)",
  "date": "date (required)",
  "session": "enum: morning | afternoon | full_day (default: full_day)",
  "records": [
    {
      "student_id": "uuid (required)",
      "status": "enum: present | absent | late | half_day | excused",
      "remarks": "string (optional)"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "date": "date",
    "class": "string",
    "section": "string",
    "total_students": 45,
    "present": 42,
    "absent": 2,
    "late": 1,
    "marked_by": "string",
    "marked_at": "datetime"
  }
}
```

#### 3.9.2 GET /attendance/students/:studentId/summary

**Query Parameters:**
- `academic_year_id=uuid`
- `from_date=date`
- `to_date=date`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "student_id": "uuid",
    "student_name": "string",
    "period": {
      "from": "date",
      "to": "date"
    },
    "total_days": 120,
    "present": 110,
    "absent": 5,
    "late": 3,
    "excused": 2,
    "attendance_percentage": 91.67,
    "monthly_breakdown": [
      {
        "month": "January 2026",
        "working_days": 22,
        "present": 20,
        "absent": 1,
        "late": 1
      }
    ]
  }
}
```

---

### 3.10 Fee APIs

**Base Path:** `/api/v1/fees`

#### Fee Structures

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/structures` | Create fee structure | 💰 | `fee:create` |
| `GET` | `/structures` | List fee structures | 🔐 | `fee:read` |
| `GET` | `/structures/:id` | Get fee structure | 🔐 | `fee:read` |
| `PATCH` | `/structures/:id` | Update fee structure | 💰 | `fee:update` |
| `DELETE` | `/structures/:id` | Delete fee structure | 💰 | `fee:delete` |

#### Fee Types

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/types` | Create fee type | 💰 | `fee:create` |
| `GET` | `/types` | List fee types | 🔐 | `fee:read` |
| `PATCH` | `/types/:id` | Update fee type | 💰 | `fee:update` |

#### Student Fees

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/assign` | Assign fees to students | 💰 | `fee:assign` |
| `GET` | `/students/:studentId` | Get student fees | 🔐 | `fee:read` |
| `GET` | `/students/:studentId/dues` | Get student dues | 🔐 | `fee:read` |
| `POST` | `/students/:studentId/payments` | Record payment | 💰 | `fee:payment` |
| `GET` | `/students/:studentId/payments` | List payments | 🔐 | `fee:read` |
| `GET` | `/students/:studentId/receipts` | List receipts | 🔐 | `fee:read` |
| `GET` | `/students/:studentId/receipts/:id` | Get receipt | 🔐 | `fee:read` |
| `POST` | `/students/:studentId/concession` | Apply concession | 💰 | `fee:concession` |

#### Fee Reports

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `GET` | `/reports/collection` | Collection report | 💰 | `fee:read` |
| `GET` | `/reports/dues` | Dues report | 💰 | `fee:read` |
| `GET` | `/reports/defaulters` | Defaulters list | 💰 | `fee:read` |

#### 3.10.1 POST /fees/structures

**Request:**
```json
{
  "name": "string (required)",
  "academic_year_id": "uuid (required)",
  "branch_id": "uuid (required)",
  "class_ids": ["uuid (required)"],
  "components": [
    {
      "fee_type_id": "uuid (required)",
      "amount": "decimal (required)",
      "frequency": "enum: one_time | monthly | quarterly | half_yearly | yearly",
      "due_day": "integer (1-28, for recurring)",
      "is_mandatory": "boolean (default: true)"
    }
  ],
  "installments": [
    {
      "name": "string (required)",
      "due_date": "date (required)",
      "amount": "decimal (required)"
    }
  ],
  "late_fee": {
    "type": "enum: fixed | percentage",
    "value": "decimal",
    "grace_period_days": "integer"
  }
}
```

#### 3.10.2 POST /fees/students/:studentId/payments

**Request:**
```json
{
  "amount": "decimal (required)",
  "payment_date": "date (required)",
  "payment_mode": "enum: cash | cheque | bank_transfer | online | dd",
  "reference_number": "string (optional)",
  "fee_assignment_ids": ["uuid (optional, for partial payments)"],
  "remarks": "string (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "receipt_number": "string",
    "amount": "decimal",
    "payment_date": "date",
    "payment_mode": "string",
    "student": {
      "id": "uuid",
      "name": "string",
      "admission_number": "string"
    },
    "fee_details": [
      {
        "fee_type": "string",
        "amount_paid": "decimal"
      }
    ],
    "balance_due": "decimal",
    "received_by": "string"
  }
}
```

#### 3.10.3 GET /fees/reports/collection

**Query Parameters:**
- `branch_id=uuid`
- `class_id=uuid`
- `from_date=date`
- `to_date=date`
- `payment_mode=cash|cheque|bank_transfer|online`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "date",
      "to": "date"
    },
    "total_collected": "decimal",
    "by_payment_mode": {
      "cash": "decimal",
      "cheque": "decimal",
      "bank_transfer": "decimal",
      "online": "decimal"
    },
    "by_fee_type": [
      {
        "fee_type": "string",
        "collected": "decimal"
      }
    ],
    "daily_breakdown": [
      {
        "date": "date",
        "amount": "decimal",
        "transaction_count": "integer"
      }
    ]
  }
}
```

---

### 3.11 Examination APIs

**Base Path:** `/api/v1/exams`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/` | Create exam | 🏫 | `exam:create` |
| `GET` | `/` | List exams | 🔐 | `exam:read` |
| `GET` | `/:id` | Get exam details | 🔐 | `exam:read` |
| `PATCH` | `/:id` | Update exam | 🏫 | `exam:update` |
| `DELETE` | `/:id` | Delete exam | 🏫 | `exam:delete` |
| `POST` | `/:id/schedule` | Create exam schedule | 🏫 | `exam:update` |
| `GET` | `/:id/schedule` | Get exam schedule | 🔐 | `exam:read` |
| `PATCH` | `/:id/schedule/:scheduleId` | Update schedule | 🏫 | `exam:update` |
| `POST` | `/:id/results` | Enter results (bulk) | 👨‍🏫 | `exam:results` |
| `GET` | `/:id/results` | Get exam results | 🔐 | `exam:read` |
| `PATCH` | `/:id/results/:resultId` | Update result | 👨‍🏫 | `exam:results` |
| `POST` | `/:id/publish` | Publish results | 🏫 | `exam:publish` |

#### Grade Scales

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/grade-scales` | Create grade scale | 🏢 | `exam:create` |
| `GET` | `/grade-scales` | List grade scales | 🔐 | `exam:read` |
| `PATCH` | `/grade-scales/:id` | Update grade scale | 🏢 | `exam:update` |

#### Report Cards

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `GET` | `/report-cards/students/:studentId` | Get student report cards | 🔐 | `exam:read` |
| `GET` | `/report-cards/:id` | Get report card | 🔐 | `exam:read` |
| `POST` | `/report-cards/generate` | Generate report cards | 🏫 | `exam:generate` |
| `GET` | `/report-cards/:id/download` | Download report card PDF | 🔐 | `exam:read` |

#### 3.11.1 POST /exams

**Request:**
```json
{
  "name": "string (required)",
  "code": "string (required)",
  "academic_year_id": "uuid (required)",
  "branch_id": "uuid (required)",
  "exam_type": "enum: unit_test | mid_term | final | practical | assignment",
  "class_ids": ["uuid (required)"],
  "start_date": "date (required)",
  "end_date": "date (required)",
  "max_marks": "integer (required)",
  "passing_marks": "integer (required)",
  "grade_scale_id": "uuid (optional)",
  "weightage": "decimal (optional, for GPA calculation)"
}
```

#### 3.11.2 POST /exams/:id/results

**Request:**
```json
{
  "subject_id": "uuid (required)",
  "class_id": "uuid (required)",
  "section_id": "uuid (required)",
  "results": [
    {
      "student_id": "uuid (required)",
      "marks_obtained": "decimal (required)",
      "is_absent": "boolean (default: false)",
      "remarks": "string (optional)"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "exam_id": "uuid",
    "subject": "string",
    "class": "string",
    "section": "string",
    "total_students": 45,
    "results_entered": 45,
    "highest_marks": 98,
    "lowest_marks": 35,
    "average_marks": 72.5,
    "pass_count": 42,
    "fail_count": 3
  }
}
```

---

### 3.12 Timetable APIs

**Base Path:** `/api/v1/timetables`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/` | Create timetable | 🏫 | `timetable:create` |
| `GET` | `/` | List timetables | 🔐 | `timetable:read` |
| `GET` | `/:id` | Get timetable | 🔐 | `timetable:read` |
| `PATCH` | `/:id` | Update timetable | 🏫 | `timetable:update` |
| `DELETE` | `/:id` | Delete timetable | 🏫 | `timetable:delete` |
| `GET` | `/classes/:classId` | Get class timetable | 🔐 | `timetable:read` |
| `GET` | `/teachers/:teacherId` | Get teacher timetable | 🔐 | `timetable:read` |
| `POST` | `/validate` | Validate for conflicts | 🏫 | `timetable:read` |

#### Periods

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/periods` | Create period | 🏫 | `timetable:create` |
| `GET` | `/periods` | List periods | 🔐 | `timetable:read` |
| `PATCH` | `/periods/:id` | Update period | 🏫 | `timetable:update` |
| `DELETE` | `/periods/:id` | Delete period | 🏫 | `timetable:delete` |

#### Teacher Assignments

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/assignments` | Assign teacher to subject-class | 🏫 | `timetable:create` |
| `GET` | `/assignments` | List assignments | 🔐 | `timetable:read` |
| `DELETE` | `/assignments/:id` | Remove assignment | 🏫 | `timetable:delete` |

#### 3.12.1 POST /timetables/periods

**Request:**
```json
{
  "branch_id": "uuid (required)",
  "name": "string (required, e.g., 'Period 1')",
  "start_time": "time (required)",
  "end_time": "time (required)",
  "type": "enum: class | break | lunch | assembly",
  "display_order": "integer (required)"
}
```

#### 3.12.2 POST /timetables

**Request:**
```json
{
  "academic_year_id": "uuid (required)",
  "class_id": "uuid (required)",
  "section_id": "uuid (required)",
  "effective_from": "date (required)",
  "entries": [
    {
      "day": "enum: monday | tuesday | wednesday | thursday | friday | saturday",
      "period_id": "uuid (required)",
      "subject_id": "uuid (required)",
      "teacher_id": "uuid (required)",
      "room": "string (optional)"
    }
  ]
}
```

#### 3.12.3 POST /timetables/validate

**Request:**
```json
{
  "entries": [
    {
      "day": "string",
      "period_id": "uuid",
      "teacher_id": "uuid",
      "room": "string"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "is_valid": false,
    "conflicts": [
      {
        "type": "teacher_conflict",
        "day": "monday",
        "period": "Period 3",
        "teacher": "John Doe",
        "message": "Teacher already assigned to Grade 9A during this period"
      },
      {
        "type": "room_conflict",
        "day": "tuesday",
        "period": "Period 5",
        "room": "Lab 1",
        "message": "Room already occupied by Grade 10B"
      }
    ]
  }
}
```

---

### 3.13 Communication APIs

**Base Path:** `/api/v1/communications`

#### Announcements

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/announcements` | Create announcement | 🏫 | `communication:create` |
| `GET` | `/announcements` | List announcements | 🔐 | `communication:read` |
| `GET` | `/announcements/:id` | Get announcement | 🔐 | `communication:read` |
| `PATCH` | `/announcements/:id` | Update announcement | 🏫 | `communication:update` |
| `DELETE` | `/announcements/:id` | Delete announcement | 🏫 | `communication:delete` |
| `POST` | `/announcements/:id/publish` | Publish announcement | 🏫 | `communication:publish` |

#### Circulars

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/circulars` | Create circular | 🏫 | `communication:create` |
| `GET` | `/circulars` | List circulars | 🔐 | `communication:read` |
| `GET` | `/circulars/:id` | Get circular | 🔐 | `communication:read` |
| `PATCH` | `/circulars/:id` | Update circular | 🏫 | `communication:update` |
| `DELETE` | `/circulars/:id` | Delete circular | 🏫 | `communication:delete` |

#### Notifications

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/notifications/dispatch` | Dispatch notifications | 🏫 | `communication:send` |
| `GET` | `/notifications` | List notifications | 🔐 | `communication:read` |
| `GET` | `/notifications/logs` | Get dispatch logs | 🏫 | `communication:read` |

#### 3.13.1 POST /communications/announcements

**Request:**
```json
{
  "title": "string (required)",
  "content": "string (required)",
  "priority": "enum: low | normal | high | urgent",
  "target_type": "enum: all | branch | class | section | individual",
  "target_ids": ["uuid (based on target_type)"],
  "target_roles": ["enum: all | teachers | parents | students"],
  "valid_from": "datetime (optional)",
  "valid_until": "datetime (optional)",
  "attachments": ["url strings"],
  "publish_immediately": "boolean (default: false)"
}
```

#### 3.13.2 POST /communications/notifications/dispatch

**Request:**
```json
{
  "type": "enum: email | sms | both",
  "template_id": "uuid (optional)",
  "subject": "string (required for email)",
  "content": "string (required)",
  "recipients": {
    "type": "enum: all | branch | class | section | individual",
    "ids": ["uuid"],
    "roles": ["string"]
  },
  "schedule_at": "datetime (optional)"
}
```

---

### 3.14 Transport APIs

**Base Path:** `/api/v1/transport`

#### Routes

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/routes` | Create route | 🏫 | `transport:create` |
| `GET` | `/routes` | List routes | 🔐 | `transport:read` |
| `GET` | `/routes/:id` | Get route details | 🔐 | `transport:read` |
| `PATCH` | `/routes/:id` | Update route | 🏫 | `transport:update` |
| `DELETE` | `/routes/:id` | Delete route | 🏫 | `transport:delete` |
| `GET` | `/routes/:id/students` | List students on route | 🔐 | `transport:read` |
| `GET` | `/routes/:id/stops` | List stops | 🔐 | `transport:read` |
| `POST` | `/routes/:id/stops` | Add stop | 🏫 | `transport:update` |
| `PATCH` | `/routes/:id/stops/:stopId` | Update stop | 🏫 | `transport:update` |
| `DELETE` | `/routes/:id/stops/:stopId` | Delete stop | 🏫 | `transport:update` |

#### Vehicles

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/vehicles` | Add vehicle | 🏫 | `transport:create` |
| `GET` | `/vehicles` | List vehicles | 🔐 | `transport:read` |
| `GET` | `/vehicles/:id` | Get vehicle details | 🔐 | `transport:read` |
| `PATCH` | `/vehicles/:id` | Update vehicle | 🏫 | `transport:update` |
| `DELETE` | `/vehicles/:id` | Remove vehicle | 🏫 | `transport:delete` |

#### Student Transport

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/students/:studentId/assign` | Assign student to route | 🏫 | `transport:assign` |
| `GET` | `/students/:studentId` | Get student transport | 🔐 | `transport:read` |
| `DELETE` | `/students/:studentId/assign` | Remove from route | 🏫 | `transport:assign` |

#### 3.14.1 POST /transport/routes

**Request:**
```json
{
  "name": "string (required)",
  "code": "string (required)",
  "branch_id": "uuid (required)",
  "vehicle_id": "uuid (required)",
  "driver_id": "uuid (required)",
  "helper_id": "uuid (optional)",
  "type": "enum: pickup | drop | both",
  "start_time": "time (required)",
  "end_time": "time (required)",
  "stops": [
    {
      "name": "string (required)",
      "address": "string (required)",
      "arrival_time": "time (required)",
      "sequence": "integer (required)"
    }
  ]
}
```

#### 3.14.2 POST /transport/students/:studentId/assign

**Request:**
```json
{
  "route_id": "uuid (required)",
  "stop_id": "uuid (required)",
  "type": "enum: pickup | drop | both",
  "effective_from": "date (required)"
}
```

---

### 3.15 Library APIs

**Base Path:** `/api/v1/library`

#### Books

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/books` | Add book | 🏫 | `library:create` |
| `GET` | `/books` | List books | 🔐 | `library:read` |
| `GET` | `/books/:id` | Get book details | 🔐 | `library:read` |
| `PATCH` | `/books/:id` | Update book | 🏫 | `library:update` |
| `DELETE` | `/books/:id` | Remove book | 🏫 | `library:delete` |
| `POST` | `/books/:id/issue` | Issue book | 🏫 | `library:issue` |
| `POST` | `/books/:id/return` | Return book | 🏫 | `library:return` |
| `GET` | `/books/:id/history` | Get issue history | 🏫 | `library:read` |

#### Categories

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `POST` | `/categories` | Create category | 🏫 | `library:create` |
| `GET` | `/categories` | List categories | 🔐 | `library:read` |
| `PATCH` | `/categories/:id` | Update category | 🏫 | `library:update` |

#### Member History

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `GET` | `/members/:memberId/history` | Get borrowing history | 🔐 | `library:read` |
| `GET` | `/members/:memberId/current` | Get current issues | 🔐 | `library:read` |
| `GET` | `/members/:memberId/fines` | Get pending fines | 🔐 | `library:read` |
| `POST` | `/members/:memberId/fines/:fineId/pay` | Pay fine | 🏫 | `library:fine` |

#### 3.15.1 POST /library/books

**Request:**
```json
{
  "title": "string (required)",
  "isbn": "string (optional)",
  "authors": ["string (required)"],
  "publisher": "string (optional)",
  "publication_year": "integer (optional)",
  "category_id": "uuid (required)",
  "branch_id": "uuid (required)",
  "total_copies": "integer (required)",
  "shelf_location": "string (optional)",
  "description": "string (optional)"
}
```

#### 3.15.2 POST /library/books/:id/issue

**Request:**
```json
{
  "member_id": "uuid (required)",
  "member_type": "enum: student | staff",
  "issue_date": "date (required)",
  "due_date": "date (required)",
  "remarks": "string (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "issue_id": "uuid",
    "book": {
      "id": "uuid",
      "title": "string"
    },
    "member": {
      "id": "uuid",
      "name": "string",
      "type": "string"
    },
    "issue_date": "date",
    "due_date": "date",
    "issued_by": "string"
  }
}
```

#### 3.15.3 POST /library/books/:id/return

**Request:**
```json
{
  "issue_id": "uuid (required)",
  "return_date": "date (required)",
  "condition": "enum: good | damaged | lost",
  "remarks": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "issue_id": "uuid",
    "return_date": "date",
    "days_overdue": 0,
    "fine_amount": 0,
    "condition": "good"
  }
}
```

---

### 3.16 Audit APIs

**Base Path:** `/api/v1/audit`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `GET` | `/logs` | List audit logs | 🏢 | `audit:read` |
| `GET` | `/logs/:id` | Get log details | 🏢 | `audit:read` |
| `GET` | `/logs/user/:userId` | Get user's activity | 🏢 | `audit:read` |
| `GET` | `/logs/entity/:type/:id` | Get entity history | 🏢 | `audit:read` |
| `GET` | `/reports/activity` | Activity report | 🏢 | `audit:read` |
| `GET` | `/reports/changes` | Data changes report | 🏢 | `audit:read` |
| `GET` | `/reports/login` | Login report | 🏢 | `audit:read` |

#### 3.16.1 GET /audit/logs

**Query Parameters:**
- `filter[action]=create|update|delete|login|logout`
- `filter[entity_type]=student|user|fee|attendance`
- `filter[user_id]=uuid`
- `filter[branch_id]=uuid`
- `filter[from_date]=datetime`
- `filter[to_date]=datetime`
- `sort=-created_at`
- `page=1&limit=50`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "update",
      "entity_type": "student",
      "entity_id": "uuid",
      "user": {
        "id": "uuid",
        "name": "string",
        "email": "string"
      },
      "branch": {
        "id": "uuid",
        "name": "string"
      },
      "changes": {
        "first_name": {
          "old": "John",
          "new": "Jonathan"
        }
      },
      "ip_address": "string",
      "user_agent": "string",
      "created_at": "datetime"
    }
  ],
  "meta": { ... }
}
```

#### 3.16.2 GET /audit/logs/entity/:type/:id

**Response (200):**
```json
{
  "success": true,
  "data": {
    "entity_type": "student",
    "entity_id": "uuid",
    "created_at": "datetime",
    "created_by": "string",
    "history": [
      {
        "action": "create",
        "user": "string",
        "timestamp": "datetime",
        "changes": { ... }
      },
      {
        "action": "update",
        "user": "string",
        "timestamp": "datetime",
        "changes": { ... }
      }
    ]
  }
}
```

---

### 3.17 Reporting APIs

**Base Path:** `/api/v1/reports`

| Method | Endpoint | Purpose | Auth | Permission |
|--------|----------|---------|------|------------|
| `GET` | `/templates` | List report templates | 🔐 | `report:read` |
| `GET` | `/templates/:id` | Get template details | 🔐 | `report:read` |
| `POST` | `/generate` | Generate report | 🔐 | `report:generate` |
| `GET` | `/` | List generated reports | 🔐 | `report:read` |
| `GET` | `/:id` | Get report details | 🔐 | `report:read` |
| `GET` | `/:id/download` | Download report | 🔐 | `report:export` |
| `POST` | `/schedule` | Schedule report | 🏫 | `report:schedule` |
| `GET` | `/schedules` | List scheduled reports | 🏫 | `report:read` |
| `DELETE` | `/schedules/:id` | Cancel scheduled report | 🏫 | `report:schedule` |

#### 3.17.1 GET /reports/templates

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Student Attendance Report",
      "code": "ATTENDANCE_STUDENT",
      "category": "attendance",
      "description": "Individual student attendance summary",
      "parameters": [
        {
          "name": "student_id",
          "type": "uuid",
          "required": true
        },
        {
          "name": "from_date",
          "type": "date",
          "required": true
        },
        {
          "name": "to_date",
          "type": "date",
          "required": true
        }
      ],
      "formats": ["pdf", "csv", "excel"]
    }
  ]
}
```

#### 3.17.2 POST /reports/generate

**Request:**
```json
{
  "template_id": "uuid (required)",
  "parameters": {
    "student_id": "uuid",
    "from_date": "date",
    "to_date": "date"
  },
  "format": "enum: pdf | csv | excel (default: pdf)",
  "async": "boolean (default: false for small reports)"
}
```

**Response (201) - Sync:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "template": "string",
    "status": "completed",
    "format": "pdf",
    "download_url": "string (temporary URL)",
    "expires_at": "datetime",
    "generated_at": "datetime"
  }
}
```

**Response (202) - Async:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "template": "string",
    "status": "processing",
    "estimated_completion": "datetime"
  }
}
```

#### 3.17.3 POST /reports/schedule

**Request:**
```json
{
  "template_id": "uuid (required)",
  "parameters": { ... },
  "format": "enum: pdf | csv | excel",
  "schedule": {
    "frequency": "enum: daily | weekly | monthly",
    "day_of_week": "integer (0-6, for weekly)",
    "day_of_month": "integer (1-28, for monthly)",
    "time": "time (required)"
  },
  "recipients": ["email addresses"],
  "enabled": "boolean (default: true)"
}
```

---

## 4. API Versioning & Deprecation

### 4.1 Versioning Strategy

| Aspect | Policy |
|--------|--------|
| **Versioning Scheme** | URL-based: `/api/v1/...`, `/api/v2/...` |
| **Version Lifecycle** | Minimum 12 months support after deprecation |
| **Current Version** | `v1` |

### 4.2 Breaking Changes (Require New Version)

- Removing endpoints
- Removing required fields from responses
- Adding required fields to requests
- Changing field types
- Changing authentication method
- Changing error response structure

### 4.3 Non-Breaking Changes (Same Version)

- Adding optional request fields
- Adding response fields
- Adding new endpoints
- Adding new enum values
- Relaxing validation rules

### 4.4 Deprecation Process

1. **Announcement**: 6 months before deprecation
2. **Deprecation Header**: `X-API-Deprecated: true`
3. **Sunset Header**: `Sunset: <date>`
4. **Documentation**: Clear migration guide
5. **Removal**: After sunset date

### 4.5 Deprecation Response Headers

```
X-API-Deprecated: true
X-API-Deprecation-Date: 2026-06-01
X-API-Sunset-Date: 2026-12-01
X-API-Successor: /api/v2/resource
```

---

## 5. Rate Limiting

### 5.1 Limits by Tier

| Tier | Requests/Minute | Requests/Hour |
|------|-----------------|---------------|
| **Free** | 60 | 1,000 |
| **Standard** | 300 | 10,000 |
| **Premium** | 1,000 | 50,000 |
| **Enterprise** | Custom | Custom |

### 5.2 Rate Limit Headers

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1640995200
```

### 5.3 Rate Limit Exceeded Response

**Status:** `429 Too Many Requests`

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Rate limit exceeded. Retry after 60 seconds.",
      "retry_after": 60
    }
  ]
}
```

---

## 6. Webhook Events (Future v2)

Reserved for future implementation:

| Event | Trigger |
|-------|---------|
| `student.created` | New student registered |
| `student.enrolled` | Student enrolled in class |
| `fee.payment.received` | Payment recorded |
| `fee.due.reminder` | Fee due date approaching |
| `attendance.marked` | Attendance marked for class |
| `exam.results.published` | Results published |

---

## 7. Document Sign-Off

| Role | Status |
|------|--------|
| Principal Backend Architect | ✅ Approved |
| API Design Lead | ⏳ Pending |
| Security Lead | ⏳ Pending |
| Frontend Lead | ⏳ Pending |

---

**This document is the authoritative API contract. All backend and frontend implementations must adhere to these specifications.**
