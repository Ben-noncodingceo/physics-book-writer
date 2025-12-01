import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import projects from './routes/projects';
import generation from './routes/generation';
import { DatabaseService } from './services/database';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// Database initialization state (persisted across requests in the same isolate)
let dbInitialized = false;

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Database initialization middleware
app.use('*', async (c, next) => {
  if (!dbInitialized) {
    try {
      const dbService = new DatabaseService(c.env.DB);
      await dbService.initialize();
      dbInitialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Continue anyway - the error will be caught in specific routes
    }
  }
  await next();
});

// Health check with database status
app.get('/', async (c) => {
  const dbService = new DatabaseService(c.env.DB);
  const dbHealth = await dbService.checkHealth();

  return c.json({
    name: 'AI LaTeX Book Generator API',
    version: '2.0.0',
    status: 'ok',
    database: {
      healthy: dbHealth.healthy,
      tables: dbHealth.tables,
    },
  });
});

// Routes
app.route('/api/projects', projects);
app.route('/api', generation);

// Error handling
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      error: err.message || 'Internal server error',
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
