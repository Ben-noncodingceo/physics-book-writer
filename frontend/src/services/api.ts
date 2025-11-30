import axios from 'axios';
import { Project, OutlineItem, ChapterContent } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Project APIs
export const projectApi = {
  async create(data: { title: string; latexHeader?: string; config?: any }): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data;
  },

  async get(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async list(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data;
  },
};

// Outline APIs
export const outlineApi = {
  async getByProject(projectId: string): Promise<OutlineItem[]> {
    const response = await api.get(`/projects/${projectId}/outline`);
    return response.data;
  },

  async create(projectId: string, data: {
    title: string;
    level: string;
    parentId?: string;
    sortOrder: number;
  }): Promise<OutlineItem> {
    const response = await api.post(`/projects/${projectId}/outline/items`, data);
    return response.data;
  },

  async update(projectId: string, itemId: string, data: Partial<OutlineItem>): Promise<OutlineItem> {
    const response = await api.put(`/projects/${projectId}/outline/items/${itemId}`, data);
    return response.data;
  },

  async delete(projectId: string, itemId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/outline/items/${itemId}`);
  },

  async reorder(projectId: string, updates: Array<{
    itemId: string;
    parentId: string | null;
    sortOrder: number;
  }>): Promise<void> {
    await api.put(`/projects/${projectId}/outline/reorder`, { updates });
  },
};

// LaTeX Header APIs
export const latexApi = {
  async getHeader(projectId: string): Promise<{ content: string }> {
    const response = await api.get(`/projects/${projectId}/latex-header`);
    return response.data;
  },

  async updateHeader(projectId: string, content: string): Promise<void> {
    await api.put(`/projects/${projectId}/latex-header`, { content });
  },
};

// Content Generation APIs
export const generationApi = {
  async generateContent(projectId: string): Promise<void> {
    await api.post(`/projects/${projectId}/generate`);
  },

  async getContent(outlineId: string): Promise<ChapterContent> {
    const response = await api.get(`/content/${outlineId}`);
    return response.data;
  },

  async exportLatex(projectId: string): Promise<Blob> {
    const response = await api.get(`/projects/${projectId}/export/latex`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportPdf(projectId: string): Promise<Blob> {
    const response = await api.get(`/projects/${projectId}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
