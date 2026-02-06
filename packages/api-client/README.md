# @school-erp/api-client

Typed Web API Client SDK for School ERP system.

## Installation

```bash
npm install @school-erp/api-client
# or
pnpm add @school-erp/api-client
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Usage

### Authentication

```typescript
import { authClient, setAccessToken } from '@school-erp/api-client';

// Login
const { accessToken, user } = await authClient.login({
  email: 'admin@school.com',
  password: 'password',
});

// Token is automatically stored and attached to requests

// Get current user
const me = await authClient.me();

// Logout
await authClient.logout();
```

### Module Clients

```typescript
import { 
  academicClient,
  feesClient,
  attendanceClient,
  configClient 
} from '@school-erp/api-client';

// Academic
const years = await academicClient.years.list();
const activeYear = await academicClient.years.getActive();
await academicClient.classes.create({ name: '10-A', grade: 10, branchId, academicYearId });

// Fees
const structures = await feesClient.structures.list();
await feesClient.assignments.bulkAssign({ feeStructureId, studentIds: ['...'] });
const defaulters = await feesClient.reports.defaulters();

// Attendance
await attendanceClient.bulkMark({
  classId,
  sectionId,
  date: '2024-01-15',
  records: [{ studentId: '...', status: 'present' }]
});

// Config / Feature Flags
const isEnabled = await configClient.isFeatureEnabled('fees');
const limit = await configClient.getLimit('limits.maxStudents');
```

### Error Handling

```typescript
import { isApiError, ERROR_CODES } from '@school-erp/api-client';

try {
  await authClient.login(credentials);
} catch (error) {
  if (isApiError(error)) {
    switch (error.code) {
      case ERROR_CODES.AUTH_INVALID_CREDENTIALS:
        // Handle invalid credentials
        break;
      case ERROR_CODES.RATE_LIMIT_EXCEEDED:
        // Handle rate limit
        break;
      default:
        console.error(error.message);
    }
  }
}
```

### Auth Flow

1. **Login**: Calls `/api/v1/auth/login`, stores access token in memory
2. **Requests**: Token automatically attached via Authorization header
3. **Token Expiry**: On 401 with `TOKEN_EXPIRED`, auto-refresh via `/api/v1/auth/refresh`
4. **Refresh Failure**: Clears token, throws `AUTH_SESSION_EXPIRED`
5. **Logout**: Calls `/api/v1/auth/logout`, clears token

### SSR Usage (Next.js App Router)

```typescript
// In Server Components
import { academicClient, setAccessToken } from '@school-erp/api-client';
import { cookies } from 'next/headers';

export default async function Page() {
  // Set token from cookie for server-side requests
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (token) setAccessToken(token);

  const years = await academicClient.years.list();
  return <div>{/* render */}</div>;
}
```

## Available Clients

| Client | Description |
|--------|-------------|
| `authClient` | Authentication, sessions |
| `academicClient` | Years, classes, sections, subjects |
| `timetableClient` | Timetable slots |
| `attendanceClient` | Mark & view attendance |
| `examsClient` | Exams, schedules, grades |
| `reportsClient` | Report cards, exports |
| `feesClient` | Structures, assignments, payments |
| `transportClient` | Routes, vehicles |
| `libraryClient` | Books, issues |
| `communicationClient` | Announcements, messages |
| `notificationDeliveryClient` | Delivery tracking |
| `filesClient` | Upload, download |
| `auditClient` | Audit logs |
| `configClient` | Configuration, feature flags |
| `rateLimitClient` | Rate limit rules |
| `jobsClient` | Background jobs |
| `observabilityClient` | Health, metrics |

## Features

- ✅ TypeScript with strict types
- ✅ Automatic token refresh
- ✅ Request retries (GET only)
- ✅ Error normalization
- ✅ Request ID tracing
- ✅ SSR compatible
- ✅ No React dependencies
