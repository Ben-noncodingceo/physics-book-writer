// Core types for the LaTeX Book Generator

export type OutlineLevel = 'chapter' | 'section' | 'subsection';

export type ProjectStatus = 'draft' | 'generating' | 'completed' | 'error';

export type ContentStatus = 'pending' | 'generating' | 'completed' | 'error';

export interface OutlineItem {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  level: OutlineLevel;
  sortOrder: number;
  contentGenerated: boolean;
  children?: OutlineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  latexHeader: string;
  config: ProjectConfig;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectConfig {
  difficulty: 'high-school' | 'undergraduate' | 'graduate';
  writingStyle: string;
  customCommands: string[];
  language: 'en' | 'zh';
}

export interface ChapterContent {
  id: string;
  outlineId: string;
  content: string;
  exercises: Exercise[];
  status: ContentStatus;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  question: string;
  solution: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TaskLog {
  id: string;
  projectId: string;
  role: AIRole;
  action: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export type AIRole = 'coordinator' | 'writer' | 'reviewer' | 'researcher';

export interface GenerationProgress {
  projectId: string;
  currentItem: string;
  totalItems: number;
  completedItems: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  error?: string;
}

export interface OutlineUpdate {
  type: 'add' | 'update' | 'delete' | 'reorder';
  item?: OutlineItem;
  items?: OutlineItem[];
}

export interface SocketEvents {
  'outline:update': (data: OutlineUpdate) => void;
  'generation:progress': (data: GenerationProgress) => void;
  'task:log': (data: TaskLog) => void;
  'content:generated': (data: ChapterContent) => void;
}
