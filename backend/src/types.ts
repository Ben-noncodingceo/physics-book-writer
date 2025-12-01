// Backend types for LaTeX Book Generator

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  GEMINI_API_KEY: string;
  TONGYI_API_KEY: string;
  OPENAI_API_KEY: string;
  NODE_ENV: string;
  RATE_LIMIT_WINDOW_MS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
}

export type OutlineLevel = 'chapter' | 'section' | 'subsection';
export type ProjectStatus = 'draft' | 'generating' | 'completed' | 'error';
export type ContentStatus = 'pending' | 'generating' | 'completed' | 'error';

export interface Project {
  id: string;
  title: string;
  latex_header: string | null;
  config: string; // JSON string
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectConfig {
  difficulty: 'undergraduate' | 'graduate';
  writingStyle: string;
  customCommands: string[];
  language: 'en' | 'zh';
}

export interface Outline {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  level: OutlineLevel;
  sort_order: number;
  content_generated: number; // SQLite boolean (0 or 1)
  created_at: string;
  updated_at: string;
}

export interface ChapterContent {
  id: string;
  outline_id: string;
  content: string | null;
  exercises: string | null; // JSON string
  status: ContentStatus;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskLog {
  id: string;
  project_id: string;
  role: string;
  action: string;
  content: string | null;
  metadata: string | null; // JSON string
  created_at: string;
}

export interface Exercise {
  id: string;
  question: string;
  solution: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GenerationContext {
  outline: Outline[];
  latexHeader: string;
  difficulty: 'undergraduate' | 'graduate';
  writingStyle: string;
  customCommands: string[];
}

export interface AIResponse {
  content: string;
  exercises?: Exercise[];
}
