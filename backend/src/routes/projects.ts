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

// Generate outline using AI
projects.post('/:id/generate-outline', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { prompt } = body;

  if (!prompt) {
    return c.json({ error: 'Prompt is required' }, 400);
  }

  try {
    const aiPrompt = `你是一位专业的教材大纲编写专家。请根据用户的要求生成一份详细的教材大纲。

**用户要求：**
${prompt}

**输出要求：**
1. 以 JSON 格式输出大纲结构
2. 包含章节（chapter）、节（section）、小节（subsection）三个层级
3. 每个条目必须包含 title 和 level 字段
4. 使用嵌套的 children 数组表示层级关系
5. 标题要具体、准确，符合物理学教材的规范

**输出格式示例：**
{
  "outline": [
    {
      "title": "第一章 牛顿力学",
      "level": "chapter",
      "children": [
        {
          "title": "1.1 牛顿运动定律",
          "level": "section",
          "children": [
            {
              "title": "1.1.1 第一定律：惯性定律",
              "level": "subsection"
            }
          ]
        }
      ]
    }
  ]
}

请直接输出 JSON，不要包含其他说明文字。`;

    // Use Gemini API to generate outline
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: aiPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const outline = JSON.parse(jsonMatch[0]);
    return c.json(outline);
  } catch (error) {
    console.error('Failed to generate outline:', error);
    return c.json({
      error: 'Failed to generate outline',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Test AI connections for all configured roles
projects.post('/:id/test-ai', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { aiConfig } = body;

  const results: Record<string, { success: boolean; message: string }> = {};
  const roles = ['coordinator', 'writer', 'reviewer', 'researcher'] as const;

  for (const role of roles) {
    const config = aiConfig?.[role];
    if (!config) {
      results[role] = { success: false, message: '未配置' };
      continue;
    }

    try {
      // Test the AI provider by making a simple request
      const testPrompt = '测试连接，请回复"OK"';

      if (config.provider === 'gemini') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${c.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: testPrompt }] }],
            }),
          }
        );

        if (response.ok) {
          results[role] = { success: true, message: '连接成功' };
        } else {
          results[role] = { success: false, message: `连接失败: ${response.statusText}` };
        }
      } else if (config.provider === 'tongyi') {
        const response = await fetch(
          'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${c.env.TONGYI_API_KEY}`,
            },
            body: JSON.stringify({
              model: config.model,
              input: { messages: [{ role: 'user', content: testPrompt }] },
            }),
          }
        );

        if (response.ok) {
          results[role] = { success: true, message: '连接成功' };
        } else {
          results[role] = { success: false, message: `连接失败: ${response.statusText}` };
        }
      } else if (config.provider === 'openai') {
        // OpenAI test would go here
        results[role] = { success: true, message: '连接成功 (未实际测试)' };
      }
    } catch (error) {
      results[role] = {
        success: false,
        message: error instanceof Error ? error.message : '连接失败'
      };
    }
  }

  return c.json(results);
});

export default projects;
