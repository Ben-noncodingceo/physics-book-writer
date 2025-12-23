// AI Provider and Model configurations

export const AI_PROVIDERS = {
  gemini: {
    name: 'Gemini (Google)',
    models: [
      { value: 'gemini-pro', label: 'Gemini Pro' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  },
  tongyi: {
    name: '通义千问 (阿里云)',
    models: [
      { value: 'qwen-max', label: 'Qwen Max' },
      { value: 'qwen-plus', label: 'Qwen Plus' },
      { value: 'qwen-turbo', label: 'Qwen Turbo' },
    ],
  },
  openai: {
    name: 'OpenAI (GPT)',
    models: [
      { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
} as const;

export const AI_ROLES = {
  coordinator: { name: '协调者', description: '负责任务分配和流程控制' },
  writer: { name: '写作者', description: '负责生成章节内容' },
  reviewer: { name: '审阅者', description: '负责审核和改进内容质量' },
  researcher: { name: '研究者', description: '负责查找和研究相关资料' },
} as const;

export type AIProvider = keyof typeof AI_PROVIDERS;
export type AIRole = keyof typeof AI_ROLES;
