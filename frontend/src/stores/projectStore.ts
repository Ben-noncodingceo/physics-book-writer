import { create } from 'zustand';
import { Project, OutlineItem, GenerationProgress } from '@/types';

interface ProjectState {
  // Current project
  currentProject: Project | null;
  outline: OutlineItem[];
  generationProgress: GenerationProgress | null;

  // Actions
  setCurrentProject: (project: Project | null) => void;
  updateProject: (updates: Partial<Project>) => void;
  setOutline: (outline: OutlineItem[]) => void;
  addOutlineItem: (item: OutlineItem) => void;
  updateOutlineItem: (id: string, updates: Partial<OutlineItem>) => void;
  deleteOutlineItem: (id: string) => void;
  reorderOutline: (updates: Array<{ itemId: string; parentId: string | null; sortOrder: number }>) => void;
  setGenerationProgress: (progress: GenerationProgress | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  outline: [],
  generationProgress: null,

  setCurrentProject: (project) => set({ currentProject: project }),

  updateProject: (updates) =>
    set((state) => ({
      currentProject: state.currentProject
        ? { ...state.currentProject, ...updates }
        : null,
    })),

  setOutline: (outline) => set({ outline }),

  addOutlineItem: (item) =>
    set((state) => ({
      outline: [...state.outline, item],
    })),

  updateOutlineItem: (id, updates) =>
    set((state) => ({
      outline: state.outline.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  deleteOutlineItem: (id) =>
    set((state) => ({
      outline: state.outline.filter((item) => item.id !== id),
    })),

  reorderOutline: (updates) =>
    set((state) => {
      const newOutline = [...state.outline];
      updates.forEach(({ itemId, parentId, sortOrder }) => {
        const item = newOutline.find((i) => i.id === itemId);
        if (item) {
          item.parentId = parentId;
          item.sortOrder = sortOrder;
        }
      });
      return { outline: newOutline };
    }),

  setGenerationProgress: (progress) => set({ generationProgress: progress }),
}));
