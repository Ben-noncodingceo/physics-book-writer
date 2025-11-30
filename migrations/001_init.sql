-- AI LaTeX Book Generator Database Schema
-- Cloudflare D1 (SQLite) Database

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    latex_header TEXT,
    config TEXT, -- JSON stored as text
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'generating', 'completed', 'error')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Outlines table (hierarchical structure)
CREATE TABLE IF NOT EXISTS outlines (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    parent_id TEXT,
    title TEXT NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('chapter', 'section', 'subsection')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    content_generated INTEGER DEFAULT 0, -- SQLite uses 0/1 for boolean
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES outlines(id) ON DELETE CASCADE
);

-- Chapter contents table
CREATE TABLE IF NOT EXISTS chapter_contents (
    id TEXT PRIMARY KEY,
    outline_id TEXT NOT NULL,
    content TEXT,
    exercises TEXT, -- JSON stored as text
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'generating', 'completed', 'error')),
    word_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (outline_id) REFERENCES outlines(id) ON DELETE CASCADE
);

-- Task logs table
CREATE TABLE IF NOT EXISTS task_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    role TEXT, -- 'coordinator', 'writer', 'reviewer', etc.
    action TEXT NOT NULL,
    content TEXT,
    metadata TEXT, -- JSON stored as text
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_outlines_project_id ON outlines(project_id);
CREATE INDEX IF NOT EXISTS idx_outlines_parent_id ON outlines(parent_id);
CREATE INDEX IF NOT EXISTS idx_outlines_sort_order ON outlines(project_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_chapter_contents_outline_id ON chapter_contents(outline_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_project_id ON task_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_outlines_timestamp
AFTER UPDATE ON outlines
BEGIN
    UPDATE outlines SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_chapter_contents_timestamp
AFTER UPDATE ON chapter_contents
BEGIN
    UPDATE chapter_contents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
