import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { latexApi } from '@/services/api';

interface LatexHeaderEditorProps {
  projectId: string;
  onClose?: () => void;
}

const DEFAULT_HEADER = `\\documentclass[12pt]{book}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{physics}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage[UTF8]{ctex}

% 自定义例题环境
\\newcommand{\\ex}[1]{\\begin{exercise}#1\\end{exercise}}
\\newcommand{\\sol}[1]{\\begin{solution}#1\\end{solution}}

\\newtheorem{exercise}{例题}[section]
\\newtheorem{solution}{解析}[section]

% 自定义定理环境
\\newtheorem{theorem}{定理}[section]
\\newtheorem{lemma}[theorem]{引理}
\\newtheorem{proposition}[theorem]{命题}
\\newtheorem{corollary}[theorem]{推论}

% 自定义定义环境
\\theoremstyle{definition}
\\newtheorem{definition}{定义}[section]
\\newtheorem{example}{例}[section]

% 自定义注记环境
\\theoremstyle{remark}
\\newtheorem{remark}{注}[section]`;

const PHYSICS_PRESET = `\\documentclass[12pt]{book}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{physics}
\\usepackage{siunitx}
\\usepackage{graphicx}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\usepackage[UTF8]{ctex}

\\newcommand{\\ex}[1]{\\begin{exercise}#1\\end{exercise}}
\\newcommand{\\sol}[1]{\\begin{solution}#1\\end{solution}}

\\newtheorem{exercise}{例题}[section]
\\newtheorem{solution}{解析}[section]`;

const MATH_PRESET = `\\documentclass[12pt]{book}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{mathtools}
\\usepackage{graphicx}
\\usepackage[UTF8]{ctex}

\\newcommand{\\ex}[1]{\\begin{exercise}#1\\end{exercise}}
\\newcommand{\\sol}[1]{\\begin{solution}#1\\end{solution}}

\\newtheorem{exercise}{例题}[section]
\\newtheorem{solution}{解析}[section]
\\newtheorem{theorem}{定理}[section]
\\newtheorem{lemma}{引理}[section]`;

export const LatexHeaderEditor: React.FC<LatexHeaderEditorProps> = ({
  projectId,
  onClose,
}) => {
  const [headerContent, setHeaderContent] = useState(DEFAULT_HEADER);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadHeader();
  }, [projectId]);

  const loadHeader = async () => {
    setIsLoading(true);
    try {
      const { content } = await latexApi.getHeader(projectId);
      if (content) {
        setHeaderContent(content);
      }
    } catch (error) {
      console.error('Failed to load header:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await latexApi.updateHeader(projectId, headerContent);
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to save header:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset = (preset: string) => {
    if (headerContent !== DEFAULT_HEADER) {
      if (!confirm('这将替换当前的头文件内容，确定继续吗？')) {
        return;
      }
    }
    setHeaderContent(preset);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="latex-header-editor bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">LaTeX 头文件配置</h2>
        <p className="text-gray-600">
          自定义文档类、宏包和命令。使用 <code className="bg-gray-100 px-1 rounded">\\ex{'{}'}</code> 和{' '}
          <code className="bg-gray-100 px-1 rounded">\\sol{'{}'}</code> 命令创建习题。
        </p>
      </div>

      {/* Preset buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => applyPreset(PHYSICS_PRESET)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          物理模板
        </button>
        <button
          onClick={() => applyPreset(MATH_PRESET)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          数学模板
        </button>
        <button
          onClick={() => applyPreset(DEFAULT_HEADER)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          默认模板
        </button>
      </div>

      {/* Editor */}
      <div className="mb-4">
        <textarea
          value={headerContent}
          onChange={(e) => setHeaderContent(e.target.value)}
          rows={25}
          className="w-full font-mono text-sm p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          placeholder="输入您的LaTeX头文件..."
          spellCheck={false}
        />
      </div>

      {/* Character count */}
      <div className="mb-4 text-sm text-gray-500">
        {headerContent.length} 字符
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* Help section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="font-semibold text-blue-900 mb-2">使用提示</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <code className="bg-blue-100 px-1 rounded">\\ex{'{}'}</code> - 创建例题环境</li>
          <li>• <code className="bg-blue-100 px-1 rounded">\\sol{'{}'}</code> - 创建解答环境</li>
          <li>• 可以添加自定义宏包和命令</li>
          <li>• 中文支持需要 <code className="bg-blue-100 px-1 rounded">ctex</code> 宏包</li>
          <li>• 物理符号推荐使用 <code className="bg-blue-100 px-1 rounded">physics</code> 宏包</li>
        </ul>
      </div>
    </div>
  );
};
