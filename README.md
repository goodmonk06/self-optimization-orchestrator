# Self-Optimization Orchestrator

An automated GitHub repository health analyzer and improvement orchestrator that sits on top of all your repositories and keeps them evolving.

## Overview

The Self-Optimization Orchestrator periodically scans your GitHub organization or user account, analyzes each repository's health, generates AI-powered improvement suggestions, and optionally creates GitHub issues for those improvements.

This system runs continuously in the background, ensuring your repositories stay up-to-date with best practices for testing, documentation, security, performance, and code quality.

## Architecture

The system consists of three main components:

1. **Backend API** (Fastify + TypeScript)
   - RESTful API for managing repositories and analyses
   - Repository discovery from GitHub
   - Queue management for analysis jobs
   - Integration with OpenAI for intelligent suggestions

2. **Worker Process** (BullMQ)
   - Processes analysis jobs asynchronously
   - Fetches repository data from GitHub
   - Analyzes code health using LLM
   - Optionally creates GitHub issues

3. **Dashboard** (Next.js)
   - View all repositories and their health scores
   - Trigger analyses manually
   - View detailed analysis results
   - Monitor queue statistics

## Tech Stack

- **Backend**: Fastify, TypeScript, Prisma, PostgreSQL
- **Queue**: BullMQ, Redis
- **APIs**: GitHub REST API, OpenAI API
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Infrastructure**: Docker Compose

## Features

### 1. Repository Discovery
- Automatically fetch all repositories from your GitHub account
- Sync repository metadata
- Track when repositories were last analyzed

### 2. Health Analysis
- Analyze repository health across multiple dimensions:
  - Test coverage (presence of test files)
  - CI/CD configuration
  - Open issues count
  - Last commit date
  - Programming languages
  - Documentation
- Generate health scores (0-100)

### 3. AI-Powered Suggestions
- Use OpenAI GPT-4 to generate intelligent improvement suggestions
- Prioritize suggestions (low, medium, high)
- Categorize improvements (testing, documentation, security, performance, etc.)
- Generate ready-to-use GitHub issue bodies

### 4. Action Execution
- Automatically create GitHub issues for improvements
- Track created actions (issues, PR drafts, documentation)
- Link actions back to analysis runs

### 5. Dashboard
- View all repositories with their latest analysis
- See health scores and suggestions
- Trigger analyses manually
- Monitor queue statistics in real-time

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL and Redis)
- GitHub Personal Access Token
- OpenAI API Key

### Installation

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
   docker-compose up -d
   ```

4. **Configure environment variables**

   Backend (`backend/.env`):
   ```bash
   cp backend/.env.example backend/.env
   ```

   Edit `backend/.env` and set:
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token
   - `GITHUB_ORG_OR_USER`: Your GitHub username or organization
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `AUTO_CREATE_ISSUES`: Set to `true` to automatically create GitHub issues

   Dashboard (`dashboard/.env.local`):
   ```bash
   cp dashboard/.env.example dashboard/.env.local
   ```

5. **Set up the database**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   cd ..
   ```

6. **Start the services**

   Terminal 1 - Backend API:
   ```bash
   npm run dev:backend
   ```

   Terminal 2 - Worker:
   ```bash
   cd backend
   npm run worker
   ```

   Terminal 3 - Dashboard:
   ```bash
   npm run dev:dashboard
   ```

### Usage

1. **Access the dashboard**: Open http://localhost:3000

2. **Discover repositories**: Click "Discover Repos" to sync repositories from GitHub

3. **Analyze repositories**:
   - Click "Analyze All" to queue all repositories for analysis
   - Or click "Analyze" on individual repositories

4. **View results**: Once analysis completes, view:
   - Health scores
   - Improvement suggestions
   - Created GitHub issues (if enabled)

## API Endpoints

### Repositories

- `GET /api/repos` - List all repositories
- `GET /api/repos/:id` - Get repository details
- `POST /api/repos/discover` - Discover and sync repositories from GitHub
- `POST /api/repos/:id/analyze` - Queue analysis for a repository
- `POST /api/repos/analyze-all` - Queue analysis for all repositories

### Analysis

- `GET /api/analysis/:id` - Get analysis details

### Queue

- `GET /api/queue/stats` - Get queue statistics

### Health

- `GET /health` - Health check endpoint

## Database Schema

### RepoRecord
- Stores repository metadata
- Tracks last analysis time
- Links to analysis runs

### AnalysisRun
- Represents a single analysis execution
- Stores analysis status, summary, and suggestions
- Links to created actions

### CreatedAction
- Tracks actions taken (issues created, etc.)
- Stores GitHub URLs and payloads

## Configuration

### Environment Variables

**Backend:**
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `GITHUB_TOKEN`: GitHub Personal Access Token (required)
- `GITHUB_ORG_OR_USER`: GitHub username or organization (required)
- `OPENAI_API_KEY`: OpenAI API key (required)
- `PORT`: API server port (default: 3001)
- `AUTO_CREATE_ISSUES`: Auto-create GitHub issues (default: false)

**Dashboard:**
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3001)

### GitHub Token Permissions

Your GitHub token needs the following scopes:
- `repo` (full control of private repositories)
- `read:org` (read organization data)

### OpenAI Model

The system uses `gpt-4-turbo-preview` by default. You can change this in `backend/src/llm-service.ts`.

## Production Deployment

### Backend

1. Build the backend:
   ```bash
   cd backend
   npm run build
   ```

2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

3. Start the API server:
   ```bash
   npm start
   ```

4. Start the worker:
   ```bash
   npm run worker
   ```

### Dashboard

1. Build the dashboard:
   ```bash
   cd dashboard
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

### Docker

A production `Dockerfile` can be added for containerized deployment.

## Monitoring

- **Queue Stats**: Real-time queue statistics in the dashboard
- **Logs**: Server and worker logs in the console
- **Database**: Use Prisma Studio to inspect data: `npm run db:studio`

## Customization

### Analysis Criteria

Modify `backend/src/llm-service.ts` to customize:
- Analysis prompt
- Suggestion categories
- Health score calculation

### GitHub Client

Extend `backend/src/github-client.ts` to:
- Add more repository checks
- Fetch additional metadata
- Customize issue creation

### Worker Concurrency

Adjust worker settings in `backend/src/worker.ts`:
- Concurrency (parallel jobs)
- Rate limits
- Retry strategies

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `docker-compose ps`
- Check `DATABASE_URL` in `.env`

### Redis Connection Issues
- Ensure Redis is running: `docker-compose ps`
- Check Redis host/port configuration

### GitHub API Rate Limits
- The system respects GitHub API rate limits
- Use a token with higher limits if needed
- Adjust worker concurrency to reduce API calls

### OpenAI API Errors
- Check API key validity
- Monitor usage limits
- Adjust model selection if needed

## Development

### Database Changes

1. Modify `backend/prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name your_migration_name`
3. Generate client: `npx prisma generate`

### Adding New Analysis Checks

1. Update `RepoData` interface in `backend/src/types.ts`
2. Add check logic in `backend/src/github-client.ts`
3. Update LLM prompt in `backend/src/llm-service.ts`

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Philosophy

This orchestrator embodies the principle of continuous improvement. Rather than letting repositories stagnate, it actively monitors and suggests improvements, ensuring your entire codebase evolves with best practices.

The system is designed to be:
- **Proactive**: Automatically discovers and analyzes repositories
- **Intelligent**: Uses AI to provide contextual, actionable suggestions
- **Non-intrusive**: Suggestions are optional; you control when to act
- **Scalable**: Handles multiple repositories efficiently
- **Transparent**: Full visibility into analyses and actions

## Future Enhancements

Potential future features:
- Scheduled cron-based analysis
- Slack/Discord notifications
- Custom analysis rules
- Integration with code quality tools (ESLint, SonarQube)
- Automated PR creation (not just issues)
- Team collaboration features
- Analytics and trends over time
