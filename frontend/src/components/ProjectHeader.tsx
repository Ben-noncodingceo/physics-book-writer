import React from 'react';
import { Project } from '@/types';
import { Cog6ToothIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface ProjectHeaderProps {
  project: Project;
  onOpenLatexEditor: () => void;
  onOpenSettings?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onOpenLatexEditor,
  onOpenSettings,
}) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              AI LaTeX 书籍生成器 v2.0
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLatexEditor}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <DocumentTextIcon className="w-5 h-5" />
              LaTeX 头文件
            </button>

            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              设置
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
