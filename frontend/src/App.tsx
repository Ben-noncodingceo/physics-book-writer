import { useState, useEffect } from 'react';
import { OutlineEditor } from './components/OutlineEditor';
import { LatexHeaderEditor } from './components/LatexHeaderEditor';
import { ProjectHeader } from './components/ProjectHeader';
import { GenerationPanel } from './components/GenerationPanel';
import { useProjectStore } from './stores/projectStore';
import { useUIStore } from './stores/uiStore';
// import { socketService } from './services/socket'; // Disabled until backend WebSocket support
import { projectApi } from './services/api';

function App() {
  const [showLatexEditor, setShowLatexEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentProject, setCurrentProject, updateProject } = useProjectStore();
  const { notifications, removeNotification } = useUIStore();

  useEffect(() => {
    // Socket connection disabled for now - backend doesn't support WebSocket yet
    // TODO: Implement WebSocket support in backend
    // try {
    //   socketService.connect();
    // } catch (err) {
    //   console.warn('Socket connection failed:', err);
    // }

    // Load or create a default project for demo
    loadOrCreateProject();

    return () => {
      // socketService.disconnect();
    };
  }, []);

  const loadOrCreateProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const projects = await projectApi.list();
      if (projects.length > 0) {
        setCurrentProject(projects[0]);
      } else {
        // Create a new project
        const newProject = await projectApi.create({
          title: '物理学教材',
          config: {
            difficulty: 'undergraduate',
            writingStyle: 'academic',
            customCommands: ['\\ex', '\\sol'],
            language: 'zh',
          },
        });
        setCurrentProject(newProject);
      }
    } catch (error: any) {
      console.error('Failed to load project:', error);
      const errorMsg = error?.response?.data?.error
        || error?.response?.statusText
        || error?.message
        || '无法连接到服务器。请检查后端服务是否正常运行。';
      const errorDetail = error?.response?.status
        ? ` (HTTP ${error.response.status})`
        : '';
      setError(errorMsg + errorDetail);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-2">连接错误</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => loadOrCreateProject()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-500">未找到项目</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ProjectHeader
        project={currentProject}
        onOpenLatexEditor={() => setShowLatexEditor(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Outline Editor */}
          <div className="lg:col-span-2">
            <OutlineEditor projectId={currentProject.id} />
          </div>

          {/* Right: Generation Panel */}
          <div className="lg:col-span-1">
            <GenerationPanel projectId={currentProject.id} />
          </div>
        </div>
      </div>

      {/* LaTeX Header Editor Modal */}
      {showLatexEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <LatexHeaderEditor
              projectId={currentProject.id}
              onClose={() => setShowLatexEditor(false)}
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">项目设置</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目标题
                </label>
                <input
                  type="text"
                  value={currentProject.title}
                  onChange={(e) => updateProject({ title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  难度级别
                </label>
                <select
                  value={currentProject.config?.difficulty || 'undergraduate'}
                  onChange={(e) => updateProject({
                    config: { ...currentProject.config, difficulty: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high-school">高中</option>
                  <option value="undergraduate">本科</option>
                  <option value="graduate">研究生</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  写作风格
                </label>
                <select
                  value={currentProject.config?.writingStyle || 'academic'}
                  onChange={(e) => updateProject({
                    config: { ...currentProject.config, writingStyle: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="academic">学术</option>
                  <option value="casual">通俗</option>
                  <option value="detailed">详细</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  语言
                </label>
                <select
                  value={currentProject.config?.language || 'zh'}
                  onChange={(e) => updateProject({
                    config: { ...currentProject.config, language: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                关闭
              </button>
              <button
                onClick={async () => {
                  try {
                    await projectApi.update(currentProject.id, {
                      title: currentProject.title,
                      config: currentProject.config
                    });
                    setShowSettings(false);
                  } catch (error) {
                    console.error('Failed to save settings:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : notification.type === 'warning'
                ? 'bg-yellow-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span>{notification.message}</span>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
