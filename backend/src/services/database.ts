import { D1Database } from '@cloudflare/workers-types';

/**
 * Database initialization service
 * Automatically creates tables and indexes if they don't exist
 */
export class DatabaseService {
  private db: D1Database;
  private initialized = false;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Initialize database schema
   * Creates all tables, indexes, and triggers if they don't exist
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🔧 Initializing database schema...');

      // Execute all schema creation statements
      await this.db.batch([
        // Projects table
        this.db.prepare(`
          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            latex_header TEXT,
            config TEXT,
            status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'generating', 'completed', 'error')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `),

        // Outlines table
        this.db.prepare(`
          CREATE TABLE IF NOT EXISTS outlines (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            parent_id TEXT,
            title TEXT NOT NULL,
            level TEXT NOT NULL CHECK(level IN ('chapter', 'section', 'subsection')),
            sort_order INTEGER NOT NULL DEFAULT 0,
            content_generated INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES outlines(id) ON DELETE CASCADE
          )
        `),

        // Chapter contents table
        this.db.prepare(`
          CREATE TABLE IF NOT EXISTS chapter_contents (
            id TEXT PRIMARY KEY,
            outline_id TEXT NOT NULL,
            content TEXT,
            exercises TEXT,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'generating', 'completed', 'error')),
            word_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (outline_id) REFERENCES outlines(id) ON DELETE CASCADE
          )
        `),

        // Task logs table
        this.db.prepare(`
          CREATE TABLE IF NOT EXISTS task_logs (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            role TEXT,
            action TEXT NOT NULL,
            content TEXT,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
          )
        `),

        // Indexes
        this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_outlines_project_id ON outlines(project_id)`),
        this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_outlines_parent_id ON outlines(parent_id)`),
        this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_outlines_sort_order ON outlines(project_id, sort_order)`),
        this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_chapter_contents_outline_id ON chapter_contents(outline_id)`),
        this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_task_logs_project_id ON task_logs(project_id)`),
        this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at)`),
      ]);

      // Create triggers (must be done separately as D1 doesn't support triggers in batch)
      await this.createTriggers();

      this.initialized = true;
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw new Error(`Failed to initialize database: ${error}`);
    }
  }

  /**
   * Create triggers for automatic timestamp updates
   */
  private async createTriggers(): Promise<void> {
    try {
      // Note: D1 may not support triggers yet, so we wrap this in try-catch
      await this.db.prepare(`
        CREATE TRIGGER IF NOT EXISTS update_projects_timestamp
        AFTER UPDATE ON projects
        BEGIN
          UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `).run();

      await this.db.prepare(`
        CREATE TRIGGER IF NOT EXISTS update_outlines_timestamp
        AFTER UPDATE ON outlines
        BEGIN
          UPDATE outlines SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `).run();

      await this.db.prepare(`
        CREATE TRIGGER IF NOT EXISTS update_chapter_contents_timestamp
        AFTER UPDATE ON chapter_contents
        BEGIN
          UPDATE chapter_contents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `).run();
    } catch (error) {
      // Triggers might not be supported in D1 yet, log but don't fail
      console.warn('⚠️ Triggers not supported or failed to create:', error);
    }
  }

  /**
   * Check if database is initialized
   */
  async checkHealth(): Promise<{ healthy: boolean; tables: string[] }> {
    try {
      const result = await this.db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all();

      const tables = result.results?.map((row: any) => row.name) || [];
      const requiredTables = ['projects', 'outlines', 'chapter_contents', 'task_logs'];
      const healthy = requiredTables.every(table => tables.includes(table));

      return { healthy, tables };
    } catch (error) {
      console.error('Database health check failed:', error);
      return { healthy: false, tables: [] };
    }
  }
}
