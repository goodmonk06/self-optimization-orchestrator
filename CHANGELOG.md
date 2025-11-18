# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased - Phase 3]

### Added

#### Domain Model Expansion
- **New Entities**: Added 10+ new entities to support rich functionality
  - `AnalysisSchedule`: Cron-based scheduling for automated analysis
  - `Tag` and `RepoTag`: Tagging system for repository organization
  - `NotificationRule` and `Notification`: Configurable notification system
  - `SuggestionTemplate`: Reusable analysis prompt templates
  - `AnalysisMetrics`: Detailed metrics tracking per analysis
  - `HealthSnapshot`: Historical health score tracking
  - `SystemEvent`: Event logging for audit trails

#### Enhanced Existing Entities
- `RepoRecord`: Added `priority`, `isArchived`, `configJson` fields
- `AnalysisRun`: Added `templateId`, `triggeredBy` fields
- `CreatedAction`: Added `status`, `completedAt` for tracking

#### Extension Points & Adapters
- **INotificationAdapter**: Pluggable notification delivery system
  - `WebhookNotificationAdapter`: HTTP webhook notifications
  - `ConsoleNotificationAdapter`: Development logging
  - `NoOpNotificationAdapter`: Disabled notifications
- **IMetricsAdapter**: Pluggable metrics collection
  - `InMemoryMetricsAdapter`: Development/testing metrics
  - `ConsoleMetricsAdapter`: Log-based metrics
  - `PrometheusMetricsAdapter`: Prometheus integration (stub)
- **IAnalyzerAdapter**: Pluggable LLM providers
  - `OpenAIAnalyzerAdapter`: GPT-4 analysis
  - `ClaudeAnalyzerAdapter`: Anthropic Claude (stub)
  - `MockAnalyzerAdapter`: Testing adapter

#### Infrastructure
- **Event System**: Domain event bus for cross-service communication
  - 15+ typed domain events
  - Async event handling
  - Correlation ID support
- **Structured Logging**: Contextual logging with `logger` utility
  - Log levels: debug, info, warn, error
  - Correlation ID tracking
  - Child loggers with context
- **Metrics Collection**: Comprehensive metrics facade
  - Counter, gauge, histogram, timing metrics
  - Function timing utilities
  - Pluggable backends

#### API Endpoints
- **Tag Management** (`/api/tags`)
  - `GET /api/tags` - List all tags with repo counts
  - `POST /api/tags` - Create new tag
  - `PATCH /api/tags/:id` - Update tag
  - `DELETE /api/tags/:id` - Delete tag
  - `POST /api/repos/:repoId/tags` - Assign tags to repo
  - `GET /api/tags/:tagId/repos` - Get repos by tag

#### Documentation
- `docs/PHASE3_OVERVIEW.md`: Comprehensive Phase 3 plan and roadmap
- Detailed purpose statement and current state analysis
- Domain expansion strategy
- Extension points architecture
- Success metrics and timeline

### Changed

#### Breaking Changes
None yet - all changes are additive.

#### Database Schema
- **Migration Required**: New tables and columns require database migration
- Run `npm run db:push` or `npm run db:migrate` to apply schema changes

## [1.0.0 - Phase 2] - 2024-01-XX

### Added

#### Complete Vertical Slice
- Full CRUD operations for `RepoRecord`
  - Create, Read, Update, Delete repositories
  - Pagination and filtering on list endpoint
  - Search by repository name
- End-to-end analysis workflow
  - GitHub → Queue → Worker → LLM → Database → Dashboard

#### Validation & Error Handling
- **Zod Validation**: Type-safe request validation
  - `CreateRepoSchema`, `UpdateRepoSchema`
  - `PaginationSchema`, `RepoFilterSchema`
  - `RepoIdSchema`, `AnalysisIdSchema`
- **Centralized Error Handling**
  - Custom error classes: `AppError`, `NotFoundError`, `ValidationError`, `ConflictError`, `BadRequestError`, `InternalError`
  - Consistent API error responses
  - Async handler wrapper for routes

#### Testing Infrastructure
- **Vitest** configuration
- Validation schema tests (`backend/src/__tests__/validation.test.ts`)
- Error handling tests (`backend/src/__tests__/errors.test.ts`)
- Test coverage: validation layer and error classes

#### Docker & Deployment
- **Multi-stage Dockerfile** for production builds
- **docker-compose.yml** with full stack:
  - PostgreSQL database
  - Redis queue
  - Backend API service
  - Worker service
- Network isolation and health checks
- Environment configuration templates

#### Seed Data
- **Rich demo data** (`backend/src/seed.ts`)
  - 5 sample repositories (React, TypeScript, Next.js, Node.js, Prisma)
  - 3 analysis runs with different statuses
  - Sample suggestions and created actions
  - Realistic demo scenarios

#### Scripts & DX
- Standardized root-level scripts:
  - `dev`, `dev:backend`, `dev:worker`, `dev:dashboard`
  - `build`, `build:backend`, `build:dashboard`
  - `test`, `test:watch`, `lint`
  - `db:migrate`, `db:push`, `db:generate`, `db:studio`, `db:seed`
  - `docker:up`, `docker:down`, `docker:logs`, `docker:build`
  - `setup` - First-time initialization script

#### Documentation
- **Comprehensive README** with Phase 2 structure
  - Complete overview and tech stack
  - Domain model with entity relationships
  - Detailed getting started guide
  - Example flows with curl commands
  - API reference table
  - Testing guide
  - Deployment options
  - Troubleshooting section
  - Future extensions roadmap
- **SETUP.md**: Quick start guide
- **CONTRIBUTING.md**: Contribution guidelines

#### API Improvements
- Reorganized routes into separate modules:
  - `backend/src/routes/repos.ts` - Repository CRUD and actions
  - `backend/src/routes/analysis.ts` - Analysis endpoints
- Enhanced route handlers with validation
- Consistent success/error response format
- Added `/health` endpoint with version info

### Changed

#### Database Schema
- Initial Prisma schema with 3 core entities
- Indexed fields for query performance

#### Backend Structure
- Separated route handlers from main app file
- Created `backend/src/errors.ts` for error handling
- Created `backend/src/validation.ts` for Zod schemas

## [0.1.0 - Initial] - 2024-01-XX

### Added

- Initial project scaffolding
- Basic domain model: RepoRecord, AnalysisRun, CreatedAction
- GitHub API integration via Octokit
- OpenAI GPT-4 integration for analysis
- BullMQ queue system with Redis
- Fastify REST API
- Next.js dashboard
- Docker Compose for infrastructure
- Basic seed data
- Initial README

### Features

- Repository discovery from GitHub
- Manual analysis triggering
- AI-powered health scoring and suggestions
- Automated GitHub issue creation
- Real-time queue statistics
- Dashboard for monitoring

---

## Migration Guide

### Phase 2 → Phase 3

**Database Changes:**
```bash
# Backup your database first!
npm run db:push  # Apply new schema

# Or create a proper migration:
npm run db:migrate
```

**Breaking Changes:**
- None - all changes are additive

**New Environment Variables:**
- No new required variables
- Optional: `LOG_LEVEL` (debug|info|warn|error)

**Recommended Actions:**
1. Update database schema
2. Review new adapter interfaces for extensibility
3. Consider using structured logging
4. Explore new tagging system for repository organization

### Future Breaking Changes

Phase 4+ may include:
- Authentication/authorization system
- Multi-tenancy with organization isolation
- API versioning (e.g., `/v2/api/...`)
- Webhook signature verification
