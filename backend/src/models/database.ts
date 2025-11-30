import { nanoid } from 'nanoid';
import type { Env, Project, Outline, ChapterContent, TaskLog, ProjectConfig } from '../types';

export class Database {
  constructor(private db: D1Database) {}

  // Projects
  async createProject(
    title: string,
    latexHeader?: string,
    config?: ProjectConfig
  ): Promise<Project> {
    const id = nanoid();
    const configStr = JSON.stringify(config || {
      difficulty: 'undergraduate',
      writingStyle: 'academic',
      customCommands: ['\\ex', '\\sol'],
      language: 'zh',
    });

    const result = await this.db
      .prepare(
        'INSERT INTO projects (id, title, latex_header, config) VALUES (?, ?, ?, ?)'
      )
      .bind(id, title, latexHeader || null, configStr)
      .run();

    return this.getProject(id) as Promise<Project>;
  }

  async getProject(id: string): Promise<Project | null> {
    const result = await this.db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .bind(id)
      .first<Project>();

    return result;
  }

  async listProjects(): Promise<Project[]> {
    const result = await this.db
      .prepare('SELECT * FROM projects ORDER BY updated_at DESC')
      .all<Project>();

    return result.results || [];
  }

  async updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await this.db
      .prepare(`UPDATE projects SET ${fields} WHERE id = ?`)
      .bind(...values, id)
      .run();
  }

  async deleteProject(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
  }

  // Outlines
  async createOutline(outline: Omit<Outline, 'id' | 'created_at' | 'updated_at'>): Promise<Outline> {
    const id = nanoid();

    await this.db
      .prepare(
        'INSERT INTO outlines (id, project_id, parent_id, title, level, sort_order, content_generated) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        id,
        outline.project_id,
        outline.parent_id || null,
        outline.title,
        outline.level,
        outline.sort_order,
        outline.content_generated || 0
      )
      .run();

    return this.getOutline(id) as Promise<Outline>;
  }

  async getOutline(id: string): Promise<Outline | null> {
    const result = await this.db
      .prepare('SELECT * FROM outlines WHERE id = ?')
      .bind(id)
      .first<Outline>();

    return result;
  }

  async getOutlinesByProject(projectId: string): Promise<Outline[]> {
    const result = await this.db
      .prepare('SELECT * FROM outlines WHERE project_id = ? ORDER BY sort_order')
      .bind(projectId)
      .all<Outline>();

    return result.results || [];
  }

  async updateOutline(
    id: string,
    updates: Partial<Omit<Outline, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await this.db
      .prepare(`UPDATE outlines SET ${fields} WHERE id = ?`)
      .bind(...values, id)
      .run();
  }

  async deleteOutline(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM outlines WHERE id = ?').bind(id).run();
  }

  // Chapter Contents
  async createChapterContent(
    outlineId: string,
    content: string,
    exercises?: string
  ): Promise<ChapterContent> {
    const id = nanoid();
    const wordCount = content.split(/\s+/).length;

    await this.db
      .prepare(
        'INSERT INTO chapter_contents (id, outline_id, content, exercises, status, word_count) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(id, outlineId, content, exercises || null, 'completed', wordCount)
      .run();

    return this.getChapterContent(outlineId) as Promise<ChapterContent>;
  }

  async getChapterContent(outlineId: string): Promise<ChapterContent | null> {
    const result = await this.db
      .prepare('SELECT * FROM chapter_contents WHERE outline_id = ?')
      .bind(outlineId)
      .first<ChapterContent>();

    return result;
  }

  async updateChapterContent(
    id: string,
    updates: Partial<Omit<ChapterContent, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await this.db
      .prepare(`UPDATE chapter_contents SET ${fields} WHERE id = ?`)
      .bind(...values, id)
      .run();
  }

  // Task Logs
  async createTaskLog(log: Omit<TaskLog, 'id' | 'created_at'>): Promise<void> {
    const id = nanoid();

    await this.db
      .prepare(
        'INSERT INTO task_logs (id, project_id, role, action, content, metadata) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(
        id,
        log.project_id,
        log.role,
        log.action,
        log.content || null,
        log.metadata || null
      )
      .run();
  }

  async getTaskLogs(projectId: string, limit = 100): Promise<TaskLog[]> {
    const result = await this.db
      .prepare(
        'SELECT * FROM task_logs WHERE project_id = ? ORDER BY created_at DESC LIMIT ?'
      )
      .bind(projectId, limit)
      .all<TaskLog>();

    return result.results || [];
  }
}
