import { useState, useEffect } from 'react';
import { OutlineEditor } from './components/OutlineEditor';
import { LatexHeaderEditor } from './components/LatexHeaderEditor';
import { ProjectHeader } from './components/ProjectHeader';
import { GenerationPanel } from './components/GenerationPanel';
import { useProjectStore } from './stores/projectStore';
import { useUIStore } from './stores/uiStore';
import { socketService } from './services/socket';
import { projectApi } from './services/api';

function App() {
  const [showLatexEditor, setShowLatexEditor] = useState(false);
  const { currentProject, setCurrentProject } = useProjectStore();
  const { notifications, removeNotification } = useUIStore();

  useEffect(() => {
    // Initialize socket connection
    socketService.connect();

    // Load or create a default project for demo
    loadOrCreateProject();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const loadOrCreateProject = async () => {
    try {
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
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ProjectHeader
        project={currentProject}
        onOpenLatexEditor={() => setShowLatexEditor(true)}
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
