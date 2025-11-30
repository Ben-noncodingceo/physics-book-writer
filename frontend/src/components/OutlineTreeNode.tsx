import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OutlineItem, OutlineLevel } from '@/types';
import { ChevronRightIcon, ChevronDownIcon, TrashIcon } from '@heroicons/react/24/outline';

interface OutlineTreeNodeProps {
  item: OutlineItem;
  outline: OutlineItem[];
  onLevelChange: (itemId: string, newLevel: OutlineLevel) => void;
  onTitleChange: (itemId: string, newTitle: string) => void;
  onRemove: (itemId: string) => void;
}

const levelColors = {
  chapter: 'bg-blue-100 text-blue-800',
  section: 'bg-green-100 text-green-800',
  subsection: 'bg-purple-100 text-purple-800',
};

const levelNames = {
  chapter: '章',
  section: '节',
  subsection: '小节',
};

export const OutlineTreeNode: React.FC<OutlineTreeNodeProps> = ({
  item,
  outline,
  onLevelChange,
  onTitleChange,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const children = outline
    .filter((child) => child.parentId === item.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const hasChildren = children.length > 0;

  const handleTitleSubmit = () => {
    if (editedTitle.trim() && editedTitle !== item.title) {
      onTitleChange(item.id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLevelChange(item.id, e.target.value as OutlineLevel);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
        >
          <div className="w-5 h-5 flex flex-col justify-center gap-0.5">
            <div className="h-0.5 bg-gray-400 rounded"></div>
            <div className="h-0.5 bg-gray-400 rounded"></div>
            <div className="h-0.5 bg-gray-400 rounded"></div>
          </div>
        </div>

        {/* Expand/collapse button */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}

        {/* Level badge */}
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            levelColors[item.level]
          }`}
        >
          {levelNames[item.level]}
        </span>

        {/* Title input/display */}
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setEditedTitle(item.title);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="flex-1 cursor-text px-2 py-1 hover:bg-gray-200 rounded"
          >
            {item.title}
          </div>
        )}

        {/* Level selector */}
        <select
          value={item.level}
          onChange={handleLevelChange}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="chapter">章</option>
          <option value="section">节</option>
          <option value="subsection">小节</option>
        </select>

        {/* Delete button */}
        <button
          onClick={() => onRemove(item.id)}
          className="p-1 text-red-600 hover:bg-red-100 rounded"
          title="删除"
        >
          <TrashIcon className="w-5 h-5" />
        </button>

        {/* Generated indicator */}
        {item.contentGenerated && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
            已生成
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
          {children.map((child) => (
            <OutlineTreeNode
              key={child.id}
              item={child}
              outline={outline}
              onLevelChange={onLevelChange}
              onTitleChange={onTitleChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};
