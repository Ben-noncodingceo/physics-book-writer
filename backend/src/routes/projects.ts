import { Hono } from 'hono';
import { Database } from '../models/database';
import type { Env } from '../types';

const projects = new Hono<{ Bindings: Env }>();

// List all projects
projects.get('/', async (c) => {
  const db = new Database(c.env.DB);
  const projectList = await db.listProjects();

  return c.json(projectList);
});

// Get project by ID
projects.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = new Database(c.env.DB);
  const project = await db.getProject(id);

  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  return c.json(project);
});

// Create project
projects.post('/', async (c) => {
  const body = await c.req.json();
  const { title, latexHeader, config } = body;

  if (!title) {
    return c.json({ error: 'Title is required' }, 400);
  }

  const db = new Database(c.env.DB);
  const project = await db.createProject(title, latexHeader, config);

  return c.json(project, 201);
});

// Update project
projects.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const db = new Database(c.env.DB);

  const project = await db.getProject(id);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // Serialize config if it's an object
  const updates: any = { ...body };
  if (updates.config && typeof updates.config === 'object') {
    updates.config = JSON.stringify(updates.config);
  }

  await db.updateProject(id, updates);
  const updated = await db.getProject(id);

  return c.json(updated);
});

// Delete project
projects.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = new Database(c.env.DB);

  const project = await db.getProject(id);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  await db.deleteProject(id);

  return c.json({ message: 'Project deleted successfully' });
});

// Get project outline
projects.get('/:id/outline', async (c) => {
  const projectId = c.req.param('id');
  const db = new Database(c.env.DB);

  const outlines = await db.getOutlinesByProject(projectId);

  return c.json(outlines);
});

// Create outline item
projects.post('/:id/outline/items', async (c) => {
  const projectId = c.req.param('id');
  const body = await c.req.json();
  const { title, level, parentId, sortOrder } = body;

  if (!title || !level) {
    return c.json({ error: 'Title and level are required' }, 400);
  }

  const db = new Database(c.env.DB);
  const outline = await db.createOutline({
    project_id: projectId,
    parent_id: parentId || null,
    title,
    level,
    sort_order: sortOrder || 0,
    content_generated: 0,
  });

  return c.json(outline, 201);
});

// Update outline item
projects.put('/:projectId/outline/items/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const body = await c.req.json();
  const db = new Database(c.env.DB);

  const outline = await db.getOutline(itemId);
  if (!outline) {
    return c.json({ error: 'Outline item not found' }, 404);
  }

  await db.updateOutline(itemId, body);
  const updated = await db.getOutline(itemId);

  return c.json(updated);
});

// Delete outline item
projects.delete('/:projectId/outline/items/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const db = new Database(c.env.DB);

  const outline = await db.getOutline(itemId);
  if (!outline) {
    return c.json({ error: 'Outline item not found' }, 404);
  }

  await db.deleteOutline(itemId);

  return c.json({ message: 'Outline item deleted successfully' });
});

// Reorder outline items
projects.put('/:id/outline/reorder', async (c) => {
  const body = await c.req.json();
  const { updates } = body;

  if (!Array.isArray(updates)) {
    return c.json({ error: 'Updates must be an array' }, 400);
  }

  const db = new Database(c.env.DB);

  for (const update of updates) {
    const { itemId, parentId, sortOrder } = update;
    await db.updateOutline(itemId, {
      parent_id: parentId,
      sort_order: sortOrder,
    });
  }

  return c.json({ message: 'Outline reordered successfully' });
});

// Get LaTeX header
projects.get('/:id/latex-header', async (c) => {
  const id = c.req.param('id');
  const db = new Database(c.env.DB);
  const project = await db.getProject(id);

  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  return c.json({ content: project.latex_header || '' });
});

// Update LaTeX header
projects.put('/:id/latex-header', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { content } = body;

  const db = new Database(c.env.DB);
  const project = await db.getProject(id);

  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  await db.updateProject(id, { latex_header: content });

  return c.json({ message: 'LaTeX header updated successfully' });
});

// Get task logs for a project
projects.get('/:id/logs', async (c) => {
  const id = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '100');
  const db = new Database(c.env.DB);

  const project = await db.getProject(id);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const logs = await db.getTaskLogs(id, limit);

  return c.json(logs);
});

export default projects;
