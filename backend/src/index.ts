import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, validateConfig } from './config';
import { connectDatabase } from './db';
import { errorHandler } from './errors';
import { repoRoutes } from './routes/repos';
import { analysisRoutes } from './routes/analysis';

// Validate configuration
validateConfig();

const app = Fastify({
  logger: {
    level: config.server.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

// Register CORS
app.register(cors, {
  origin: true,
});

// Register error handler
app.setErrorHandler(errorHandler);

// Health check endpoint
app.get('/health', async (request, reply) => {
  return {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };
});

// Register routes
app.register(repoRoutes);
app.register(analysisRoutes);

/**
 * Start the server
 */
async function start() {
  try {
    console.log('🚀 Starting Self-Optimization Orchestrator API\n');

    // Connect to database
    await connectDatabase();

    // Start server
    await app.listen({
      port: config.server.port,
      host: '0.0.0.0',
    });

    console.log(`✓ Server listening on http://localhost:${config.server.port}`);
    console.log('\nAvailable endpoints:');
    console.log('  GET    /health');
    console.log('  GET    /api/repos');
    console.log('  POST   /api/repos');
    console.log('  GET    /api/repos/:id');
    console.log('  PATCH  /api/repos/:id');
    console.log('  DELETE /api/repos/:id');
    console.log('  POST   /api/repos/discover');
    console.log('  POST   /api/repos/:id/analyze');
    console.log('  POST   /api/repos/analyze-all');
    console.log('  GET    /api/repos/:repoId/analysis');
    console.log('  GET    /api/analysis/:id');
    console.log('  GET    /api/queue/stats');
    console.log('');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nShutting down server...');
  await app.close();
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  start();
}

export default app;
