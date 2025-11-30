import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import projects from './routes/projects';
import generation from './routes/generation';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

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

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'AI LaTeX Book Generator API',
    version: '2.0.0',
    status: 'ok',
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
