import { useState } from 'react';
import { AIRoleConfig } from '@/types';
import { AI_PROVIDERS, AI_ROLES, AIProvider, AIRole } from '@/constants/aiModels';
import { projectApi } from '@/services/api';

interface AISettingsProps {
  projectId: string;
  aiConfig?: {
    coordinator?: AIRoleConfig;
    writer?: AIRoleConfig;
    reviewer?: AIRoleConfig;
    researcher?: AIRoleConfig;
  };
  onChange: (aiConfig: any) => void;
}

export function AISettings({ projectId, aiConfig = {}, onChange }: AISettingsProps) {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const getRoleConfig = (role: AIRole): AIRoleConfig => {
    return aiConfig[role] || { provider: 'gemini', model: 'gemini-pro' };
  };

  const updateRoleConfig = (role: AIRole, config: Partial<AIRoleConfig>) => {
    const currentConfig = getRoleConfig(role);
    const newConfig = {
      ...aiConfig,
      [role]: { ...currentConfig, ...config },
    };
    onChange(newConfig);
  };

  const handleProviderChange = (role: AIRole, provider: AIProvider) => {
    const defaultModel = AI_PROVIDERS[provider].models[0].value;
    updateRoleConfig(role, { provider, model: defaultModel });
  };

  const testAIConnection = async () => {
    setTesting(true);
    setTestResults({});

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/test-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiConfig }),
      });

      const results = await response.json();
      setTestResults(results);
    } catch (error) {
      console.error('Failed to test AI connections:', error);
      setTestResults({
        error: { success: false, message: '测试失败：无法连接到服务器' },
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI 角色配置</h3>
        <button
          onClick={testAIConnection}
          disabled={testing}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? '测试中...' : '测试所有连接'}
        </button>
      </div>

      <p className="text-sm text-gray-600">
        为每个 AI 角色配置独立的提供商和模型。不同的角色可以使用不同的 AI 服务。
      </p>

      {(Object.keys(AI_ROLES) as AIRole[]).map((role) => {
        const config = getRoleConfig(role);
        const roleInfo = AI_ROLES[role];
        const providerModels = AI_PROVIDERS[config.provider].models;
        const testResult = testResults[role];

        return (
          <div key={role} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{roleInfo.name}</h4>
                <p className="text-xs text-gray-500">{roleInfo.description}</p>
              </div>
              {testResult && (
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    testResult.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {testResult.success ? '✓ 连接成功' : '✗ 连接失败'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提供商
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => handleProviderChange(role, e.target.value as AIProvider)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((provider) => (
                    <option key={provider} value={provider}>
                      {AI_PROVIDERS[provider].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模型
                </label>
                <select
                  value={config.model}
                  onChange={(e) => updateRoleConfig(role, { model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {providerModels.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {testResult && !testResult.success && (
              <p className="text-xs text-red-600 mt-1">{testResult.message}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
