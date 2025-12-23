import { Hono } from 'hono';
import { Database } from '../models/database';
import { AIService } from '../services/ai';
import { LatexGenerator } from '../services/latex';
import type { Env, ProjectConfig } from '../types';

const generation = new Hono<{ Bindings: Env }>();

// Start content generation
generation.post('/projects/:id/generate', async (c) => {
  const projectId = c.req.param('id');
  const db = new Database(c.env.DB);

  const project = await db.getProject(projectId);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // Update project status
  await db.updateProject(projectId, { status: 'generating' });

  // Get outlines
  const outlines = await db.getOutlinesByProject(projectId);
  if (outlines.length === 0) {
    return c.json({ error: 'No outline items found' }, 400);
  }

  // Parse project config
  const config: ProjectConfig = JSON.parse(project.config);

  // Initialize AI service
  const aiService = new AIService(c.env);

  // Log task start
  await db.createTaskLog({
    project_id: projectId,
    role: 'coordinator',
    action: 'generation_started',
    content: `Starting generation for ${outlines.length} outline items`,
    metadata: JSON.stringify({ outlineCount: outlines.length }),
  });

  // Generate content for each outline item
  // Note: In production, this should be handled by a queue/background job
  try {
    for (const outline of outlines) {
      const context = {
        outline: outlines,
        latexHeader: project.latex_header || '',
        difficulty: config.difficulty,
        writingStyle: config.writingStyle,
        customCommands: config.customCommands,
      };

      const response = await aiService.generateChapterContent(outline, context);

      // Save generated content
      await db.createChapterContent(
        outline.id,
        response.content,
        response.exercises ? JSON.stringify(response.exercises) : undefined
      );

      // Mark outline as generated
      await db.updateOutline(outline.id, { content_generated: 1 });

      // Log progress
      await db.createTaskLog({
        project_id: projectId,
        role: 'writer',
        action: 'content_generated',
        content: `Generated content for: ${outline.title}`,
        metadata: JSON.stringify({ outlineId: outline.id }),
      });
    }

    // Update project status
    await db.updateProject(projectId, { status: 'completed' });

    return c.json({ message: 'Content generation completed successfully' });
  } catch (error) {
    console.error('Generation error:', error);

    // Update project status
    await db.updateProject(projectId, { status: 'error' });

    // Log error
    await db.createTaskLog({
      project_id: projectId,
      role: 'coordinator',
      action: 'generation_error',
      content: error instanceof Error ? error.message : 'Unknown error',
      metadata: null,
    });

    return c.json({ error: 'Content generation failed' }, 500);
  }
});

// Get generated content for an outline item
generation.get('/content/:outlineId', async (c) => {
  const outlineId = c.req.param('outlineId');
  const db = new Database(c.env.DB);

  const content = await db.getChapterContent(outlineId);
  if (!content) {
    return c.json({ error: 'Content not found' }, 404);
  }

  return c.json(content);
});

// Export LaTeX
generation.get('/projects/:id/export/latex', async (c) => {
  const projectId = c.req.param('id');
  const db = new Database(c.env.DB);

  const project = await db.getProject(projectId);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const outlines = await db.getOutlinesByProject(projectId);
  const latexGen = new LatexGenerator();

  // Get all contents
  const contents = await Promise.all(
    outlines.map((outline) => db.getChapterContent(outline.id))
  );

  const latex = latexGen.generateDocument(
    project,
    outlines,
    contents.filter((c) => c !== null) as any[]
  );

  return new Response(latex, {
    headers: {
      'Content-Type': 'application/x-latex',
      'Content-Disposition': `attachment; filename="${project.title}.tex"`,
    },
  });
});

// Export PDF (requires LaTeX compilation - placeholder)
generation.get('/projects/:id/export/pdf', async (c) => {
  return c.json({
    error: 'PDF 导出需要 LaTeX 编译器',
    message: '请先下载 TEX 文件，然后使用以下方法之一编译为 PDF：\n' +
      '1. 使用本地 LaTeX 编译器（pdflatex、xelatex 或 lualatex）\n' +
      '2. 使用在线 LaTeX 编辑器（如 Overleaf.com）\n' +
      '3. 使用 LaTeX Workshop（VS Code 扩展）',
    recommendation: '推荐使用 xelatex 或 lualatex 以获得更好的中文支持'
  }, 501);
});

export default generation;
