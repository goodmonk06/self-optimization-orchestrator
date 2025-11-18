# Quick Setup Guide

This guide will get you up and running in 5 minutes.

## Step 1: Prerequisites

Install these if you don't have them:
- Node.js 18+ ([Download](https://nodejs.org/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop/))

## Step 2: Get API Keys

### GitHub Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:org`
4. Copy the token

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key

## Step 3: Install

```bash
# Clone the repository
git clone <repository-url>
cd self-optimization-orchestrator

# Install dependencies
npm install

# Start Docker services (PostgreSQL + Redis)
docker-compose up -d
```

## Step 4: Configure

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and add your tokens

# Dashboard
cp dashboard/.env.example dashboard/.env.local
```

Edit `backend/.env`:
```env
GITHUB_TOKEN="ghp_your_token_here"
GITHUB_ORG_OR_USER="your_github_username"
OPENAI_API_KEY="sk-your_key_here"
AUTO_CREATE_ISSUES=false  # Set to true to auto-create issues
```

## Step 5: Setup Database

```bash
cd backend
npx prisma migrate dev
npx prisma generate
cd ..
```

## Step 6: Start Services

Open 3 terminals:

**Terminal 1 - Backend API:**
```bash
npm run dev:backend
```

**Terminal 2 - Worker:**
```bash
cd backend
npm run worker
```

**Terminal 3 - Dashboard:**
```bash
npm run dev:dashboard
```

## Step 7: Use It!

1. Open http://localhost:3000
2. Click "Discover Repos" to sync from GitHub
3. Click "Analyze All" to analyze all repos
4. Watch the magic happen!

## Verification

Check that everything is working:

- ✓ Backend API: http://localhost:3001/health
- ✓ Dashboard: http://localhost:3000
- ✓ PostgreSQL: `docker-compose ps` (should show "Up")
- ✓ Redis: `docker-compose ps` (should show "Up")

## Common Issues

**Docker not running?**
```bash
# Start Docker Desktop, then:
docker-compose up -d
```

**Database connection error?**
```bash
# Reset database
docker-compose down -v
docker-compose up -d
cd backend
npx prisma migrate dev
```

**Port already in use?**
```bash
# Change ports in:
# - backend/.env (PORT=3001)
# - docker-compose.yml (ports for PostgreSQL/Redis)
# - dashboard/.env.local (NEXT_PUBLIC_API_URL)
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Customize analysis criteria in `backend/src/llm-service.ts`
- Set `AUTO_CREATE_ISSUES=true` to automatically create GitHub issues
- Explore the API at http://localhost:3001/api/repos

## Need Help?

- Check logs in the terminal windows
- Use Prisma Studio: `npm run db:studio` (in backend folder)
- Review queue stats in the dashboard

Enjoy your self-optimizing repositories!
