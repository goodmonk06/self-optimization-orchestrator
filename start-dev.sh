#!/bin/bash

# Self-Optimization Orchestrator - Development Startup Script

echo "🚀 Starting Self-Optimization Orchestrator"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✓ Docker is running"

# Start Docker services
echo ""
echo "Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 5

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "⚠️  backend/.env not found!"
    echo "Please copy backend/.env.example to backend/.env and configure it."
    echo ""
    echo "cp backend/.env.example backend/.env"
    echo ""
    exit 1
fi

# Check if Prisma is set up
if [ ! -d "backend/node_modules/@prisma/client" ]; then
    echo ""
    echo "Setting up database..."
    cd backend
    npx prisma generate
    npx prisma migrate dev
    cd ..
fi

echo ""
echo "✓ All services are ready!"
echo ""
echo "Starting application..."
echo ""
echo "Please open these in separate terminals:"
echo ""
echo "  Terminal 1 - Backend API:"
echo "    npm run dev:backend"
echo ""
echo "  Terminal 2 - Worker:"
echo "    cd backend && npm run worker"
echo ""
echo "  Terminal 3 - Dashboard:"
echo "    npm run dev:dashboard"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
