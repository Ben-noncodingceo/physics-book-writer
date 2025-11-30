import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { generationApi } from '@/services/api';
import { socketService } from '@/services/socket';
import { ArrowDownTrayIcon, PlayIcon } from '@heroicons/react/24/outline';

interface GenerationPanelProps {
  projectId: string;
}

export const GenerationPanel: React.FC<GenerationPanelProps> = ({
  projectId,
}) => {
  const { generationProgress, setGenerationProgress } = useProjectStore();
  const { addNotification } = useUIStore();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Join project room
    socketService.joinProject(projectId);

    // Listen for generation progress
    socketService.on('generation:progress', (progress) => {
      setGenerationProgress(progress);
      if (progress.status === 'completed') {
        setIsGenerating(false);
        addNotification({
          type: 'success',
          message: '内容生成完成！',
        });
      } else if (progress.status === 'error') {
        setIsGenerating(false);
        addNotification({
          type: 'error',
          message: `生成失败: ${progress.error}`,
        });
      }
    });

    // Listen for task logs
    socketService.on('task:log', (log) => {
      console.log('Task log:', log);
    });

    return () => {
      socketService.leaveProject(projectId);
    };
  }, [projectId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generationApi.generateContent(projectId);
      addNotification({
        type: 'info',
        message: '开始生成内容...',
      });
    } catch (error) {
      console.error('Failed to start generation:', error);
      addNotification({
        type: 'error',
        message: '启动生成失败',
      });
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'latex' | 'pdf') => {
    try {
      const blob =
        format === 'latex'
          ? await generationApi.exportLatex(projectId)
          : await generationApi.exportPdf(projectId);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `book.${format === 'latex' ? 'tex' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addNotification({
        type: 'success',
        message: `${format.toUpperCase()} 导出成功！`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      addNotification({
        type: 'error',
        message: '导出失败',
      });
    }
  };

  const progressPercentage = generationProgress
    ? (generationProgress.completedItems / generationProgress.totalItems) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">内容生成</h2>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 mb-4"
      >
        <PlayIcon className="w-5 h-5" />
        {isGenerating ? '生成中...' : '开始生成'}
      </button>

      {/* Progress bar */}
      {generationProgress && generationProgress.status === 'running' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>进度</span>
            <span>
              {generationProgress.completedItems} / {generationProgress.totalItems}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-sm text-gray-600 mt-2">
            当前: {generationProgress.currentItem}
          </div>
        </div>
      )}

      {/* Export buttons */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">导出</h3>
        <button
          onClick={() => handleExport('latex')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          导出 LaTeX
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          导出 PDF
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>1. 编辑大纲结构</li>
          <li>2. 配置 LaTeX 头文件</li>
          <li>3. 点击"开始生成"</li>
          <li>4. 等待 AI 生成内容</li>
          <li>5. 导出 LaTeX 或 PDF</li>
        </ul>
      </div>
    </div>
  );
};
