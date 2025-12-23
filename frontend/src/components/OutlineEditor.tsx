import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { OutlineItem, OutlineLevel } from '@/types';
import { OutlineTreeNode } from './OutlineTreeNode';
import { useProjectStore } from '@/stores/projectStore';
import { outlineApi } from '@/services/api';

interface OutlineEditorProps {
  projectId: string;
}

export const OutlineEditor: React.FC<OutlineEditorProps> = ({ projectId }) => {
  const { outline, setOutline, addOutlineItem } = useProjectStore();
  const [isLoading, setIsLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingWithAI, setGeneratingWithAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadOutline();
  }, [projectId]);

  const loadOutline = async () => {
    setIsLoading(true);
    try {
      const items = await outlineApi.getByProject(projectId);
      setOutline(items);
    } catch (error) {
      console.error('Failed to load outline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = outline.findIndex((item) => item.id === active.id);
    const newIndex = outline.findIndex((item) => item.id === over.id);

    const newOutline = arrayMove(outline, oldIndex, newIndex);
    setOutline(newOutline);

    // Update sort orders in backend
    const updates = newOutline.map((item, index) => ({
      itemId: item.id,
      parentId: item.parentId,
      sortOrder: index,
    }));

    try {
      await outlineApi.reorder(projectId, updates);
    } catch (error) {
      console.error('Failed to reorder outline:', error);
      // Rollback on error
      setOutline(outline);
    }
  };

  const handleAddItem = async (level: OutlineLevel) => {
    const newItem: Partial<OutlineItem> = {
      title: `新${level === 'chapter' ? '章节' : level === 'section' ? '节' : '小节'}`,
      level,
      parentId: null,
      sortOrder: outline.length,
    };

    try {
      const created = await outlineApi.create(projectId, newItem as any);
      addOutlineItem(created);
    } catch (error) {
      console.error('Failed to add outline item:', error);
    }
  };

  const handleLevelChange = async (itemId: string, newLevel: OutlineLevel) => {
    try {
      await outlineApi.update(projectId, itemId, { level: newLevel });
      await loadOutline(); // Reload to get updated structure
    } catch (error) {
      console.error('Failed to change level:', error);
    }
  };

  const handleTitleChange = async (itemId: string, newTitle: string) => {
    try {
      await outlineApi.update(projectId, itemId, { title: newTitle });
      // Reload outline to reflect changes
      await loadOutline();
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm('确定要删除这个项目吗？')) {
      return;
    }

    try {
      await outlineApi.delete(projectId, itemId);
      await loadOutline();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleDownloadTemplate = () => {
    const template = {
      version: '1.0',
      outline: [
        {
          title: '第一章 示例章节',
          level: 'chapter',
          children: [
            {
              title: '1.1 示例节',
              level: 'section',
              children: [
                {
                  title: '1.1.1 示例小节',
                  level: 'subsection',
                },
              ],
            },
          ],
        },
      ],
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'outline-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.outline || !Array.isArray(data.outline)) {
        alert('文件格式不正确');
        return;
      }

      // Clear existing outline
      for (const item of outline) {
        await outlineApi.delete(projectId, item.id);
      }

      // Import new outline
      await importOutlineItems(data.outline, null, 0);
      await loadOutline();
      alert('大纲导入成功！');
    } catch (error) {
      console.error('Failed to import outline:', error);
      alert('导入失败：文件格式不正确');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const importOutlineItems = async (
    items: any[],
    parentId: string | null,
    startOrder: number
  ): Promise<void> => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const created = await outlineApi.create(projectId, {
        title: item.title,
        level: item.level,
        parentId,
        sortOrder: startOrder + i,
      });

      if (item.children && Array.isArray(item.children)) {
        await importOutlineItems(item.children, created.id, 0);
      }
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      alert('请输入大纲要求');
      return;
    }

    setGeneratingWithAI(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/projects/${projectId}/generate-outline`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: aiPrompt }),
        }
      );

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const data = await response.json();

      // Clear existing outline
      for (const item of outline) {
        await outlineApi.delete(projectId, item.id);
      }

      // Import AI-generated outline
      await importOutlineItems(data.outline, null, 0);
      await loadOutline();
      setAiPrompt('');
      alert('大纲生成成功！');
    } catch (error) {
      console.error('Failed to generate outline:', error);
      alert('生成失败，请重试');
    } finally {
      setGeneratingWithAI(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="outline-editor bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">大纲编辑器</h2>
        <p className="text-gray-600">拖拽调整章节顺序，编辑标题和层级</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={outline.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {outline
              .filter((item) => !item.parentId)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => (
                <OutlineTreeNode
                  key={item.id}
                  item={item}
                  outline={outline}
                  onLevelChange={handleLevelChange}
                  onTitleChange={handleTitleChange}
                  onRemove={handleRemove}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* AI Generation Section */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">AI 辅助生成大纲</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="例如：生成一份大学物理力学教材大纲，包括牛顿力学、分析力学等章节"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={generatingWithAI}
          />
          <button
            onClick={handleGenerateWithAI}
            disabled={generatingWithAI}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {generatingWithAI ? '生成中...' : 'AI 生成'}
          </button>
        </div>
      </div>

      {/* Manual Editing Section */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">手动编辑</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAddItem('chapter')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + 添加章节
          </button>
          <button
            onClick={() => handleAddItem('section')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            + 添加节
          </button>
          <button
            onClick={() => handleAddItem('subsection')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            + 添加小节
          </button>
        </div>
      </div>

      {/* Template Import/Export Section */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">模板导入/导出</h3>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            📥 下载模板
          </button>
          <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
            📤 导入文件
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          下载模板查看格式，编辑后导入以批量创建大纲
        </p>
      </div>
    </div>
  );
};
