import React, { useState, useEffect } from 'react';
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

      <div className="mt-6 flex gap-2 pt-4 border-t">
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
  );
};
