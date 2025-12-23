import { useState, useEffect } from 'react';
import { TaskLog } from '@/types';
import { taskLogApi } from '@/services/api';

interface TaskLogViewerProps {
  projectId: string;
}

export function TaskLogViewer({ projectId }: TaskLogViewerProps) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();

    // Poll for new logs every 2 seconds when project is generating
    const interval = setInterval(() => {
      loadLogs();
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId]);

  const loadLogs = async () => {
    try {
      setError(null);
      const fetchedLogs = await taskLogApi.getByProject(projectId, 50);
      setLogs(fetchedLogs);
    } catch (err: any) {
      console.error('Failed to load task logs:', err);
      setError(err?.response?.data?.error || '加载日志失败');
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      coordinator: '协调者',
      writer: '写作者',
      reviewer: '审阅者',
      researcher: '研究者',
    };
    return roleMap[role] || role;
  };

  const getActionName = (action: string) => {
    const actionMap: Record<string, string> = {
      generation_started: '开始生成',
      content_generated: '内容已生成',
      generation_error: '生成错误',
      research_completed: '研究完成',
      review_completed: '审阅完成',
    };
    return actionMap[action] || action;
  };

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      coordinator: 'text-purple-600 bg-purple-50',
      writer: 'text-blue-600 bg-blue-50',
      reviewer: 'text-green-600 bg-green-50',
      researcher: 'text-orange-600 bg-orange-50',
    };
    return colorMap[role] || 'text-gray-600 bg-gray-50';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">工作日志</h2>
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">工作日志</h2>
        <button
          onClick={loadLogs}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          刷新
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无日志记录。点击"生成"按钮开始生成内容。
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="border-l-4 border-gray-200 pl-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(log.role)}`}
                >
                  {getRoleName(log.role)}
                </span>
                <span className="text-xs text-gray-500">
                  {getActionName(log.action)}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(log.createdAt).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              {log.content && (
                <p className="text-sm text-gray-700 mt-1">{log.content}</p>
              )}
              {log.metadata && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    详细信息
                  </summary>
                  <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
