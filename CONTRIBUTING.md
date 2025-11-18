# Contributing to Self-Optimization Orchestrator

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Follow the [SETUP.md](./SETUP.md) guide
3. Create a new branch for your feature: `git checkout -b feature/your-feature-name`

## Project Structure

```
self-optimization-orchestrator/
├── backend/               # Fastify API and worker
│   ├── prisma/           # Database schema and migrations
│   └── src/              # TypeScript source code
├── dashboard/            # Next.js frontend
│   └── src/
│       └── app/          # Next.js app router pages
└── docker-compose.yml    # PostgreSQL and Redis services
```

## Code Style

- Use TypeScript for all code
- Follow existing code formatting
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

## Making Changes

### Backend Changes

1. Update types in `backend/src/types.ts` if needed
2. Add tests if applicable
3. Run the backend: `npm run dev:backend`
4. Test your changes

### Frontend Changes

1. Follow React best practices
2. Use Tailwind CSS for styling
3. Keep components focused
4. Run the dashboard: `npm run dev:dashboard`

### Database Changes

1. Modify `backend/prisma/schema.prisma`
2. Create migration: `cd backend && npx prisma migrate dev --name your_change`
3. Update TypeScript types accordingly

## Testing

Before submitting:

1. Test the full flow:
   - Discover repositories
   - Analyze a repository
   - View results in dashboard

2. Check for errors in all three services (API, worker, dashboard)

3. Verify queue processing works correctly

## Pull Request Process

1. Update documentation if needed (README.md, SETUP.md)
2. Add a clear description of your changes
3. Reference any related issues
4. Ensure all services start without errors
5. Wait for review

## Feature Ideas

Some areas where contributions would be welcome:

- **Analysis improvements**: Add more repository health checks
- **Notifications**: Slack, Discord, email notifications
- **Scheduling**: Cron-based automatic analysis
- **Metrics**: Track improvement trends over time
- **Testing**: Add unit and integration tests
- **Docker**: Production-ready Dockerfile
- **Documentation**: Improve guides and examples

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase
- Suggestions for improvements

## Code of Conduct

Be respectful, constructive, and collaborative. We're all here to build something useful together.
