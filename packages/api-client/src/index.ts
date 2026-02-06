/**
 * School ERP API Client SDK
 * Typed, centralized API client for all frontend applications
 */

// Core
export { apiClient } from './core/axios';
export { setAccessToken, getAccessToken, clearAccessToken } from './core/auth.interceptor';
export { normalizeError } from './core/error.handler';

// Types
export * from './types/api-error';
export * from './types/api-response';
export * from './types/pagination';

// Module Clients
export { authClient } from './auth/auth.client';
export type { LoginCredentials, LoginResponse, User, Session } from './auth/auth.client';

export { academicClient } from './academic/academic.client';
export type { AcademicYear, Class, Section, Subject } from './academic/academic.client';

export { timetableClient } from './timetable/timetable.client';
export type { TimetableSlot, TimetableView } from './timetable/timetable.client';

export { attendanceClient } from './attendance/attendance.client';
export type { AttendanceRecord, AttendanceSummary } from './attendance/attendance.client';

export { examsClient } from './exams/exams.client';
export type { Exam, ExamSchedule, Grade } from './exams/exams.client';

export { reportsClient } from './reports/reports.client';
export type { ReportCard, AttendanceReport, FeeReport } from './reports/reports.client';

export { feesClient } from './fees/fees.client';
export type { FeeStructure, FeeAssignment, Payment } from './fees/fees.client';

export { transportClient } from './transport/transport.client';
export type { Route, Vehicle, TransportAssignment } from './transport/transport.client';

export { libraryClient } from './library/library.client';
export type { Book, BookIssue } from './library/library.client';

export { communicationClient } from './communication/communication.client';
export type { Announcement, Message, Notification } from './communication/communication.client';

export { notificationDeliveryClient } from './notification-delivery/delivery.client';
export type { DeliveryRecord } from './notification-delivery/delivery.client';

export { filesClient } from './files/files.client';
export type { FileAsset, SignedUrlResponse } from './files/files.client';

export { auditClient } from './audit/audit.client';
export type { AuditLog } from './audit/audit.client';

export { configClient } from './config/config.client';
export type { ConfigEntry } from './config/config.client';

export { rateLimitClient } from './rate-limit/rate-limit.client';
export type { RateLimitRule, RateLimitStatus } from './rate-limit/rate-limit.client';

export { jobsClient } from './jobs/jobs.client';
export type { Job, WorkerStatus } from './jobs/jobs.client';

export { observabilityClient } from './observability/observability.client';
export type { HealthStatus, ReadinessStatus, SystemStatus } from './observability/observability.client';

export { usersClient, rolesClient } from './users/users.client';
export type { User as UserDetails, CreateUserInput, UpdateUserInput, UserRole, UserBranch, Role, CreateRoleInput, Permission } from './users/users.client';

export { subscriptionClient } from './subscription/subscription.client';
export type { Plan, Subscription, ChangePlanInput } from './subscription/subscription.client';

export { billingClient } from './billing/billing.client';
export type { CreateOrderResponse, PaymentRecord } from './billing/billing.client';

export { usageClient } from './usage/usage.client';
export type { UsageSummary, UsageWithLimit, UsageSummaryResponse, UsageMetricResponse } from './usage/usage.client';

export { invoiceClient } from './invoicing/invoicing.client';
export type { Invoice, InvoiceItem, InvoiceTax, GenerateInvoiceInput } from './invoicing/invoicing.client';

export { creditNoteClient } from './credit-notes/credit-notes.client';
export type { CreditNote, CreditNoteItem, CreditNoteTax, CreateCreditNoteInput } from './credit-notes/credit-notes.client';

export { accountingClient } from './accounting/accounting.client';
export type { GSTSummary, InvoiceRegisterItem, RevenueSummary, ReceivableItem } from './accounting/accounting.client';




