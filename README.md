# Self-Optimization Orchestrator

An automated GitHub repository health analyzer and improvement orchestrator that continuously monitors and improves your entire repository portfolio using AI-powered analysis.

## Overview

The Self-Optimization Orchestrator is a production-ready system designed to sit on top of all your GitHub repositories, automatically analyzing their health, and providing intelligent improvement suggestions. It acts as an autonomous maintenance layer that helps keep your entire codebase evolving with best practices.

**Current Phase: Phase 2 - Production Vertical Slice**

This implementation includes a complete, end-to-end working system with:
- Full CRUD operations for repository management
- Automated analysis workflow with AI-powered suggestions
- Queue-based background processing
- Real-time dashboard for monitoring
- Complete test coverage and validation
- Docker-based deployment

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Fastify (high-performance web framework)
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Queue**: BullMQ + Redis
- **Validation**: Zod
- **Testing**: Vitest

### External APIs
- **GitHub API**: Repository discovery and issue creation via Octokit
- **OpenAI API**: GPT-4 Turbo for intelligent analysis

### Frontend Dashboard
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Markdown**: react-markdown

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Process Management**: BullMQ workers

## Domain Model

### Core Entities

**RepoRecord**
- Represents a GitHub repository being tracked
- Fields: `id`, `githubFullName`, `lastAnalyzedAt`, `metaJson`, timestamps
- Relationships: Has many `AnalysisRun`

**AnalysisRun**
- Represents a single analysis execution for a repository
- Fields: `id`, `repoId`, `status`, `startedAt`, `finishedAt`, `summaryMarkdown`, `suggestionsJson`, `errorMessage`
- Status: `PENDING` | `IN_PROGRESS` | `COMPLETED` | `FAILED`
- Relationships: Belongs to `RepoRecord`, has many `CreatedAction`

**CreatedAction**
- Represents an action taken based on analysis (e.g., GitHub issue created)
- Fields: `id`, `runId`, `type`, `targetUrl`, `payloadJson`, `createdAt`
- Type: `ISSUE` | `PR_DRAFT` | `DOC`
- Relationships: Belongs to `AnalysisRun`

### Key Relationships
```
RepoRecord (1) ──< (N) AnalysisRun (1) ──< (N) CreatedAction
```

## Getting Started

### Requirements

- **Node.js**: 18.x or higher
- **Docker**: For PostgreSQL, Redis, and optional full-stack deployment
- **GitHub Token**: Personal access token with `repo` and `read:org` scopes
- **OpenAI API Key**: For AI-powered analysis

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd self-optimization-orchestrator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start infrastructure services**
   ```bash
   npm run docker:up
   ```
   This starts PostgreSQL and Redis.

4. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   ```

   Edit `backend/.env`:
   ```env
   # Database (use localhost for local dev, postgres for Docker)
   DATABASE_URL="postgresql://orchestrator:orchestrator_dev_pass@localhost:5432/repo_orchestrator?schema=public"

   # Redis
   REDIS_HOST="localhost"
   REDIS_PORT=6379

   # GitHub (REQUIRED)
   GITHUB_TOKEN="ghp_your_token_here"
   GITHUB_ORG_OR_USER="your_github_username"

   # OpenAI (REQUIRED)
   OPENAI_API_KEY="sk-your_key_here"

   # Server
   PORT=3001
   NODE_ENV="development"

   # Features
   AUTO_CREATE_ISSUES=false  # Set to true to auto-create GitHub issues
   ```

5. **Setup database and seed data**
   ```bash
   npm run setup
   ```
   This runs: install → generate Prisma client → push schema → seed demo data

6. **Start the application**

   You need 3 terminal windows:

   **Terminal 1 - Backend API:**
   ```bash
   npm run dev:backend
   ```

   **Terminal 2 - Analysis Worker:**
   ```bash
   npm run dev:worker
   ```

   **Terminal 3 - Dashboard (optional):**
   ```bash
   npm run dev:dashboard
   ```

7. **Verify it's working**

   - API Health: http://localhost:3001/health
   - View repos: http://localhost:3001/api/repos
   - Dashboard: http://localhost:3000 (if running)

## Example Flow: End-to-End Vertical Slice

This implementation includes a complete working vertical slice for repository management and analysis:

### 1. Repository Discovery (GitHub → Database)

**Trigger:**
```bash
curl -X POST http://localhost:3001/api/repos/discover
```

**What happens:**
- Fetches all repositories from your GitHub account
- Creates `RepoRecord` entries in the database
- Returns count of new vs existing repos

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "new": 3,
    "existing": 22
  }
}
```

### 2. Manual Repository CRUD

**Create a repository:**
```bash
curl -X POST http://localhost:3001/api/repos \
  -H "Content-Type: application/json" \
  -d '{
    "githubFullName": "myorg/myrepo",
    "metaJson": {"description": "Test repo"}
  }'
```

**List repositories (with pagination):**
```bash
curl "http://localhost:3001/api/repos?page=1&limit=10&status=analyzed"
```

**Get specific repository:**
```bash
curl http://localhost:3001/api/repos/{id}
```

**Update repository:**
```bash
curl -X PATCH http://localhost:3001/api/repos/{id} \
  -H "Content-Type: application/json" \
  -d '{"metaJson": {"stars": 100}}'
```

**Delete repository:**
```bash
curl -X DELETE http://localhost:3001/api/repos/{id}
```

### 3. Trigger Analysis (API → Queue → Worker)

**Trigger analysis for one repo:**
```bash
curl -X POST http://localhost:3001/api/repos/{id}/analyze
```

**Trigger analysis for all repos:**
```bash
curl -X POST http://localhost:3001/api/repos/analyze-all
```

**What happens:**
1. Job added to BullMQ queue
2. Worker picks up job
3. Fetches repo data from GitHub (languages, tests, CI/CD, etc.)
4. Sends data to OpenAI GPT-4 for analysis
5. Receives health score and 3 improvement suggestions
6. Stores results in `AnalysisRun`
7. Optionally creates GitHub issues via `CreatedAction`

### 4. View Results (Database → API → Dashboard)

**Get analysis results:**
```bash
curl http://localhost:3001/api/analysis/{analysisId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clh...",
    "status": "COMPLETED",
    "summaryMarkdown": "# Analysis Summary...",
    "suggestionsJson": [
      {
        "title": "Add comprehensive test coverage",
        "description": "...",
        "priority": "high",
        "category": "testing",
        "issueBody": "..."
      }
    ],
    "repo": {
      "githubFullName": "myorg/myrepo"
    },
    "createdActions": []
  }
}
```

**View in Dashboard:**
- Navigate to http://localhost:3000
- See all repos with health scores
- Click "View full analysis" for detailed results
- Monitor queue stats in real-time

### 5. Seed Data Demo

The seed script (`npm run db:seed`) creates realistic demo data:
- 5 sample repositories (React, TypeScript, Next.js, Node.js, Prisma)
- 3 analysis runs with different statuses
- Sample suggestions and actions
- Demonstrates the complete data model

**Demo URLs:**
```bash
# List all repos with demo data
http://localhost:3001/api/repos

# View completed analysis
http://localhost:3001/api/analysis/{id}  # Get ID from repos response

# Queue statistics
http://localhost:3001/api/queue/stats
```

## API Reference

### Repository Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/repos` | List repositories (paginated, filterable) |
| POST | `/api/repos` | Create new repository |
| GET | `/api/repos/:id` | Get repository by ID |
| PATCH | `/api/repos/:id` | Update repository |
| DELETE | `/api/repos/:id` | Delete repository |
| POST | `/api/repos/discover` | Sync repos from GitHub |
| POST | `/api/repos/:id/analyze` | Trigger analysis for one repo |
| POST | `/api/repos/analyze-all` | Trigger analysis for all repos |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analysis/:id` | Get analysis by ID |
| GET | `/api/repos/:repoId/analysis` | Get all analyses for a repo |
| GET | `/api/queue/stats` | Get queue statistics |

### Query Parameters

**Pagination (`/api/repos`):**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

**Filtering (`/api/repos`):**
- `status` (enum: `analyzed` | `pending` | `all`)
- `search` (string: search in repository name)

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# In backend directory
cd backend
npm test
```

### Test Coverage

Current test coverage includes:
- **Validation layer**: Zod schema validation tests
- **Error handling**: Custom error class tests
- **Domain logic**: Repository and analysis business logic

Test files:
- `backend/src/__tests__/validation.test.ts`
- `backend/src/__tests__/errors.test.ts`

## Deployment

### Docker Compose (Recommended)

Full-stack deployment with all services:

```bash
# Build and start all services
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

Services included:
- `postgres` - PostgreSQL database
- `redis` - Redis for queue
- `backend` - Fastify API server
- `worker` - BullMQ analysis worker

### Manual Deployment

**Build:**
```bash
npm run build
```

**Start production server:**
```bash
cd backend
npm start
```

**Start production worker:**
```bash
cd backend
node dist/worker.js
```

## Development

### Project Structure

```
self-optimization-orchestrator/
├── backend/
│   ├── src/
│   │   ├── routes/           # Route handlers
│   │   │   ├── repos.ts      # Repository CRUD + actions
│   │   │   └── analysis.ts   # Analysis endpoints
│   │   ├── __tests__/        # Test files
│   │   ├── config.ts         # Configuration
│   │   ├── db.ts             # Database connection
│   │   ├── errors.ts         # Error classes + handler
│   │   ├── validation.ts     # Zod schemas
│   │   ├── github-client.ts  # GitHub API client
│   │   ├── llm-service.ts    # OpenAI integration
│   │   ├── queue.ts          # BullMQ setup
│   │   ├── worker.ts         # Background worker
│   │   ├── seed.ts           # Database seeding
│   │   ├── types.ts          # TypeScript types
│   │   └── index.ts          # Fastify app entry
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── Dockerfile            # Backend Docker image
│   └── package.json
├── dashboard/
│   └── src/
│       └── app/
│           ├── page.tsx               # Home page
│           └── analysis/[id]/page.tsx # Detail page
├── docker-compose.yml        # Full-stack orchestration
├── package.json              # Root scripts
└── README.md
```

### Key Scripts

```bash
# Development
npm run dev:backend       # Start API server
npm run dev:worker        # Start analysis worker
npm run dev:dashboard     # Start Next.js dashboard

# Database
npm run db:migrate        # Run migrations
npm run db:push           # Push schema changes
npm run db:seed           # Seed demo data
npm run db:studio         # Open Prisma Studio

# Testing
npm test                  # Run tests
npm run lint              # Type checking

# Docker
npm run docker:up         # Start services
npm run docker:down       # Stop services
npm run docker:build      # Build images
npm run docker:logs       # View logs

# Production
npm run build             # Build all
npm run setup             # First-time setup
```

## Future Extensions

This Phase 2 implementation provides a solid foundation for future enhancements:

### Planned Features
- **Scheduled Analysis**: Cron-based automatic periodic analysis
- **Notifications**: Slack/Discord/Email notifications for completed analyses
- **Custom Rules**: User-defined analysis criteria and thresholds
- **Trend Analytics**: Track health scores over time
- **Automated PRs**: Not just issues, but full PR creation with fixes
- **Multi-org Support**: Analyze repositories across multiple organizations
- **Team Collaboration**: Assign suggestions to team members
- **Integration Hub**: Connect with Jira, Linear, Asana for task management
- **Advanced Metrics**: Code quality scores from ESLint, SonarQube integration
- **Cost Tracking**: Monitor OpenAI API usage and costs
- **Batch Operations**: Bulk approve/reject suggestions
- **Custom LLM Prompts**: Configurable analysis prompts per repository

### Architecture Improvements
- **Event Sourcing**: Complete audit trail of all changes
- **CQRS Pattern**: Separate read/write models for better scalability
- **GraphQL API**: Alternative to REST for more flexible querying
- **Real-time Updates**: WebSocket support for live dashboard updates
- **Multi-tenancy**: Support multiple organizations with isolation
- **Rate Limiting**: Per-user/per-org API rate limits
- **Caching Layer**: Redis caching for frequently accessed data

## Troubleshooting

### Common Issues

**Database connection error:**
```bash
# Ensure PostgreSQL is running
docker compose ps

# Check connection string in .env
cat backend/.env | grep DATABASE_URL
```

**Redis connection error:**
```bash
# Ensure Redis is running
docker compose ps

# Check Redis config
cat backend/.env | grep REDIS
```

**Worker not processing jobs:**
```bash
# Check worker is running
ps aux | grep worker

# Check queue stats
curl http://localhost:3001/api/queue/stats

# View worker logs
npm run docker:logs worker
```

**GitHub API rate limit:**
- Use authenticated token (increases limit to 5000/hour)
- Check current rate limit: https://api.github.com/rate_limit
- Reduce worker concurrency in `backend/src/worker.ts`

**OpenAI API errors:**
- Verify API key is valid
- Check usage limits: https://platform.openai.com/usage
- Monitor costs and set up billing alerts

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details

---

**Built with the philosophy of continuous improvement. Let your repositories evolve automatically.**
