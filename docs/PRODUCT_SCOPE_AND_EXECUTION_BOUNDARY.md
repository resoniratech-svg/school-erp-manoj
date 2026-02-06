# Product Scope & Execution Boundary Document

**Document ID:** SCHOOL-ERP-SCOPE-v1.0  
**Status:** APPROVED FOR ARCHITECTURE  
**Last Updated:** 2026-01-14  
**Owner:** Principal Software Architect  
**Stakeholders:** Engineering, Product, Sales, Customer Success  

---

## 1. Product Vision

Build a **production-grade, multi-tenant, multi-branch School ERP** that enables educational institutions with multiple campuses to manage all operational, academic, and administrative workflows through a unified, API-first platform.

---

## 2. Target Customers

| Segment | Description |
|---------|-------------|
| **Primary** | K-12 school chains with 2-50 branches |
| **Secondary** | Single-campus private schools planning expansion |
| **Tertiary** | Education management companies operating multiple brands |

### Customer Profile
- Schools with 500-10,000+ students across branches
- Require centralized reporting with branch-level autonomy
- Need role-based access across organizational hierarchy
- Compliance requirements for local education boards

---

## 3. Core Value Proposition

| Value | Description |
|-------|-------------|
| **Multi-Tenancy** | Complete data isolation per organization with shared infrastructure |
| **Multi-Branch** | Hierarchical branch management with cross-branch reporting |
| **API-First** | Every feature accessible via documented REST APIs |
| **Role-Based Access** | Granular permissions at org, branch, and feature level |
| **Audit Trail** | Complete traceability for compliance and governance |

---

## 4. Scope Freeze — v1 Features

### 4.1 P0 Features (Must-Have for Launch)

| Module | Features |
|--------|----------|
| **Tenant Management** | Organization onboarding, branch creation, branch hierarchy, tenant-level configuration |
| **User Management** | User CRUD, role assignment, multi-branch user access, password management, session management |
| **Role & Permission Engine** | Predefined roles (Super Admin, Branch Admin, Teacher, Accountant, Parent, Student), custom role creation, feature-level permissions |
| **Student Management** | Student registration, enrollment, class/section assignment, student profile, transfer between branches, student status lifecycle |
| **Academic Structure** | Academic year setup, class/grade configuration, section management, subject mapping, curriculum assignment |
| **Attendance** | Daily attendance marking, attendance reports, attendance summary by student/class/branch |
| **Fee Management** | Fee structure definition, fee assignment to students, payment recording, receipt generation, due/overdue tracking, branch-wise fee reports |
| **Staff Management** | Staff onboarding, designation management, department assignment, staff-branch mapping |
| **Authentication & Authorization** | JWT-based auth, refresh tokens, permission middleware, API key management for integrations |
| **Audit Logging** | Action logging, user activity tracking, data change history |

### 4.2 P1 Features (Required for Competitive Parity)

| Module | Features |
|--------|----------|
| **Examination** | Exam scheduling, grade/mark entry, report card generation, GPA/percentage calculation |
| **Timetable** | Period configuration, teacher-subject-class mapping, timetable generation, conflict detection |
| **Communication** | Announcements (org/branch/class level), notification dispatch (email/SMS hooks), circular management |
| **Transport** | Route definition, vehicle management, student-route assignment, driver/helper assignment |
| **Library** | Book catalog, issue/return tracking, fine calculation, inventory management |
| **Basic Reporting** | Pre-built reports for attendance, fees, academics; export to CSV/PDF |

---

## 5. Explicitly OUT-OF-SCOPE for v1

| Category | Excluded Items |
|----------|----------------|
| **Integrations** | Payment gateway integration, SMS/Email provider integration, government portal sync, ERP/accounting software sync |
| **Advanced Analytics** | Predictive analytics, ML-based insights, custom dashboard builder |
| **Mobile Applications** | Native iOS/Android apps, push notifications |
| **Real-Time Features** | Live class streaming, real-time chat, WebSocket-based updates |
| **Advanced HR** | Payroll processing, leave management workflows, performance appraisal |
| **Inventory & Procurement** | Non-library inventory, vendor management, purchase orders |
| **Hostel Management** | Room allocation, mess management, hostel fee tracking |
| **Alumni Management** | Alumni database, alumni portal, fundraising |
| **Custom Forms** | Dynamic form builder, custom data collection |
| **Localization** | Multi-language support, regional calendar systems |
| **White-Labeling** | Custom branding per tenant, custom domain mapping |
| **Offline Mode** | Offline data sync, PWA capabilities |

---

## 6. Non-Goals (Intentional Exclusions)

These are strategic decisions, not resource constraints:

| Non-Goal | Rationale |
|----------|-----------|
| **Not a Learning Management System (LMS)** | We will not build course content delivery, video hosting, or assignment submission workflows. Partner/integrate with LMS providers instead. |
| **Not a Communication Platform** | We provide notification hooks, not a full messaging system. Schools use WhatsApp/dedicated apps. |
| **Not a Payment Processor** | We record payments; we do not process them. Integration layer for v2+. |
| **Not Government Compliance Automation** | We store data; we do not auto-file government reports. API exports enable compliance. |
| **Not a Parent Engagement App** | API-first means parent apps can be built on top; we don't ship one in v1. |

---

## 7. Deal-Winning Features vs Later Enhancements

### 7.1 Deal-Winning Features (v1 — Non-Negotiable)

| Feature | Sales Impact |
|---------|--------------|
| Multi-branch with centralized control | Primary buying trigger for school chains |
| Role-based access with branch isolation | Mandatory for operational security |
| Fee management with due tracking | Direct revenue impact for schools |
| Student lifecycle management | Core operational workflow |
| Examination & report cards | Parent-facing deliverable every term |
| Comprehensive audit trail | Compliance requirement for premium schools |
| API access for custom integrations | Differentiator for tech-savvy buyers |

### 7.2 Later Enhancements (v2+)

| Feature | Planned Phase |
|---------|---------------|
| Payment gateway integration | v2 |
| Mobile apps (Parent, Teacher, Admin) | v2 |
| Advanced analytics dashboard | v2 |
| HR & Payroll | v2 |
| Hostel management | v3 |
| Custom form builder | v3 |
| Multi-language support | v3 |
| White-label / custom branding | v3 |

---

## 8. Why Backend-First & API-First is Mandatory

### 8.1 Business Rationale

| Reason | Explanation |
|--------|-------------|
| **Multiple Frontend Consumers** | Web app, future mobile apps, third-party integrations, and school's existing systems will all consume the same APIs |
| **Faster Parallel Development** | Frontend and backend teams work independently once API contracts are defined |
| **Integration Revenue** | Schools pay premium for API access to connect with their accounting, HR, and government systems |
| **Future-Proofing** | Frontend frameworks change; well-designed APIs remain stable for years |

### 8.2 Technical Rationale

| Reason | Explanation |
|--------|-------------|
| **Testability** | APIs can be fully tested without UI; enables comprehensive automated testing |
| **Documentation** | OpenAPI/Swagger specs become the single source of truth |
| **Security Boundary** | All business logic enforced at API layer; frontends cannot bypass rules |
| **Scalability** | API servers scale independently of frontend; enables CDN for static assets |
| **Multi-Tenancy Enforcement** | Tenant isolation enforced at API middleware level, not scattered across UI code |

### 8.3 Execution Mandate

1. **No feature is complete without its API**
2. **API contracts must be reviewed before implementation**
3. **All business rules live in backend services**
4. **Frontend is a consumer, not an authority**
5. **Database access only through API layer — no direct DB calls from frontend**

---

## 9. Document Usage

| Use Case | Action |
|----------|--------|
| Feature request received | Check against Section 4 (In-Scope) and Section 5 (Out-of-Scope) |
| Architecture decision | Must align with Section 8 (Backend-First mandate) |
| Sprint planning | Only P0/P1 features from Section 4 enter backlog |
| Sales demo scoping | Reference Section 7.1 for deal-winning features |
| Scope creep detected | Cite this document as the hard gate |

---

## 10. Approval & Sign-Off

| Role | Status |
|------|--------|
| Principal Architect | ✅ Approved |
| Engineering Lead | ⏳ Pending |
| Product Owner | ⏳ Pending |
| Sales Lead | ⏳ Pending |

---

**This document is the authoritative reference for all architecture decisions and development work. Any deviation requires formal amendment with stakeholder approval.**
