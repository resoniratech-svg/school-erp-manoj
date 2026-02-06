# School ERP API

Production-grade backend API for the School ERP system.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter @school-erp/database db:generate

# Run database migrations
pnpm --filter @school-erp/database db:migrate

# Seed the database
pnpm --filter @school-erp/database db:seed
```

### Environment Variables

Create a `.env` file in the `apps/api` directory:

```env
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://user:password@localhost:5432/school_erp
LOG_LEVEL=info
CORS_ORIGINS=*
API_VERSION=1.0.0
SERVICE_NAME=school-erp-api
```

### Running the Server

```bash
# Development mode with hot reload
pnpm --filter @school-erp/api dev

# Production build
pnpm --filter @school-erp/api build
pnpm --filter @school-erp/api start
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check with service info |
| GET | `/api/v1/health/ready` | Readiness probe |
| GET | `/api/v1/health/live` | Liveness probe |

### Project Structure

```
apps/api/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── server.ts           # HTTP server bootstrap
│   ├── main.ts             # Application entry point
│   ├── config/
│   │   ├── env.ts          # Environment validation
│   │   └── index.ts
│   ├── middleware/
│   │   ├── request-id.ts   # Request ID middleware
│   │   └── logger.ts       # Request logging middleware
│   ├── routes/
│   │   ├── health.routes.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── logger.ts       # Logging utility
│   │   └── shutdown.ts     # Graceful shutdown handler
│   └── types/
│       └── express.d.ts    # Express type extensions
├── tests/
├── package.json
└── tsconfig.json
```

### Testing

```bash
# Run tests
pnpm --filter @school-erp/api test

# Run tests in watch mode
pnpm --filter @school-erp/api test:watch
```

## Features

- **Environment Validation**: Zod-based environment variable validation
- **Request Logging**: Structured request/response logging
- **Request ID Tracking**: UUID-based request tracing
- **Graceful Shutdown**: Clean shutdown on SIGTERM/SIGINT
- **Security**: Helmet, CORS, rate limiting ready
- **Health Checks**: Kubernetes-compatible health endpoints
