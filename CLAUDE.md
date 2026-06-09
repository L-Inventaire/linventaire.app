# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**linventaire.app** is an open-source ERP/business management platform ("The ERP co-pilot for your business — Agile. Flexible. Fast.") built with React + TypeScript frontend and Node.js + TypeScript backend. It provides comprehensive features for invoicing, CRM, inventory, accounting, and project management.

### Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, React Query, Recoil, Radix UI
- **Backend:** Node.js + TypeScript, Express (v5 beta), PostgreSQL
- **Infrastructure:** Docker Compose, AWS S3, Redis, AMQP/RabbitMQ
- **Integrations:** Sentry (error tracking), SuperPDP (e-invoicing), Documenso (signatures)

## Project Structure

```
linventaire.app/
├── frontend/              # React SPA (port 3006)
│   ├── src/
│   │   ├── atoms/         # Atomic design: smallest UI units
│   │   ├── molecules/     # Atomic design: component combinations
│   │   ├── components/    # Larger UI components
│   │   ├── features/      # Feature modules (invoices, contacts, crm, etc.)
│   │   ├── views/         # Page-level components
│   │   ├── lib/           # Frontend utilities
│   │   └── index.tsx      # React Query, Recoil, Radix Theme setup
│   └── vite.config.ts
├── backend/               # Node.js API server (port 3000)
│   ├── src/
│   │   ├── platform/      # Core services (DB, Redis, AMQP, Email, S3, Cron, Sentry)
│   │   ├── services/      # REST API, Auth, Users, Clients, Modules
│   │   │   ├── modules/   # Business logic (invoices, contacts, articles, stock, crm, etc.)
│   │   │   └── rest/      # Generic REST CRUD + search service
│   │   └── index.ts
│   ├── config/            # Configuration (default.json, custom-environment-variables.json)
│   ├── tests/             # Jest tests
│   └── package.json       # Backend deps + build scripts
├── shared/                # Shared TypeScript types and utilities
│   ├── src/
│   │   ├── consts.ts
│   │   ├── invoices.ts
│   │   ├── en16931-types.ts (e-invoicing standard)
│   │   └── types.ts
│   └── tsconfig.json
├── docker/                # Docker configurations
├── docker-compose.yml     # Development setup (node, nginx)
├── docker-compose.prod.yml
└── docker-compose.tests.yml
```

## Key Architecture Patterns

### Multi-Tenant Architecture

The system is designed for **multi-tenancy** with tight client isolation:
- Every entity has a `client_id` field for tenant separation
- Authentication maps users to clients via the `clients_users` junction table
- Permissions are role-based (68+ permission types) per client-user combination
- All database queries implicitly filter by `client_id` via context

### REST Service Pattern

The backend exposes a **generic REST API** (`/api/rest/v1`) that handles all entity CRUD operations:
- Single service handles Create, Read, Update, Delete, and Search for all tables
- Automatic full-text search with weighted relevance (French + English support)
- Soft delete with restoration
- Audit trail via the `events` table (before/after snapshots)
- Comment and notification system integrated per entity
- Custom field extensions via `fields` table (per-entity configuration)

**Key Feature:** The REST service automatically generates `display_name` and `searchable` fields for all entities, enabling rich search and UI labeling.

### Frontend State Management

- **React Query:** Server state (data fetching, caching, mutations)
- **Recoil:** Client state (UI state, filters, user preferences)
- **Composition:** Uses atomic design (atoms → molecules → components → features)

### Business Modules

Core modules are isolated in `/backend/src/services/modules/`:
- **Invoices:** Quotes, invoices, credit notes, supplier documents, recurring invoices
- **Contacts:** Company/person management with hierarchies and address management
- **Articles:** Product/service catalog with supplier pricing
- **Stock:** Inventory tracking with serial numbers, locations, and batch management
- **CRM:** Sales pipeline with kanban-style opportunity management
- **Service:** Task/project management with time tracking
- **Accounting:** Chart of accounts and financial transactions
- **E-Invoices:** SuperPDP integration for Peppol/PPF compliance
- **Notifications:** Email, SMS, activity feed, system events
- **Comments:** Activity feed and threaded commenting

## Common Commands

### Setup & Installation

```bash
# Install git hooks (checks version consistency)
./scripts/install-hooks.sh

# Install dependencies (from root, runs both frontend and backend)
yarn install
```

### Development

**Backend:**
```bash
cd backend
# Start dev server with hot reload (watches TypeScript)
yarn dev

# Run tests with watch mode
yarn dev:test

# Run specific test file
TZ=UTC JEST=1 jest src/services/modules/invoices/__tests__/invoices.test.ts --watch

# Check linting
yarn linter
```

**Frontend:**
```bash
cd frontend
# Start Vite dev server on port 3006
yarn dev

# Build for production
yarn build

# Check linting
yarn linter
```

**Shared Library:**
```bash
cd shared
# Build TypeScript (incremental)
yarn build
```

### Full Stack

```bash
# From root: build shared, then backend, then frontend
cd shared && yarn build && cd ../backend && yarn build && cd ../frontend && yarn build

# Run with Docker Compose (full stack: backend, frontend, postgres, etc.)
docker-compose up --build

# Run backend tests
cd backend && yarn test

# Check linting across all packages
yarn linter (in frontend or backend)
```

### Database & Configuration

The backend uses **node-config** with hierarchical configuration:
- `config/default.json` - Base config (DB connection, email, AWS, Redis, etc.)
- `config/custom-environment-variables.json` - Maps env vars to config paths
- Environment variables override file-based config

**For development:**
- PostgreSQL runs locally or via Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`
- Default creds: `postgres:postgres@localhost:5432`

## Data Model Highlights

### Core Entities

1. **Users** - System accounts with MFA support (email, phone, app, password)
2. **Clients** - Tenant companies with their own configuration (invoicing, payment, SMTP)
3. **Contacts** - Customers/suppliers with hierarchical relationships and multiple addresses
4. **Articles** - Products/services/consumables with supplier pricing
5. **Invoices** - Unified document type (quotes, invoices, credit notes, supplier variants) with rich state machine
6. **Stock Items** - Inventory with serial numbers, locations, and traceability
7. **CRM Items** - Sales pipeline opportunities with drag-and-drop stages
8. **Service Items** - Tasks with time tracking
9. **Comments** - Activity feed, threaded comments, system events
10. **Events** - Complete audit trail (all changes tracked with before/after)

### Search Implementation

Full-text search across all entities:
- PostgreSQL `tsvector` with accent-insensitive matching
- Weighted relevance: A > B > C > D priorities
- Multi-language support (French, English, Simple)
- Automatically indexed via `searchable_generated` computed column
- Search syntax supports: `field:value`, `field:~fuzzy`, `field:20..30`, `!field:value`, quoted phrases

Example from backend README:
```
tags:tag1,tag2 tags:tag3,tag4 jeff
type:contact first_name:jeff last_name:"some bezos" jeff
date:2020-01-01..2020-12-31 age:20..30
age:>=20 age:<=30
first_name:~jeff !type:contact
```

### Document State Machines

**Quotes Flow:**
- Draft → Sent → Accepted → Invoiced → Completed/Closed

**Invoices Flow:**
- Draft → Sent → Closed (payment status tracked separately)

**Recurring Invoices:**
- Special state "recurring" with auto-generation on schedule

## Frontend Development Notes

### Component Organization

**Atomic Design Structure:**
- `atoms/` - Buttons, inputs, badges, icons
- `molecules/` - Cards, dropdowns, form sections
- `components/` - Complex UI (tables, modals, sidebars)
- `features/` - Feature-specific pages (invoices/, contacts/, crm/, etc.)

**Path Aliases:**
- `@/*` → `src/`
- `@features/*` → `src/features/`
- `@components/*` → `src/components/`
- `@atoms/*` → `src/atoms/`
- `@molecules/*` → `src/molecules/`
- `@shared/*` → `shared/src/`

### Styling

- **Tailwind CSS** with custom theme (Inter font, custom slate colors)
- **Radix UI Themes** wrapper for consistent design system
- **Dark mode** support via `selector` strategy
- **Custom font sizes:** `xxs` (9px), `xs` (11px), `sm` (12px), `base` (13px), `lg` (15px), `xl` (24px)
- **Safelist** includes dynamic utility classes (z-index, widths, colors, gradients)

### State Management Pattern

**React Query Usage:**
```typescript
// Data fetching and caching
const { data, isLoading, error } = useQuery({
  queryKey: ['invoices', filters],
  queryFn: () => api.getInvoices(filters)
});

// Mutations
const mutation = useMutation({
  mutationFn: (data) => api.createInvoice(data),
  onSuccess: () => queryClient.invalidateQueries(['invoices'])
});
```

**Recoil Usage:**
```typescript
// Client state: filters, UI state, preferences
const filterAtom = atom({
  key: 'filters',
  default: {}
});
```

## Backend Development Notes

### Platform Services (Core Infrastructure)

All initialized in `src/platform/index.ts`:
- **Db** - PostgreSQL connection + query helpers
- **LoggerDb** - Structured logging to database
- **PushEMail** - Email sending (SMTP or SES)
- **PushTextMessage** - SMS (SNS)
- **Captcha** - reCAPTCHA validation
- **I18n** - Internationalization (French/English)
- **Redis** - Caching layer (optional)
- **Cache** - In-memory cache (falls back if no Redis)
- **Socket** - WebSocket/Socket.io for real-time updates
- **Amqp** - Message queue (RabbitMQ, optional)
- **S3** - File storage (local or AWS)
- **Cron** - Scheduled tasks
- **Lock** - Distributed locking for concurrency
- **Analytics** - Amplitude integration
- **TriggersManager** - Event-driven automation
- **EInvoices** - SuperPDP e-invoicing platform

### REST Endpoints Pattern

Generic REST API at `/api/rest/v1`:
- `GET /api/rest/v1/{table}` - Search/list with filters
- `POST /api/rest/v1/{table}` - Create
- `PUT /api/rest/v1/{table}/{id}` - Update
- `DELETE /api/rest/v1/{table}/{id}` - Delete (soft)
- `GET /api/rest/v1/{table}/{id}` - Get single

Search supports complex queries (see Search Implementation above).

### Module Structure Example

Each module follows this pattern:
```typescript
export default class InvoicesService {
  async init() { /* registration */ }
  async create(ctx, data) { /* business logic */ }
  async update(ctx, id, data) { /* business logic */ }
  async search(ctx, query) { /* business logic */ }
  // ... other operations
}
```

**Context (`ctx`):**
- Contains `client_id` (tenant), `user_id`, `req_id` (request tracing)
- Automatically filtered for multi-tenancy
- Used throughout for audit trail (`updated_by`, `created_by`)

### Email & Notifications

- **Templates:** Twig templates in `backend/assets/emails/`
- **Sending:** Via `Framework.PushEMail` service (configurable SMTP or SES)
- **Tracking:** Email events logged as comments
- **HTML:** Auto-generated from Twig templates

### E-Invoicing (SuperPDP Integration)

- Configuration stored in `e_invoicing_config` table
- OAuth 2.0 flow for authentication
- Automatic invoice sending to Peppol network
- Automatic receiving of supplier invoices
- EN16931 standard compliance
- Directory entries support (Peppol, PPF)

## Git Workflow

**Pre-commit Hook:** Enforces version consistency across `frontend/package.json` and `backend/package.json`. Fails if versions don't match.

Install hooks: `./scripts/install-hooks.sh`

## Performance Considerations

### Database

- Composite indexes for multi-tenant queries
- GIN indexes for full-text search (`searchable_generated`)
- Generated columns for computed totals
- JSONB fields for flexible schema (`fields`, `preferences`)

### Caching

- Redis for distributed caching (optional, falls back to in-memory)
- Pre-computed totals on invoices (HT, TVA, TTC)
- Cached contact information in CRM items
- Full-text search index refreshed on entity changes

### Frontend

- Code splitting: `vendor` and `ui` chunks separated in Vite build
- React Query caching with automatic invalidation
- Lazy loading via React Router (implied by views structure)

## Important Gotchas & Conventions

1. **Version Sync:** Frontend and backend versions in `package.json` must match (enforced by pre-commit hook).

2. **TypeScript Strict Mode:** Both frontend and backend use `strict: true`. Watch for type narrowing in conditional logic.

3. **Multi-Tenancy Filter:** The `client_id` filter is implicit in most queries. Don't forget to pass `ctx` which carries this information.

4. **Soft Delete:** Entities use `is_deleted` instead of hard delete. Always check this flag in queries.

5. **Search Weights:** Full-text search uses A/B/C/D weights. Entity-specific searchable field configuration matters for relevance.

6. **Revision Tracking:** The `revisions` counter increments on every update, useful for conflict detection in concurrent scenarios.

7. **Audit Trail:** All changes go to the `events` table automatically via database triggers. Never manually insert into events.

8. **Display Names:** Generated automatically for all entities. Don't assume they match the raw data.

9. **Email Configuration:** Per-client SMTP settings in `clients.smtp`. Falls back to `config/default.json` if not set.

10. **JWT Secret:** Must be set in config (default is a test value). Change in production!

## Development Environment Setup

**Prerequisites:**
- Node.js 16+
- PostgreSQL 12+
- Docker (optional, recommended)

**Quick Start with Docker:**
```bash
./scripts/install-hooks.sh
docker-compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:3000/api
```

**Without Docker:**
```bash
./scripts/install-hooks.sh
# Start PostgreSQL separately
cd backend && yarn dev
cd frontend && yarn dev
# Frontend: http://localhost:3006
# Backend: http://localhost:3000
```

## Testing

**Backend:**
- Jest configured in `backend/package.json`
- Tests in `backend/tests/` with `__mocks__/` for dependencies
- Module name mapper for imports: `#src/*` → `src/`, `@shared/*` → `../shared/dist/`
- Timezone: `TZ=UTC` for consistency
- Run: `cd backend && yarn test` or `yarn dev:test` for watch mode

**Frontend:**
- ESLint configured (no test framework visible in package.json)
- Focus on linting: `yarn linter`

## Debugging

- **Backend:** Use `yarn dev` for ts-node-dev with file watching. Logs to console and database.
- **Frontend:** Vite dev server with source maps. React Query DevTools at bottom-left of screen.
- **Sentry:** Error tracking configured (see `src/index.ts` backend and frontend)

---

**Last Updated:** June 9, 2026
