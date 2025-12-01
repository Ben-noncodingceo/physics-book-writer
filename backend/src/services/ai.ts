import OpenAI from 'openai';
import type { Env, Outline, GenerationContext, AIResponse, Exercise } from '../types';

export class AIService {
  private openai: OpenAI | null = null;
  private geminiApiKey: string | null = null;
  private tongyiApiKey: string | null = null;

  constructor(env: Env) {
    // 初始化 OpenAI
    if (env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
    }

    // 保存 Gemini API Key
    if (env.GEMINI_API_KEY) {
      this.geminiApiKey = env.GEMINI_API_KEY;
    }

    // 保存通义千问 API Key
    if (env.TONGYI_API_KEY) {
      this.tongyiApiKey = env.TONGYI_API_KEY;
    }
  }

  async generateChapterContent(
    outline: Outline,
    context: GenerationContext
  ): Promise<AIResponse> {
    const prompt = this.buildPrompt(outline, context);

    // 优先级：Gemini > 通义千问 > OpenAI
    try {
      if (this.geminiApiKey) {
        return await this.generateWithGemini(prompt);
      } else if (this.tongyiApiKey) {
        return await this.generateWithTongyi(prompt);
      } else if (this.openai) {
        return await this.generateWithOpenAI(prompt);
      } else {
        throw new Error('No AI API key configured');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      // 如果主要的失败了，尝试备用的
      return await this.generateWithFallback(prompt);
    }
  }

  private async generateWithGemini(prompt: string): Promise<AIResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const exercises = this.extractExercises(content);

    return { content, exercises };
  }

  private async generateWithTongyi(prompt: string): Promise<AIResponse> {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.tongyiApiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-max',
          input: {
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          },
          parameters: {
            max_tokens: 4096,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Tongyi API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.output?.text || '';
    const exercises = this.extractExercises(content);

    return { content, exercises };
  }

  private async generateWithOpenAI(prompt: string): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || '';
    const exercises = this.extractExercises(content);

    return { content, exercises };
  }

  private async generateWithFallback(prompt: string): Promise<AIResponse> {
    // 尝试所有可用的 API
    const apis = [];

    if (this.tongyiApiKey) apis.push(() => this.generateWithTongyi(prompt));
    if (this.openai) apis.push(() => this.generateWithOpenAI(prompt));
    if (this.geminiApiKey) apis.push(() => this.generateWithGemini(prompt));

    for (const api of apis) {
      try {
        return await api();
      } catch (error) {
        console.error('Fallback attempt failed:', error);
        continue;
      }
    }

    throw new Error('All AI APIs failed');
  }

  private buildPrompt(outline: Outline, context: GenerationContext): string {
    const parent = context.outline.find((o) => o.id === outline.parent_id);
    const siblings = context.outline.filter(
      (o) => o.parent_id === outline.parent_id
    );
    const position = siblings.findIndex((s) => s.id === outline.id) + 1;

    const levelName = {
      chapter: '章节',
      section: '节',
      subsection: '小节',
    }[outline.level];

    return `你是一位专业的物理学教材编写专家。请根据以下要求生成${levelName}的内容：

**大纲信息：**
- 标题：${outline.title}
- 层级：${levelName}
- 父级章节：${parent ? parent.title : '无（顶级章节）'}
- 位置：第 ${position} 个${levelName}

**内容要求：**
1. 难度级别：${context.difficulty === 'undergraduate' ? '本科' : '研究生'}
2. 写作风格：${context.writingStyle}
3. 内容长度：${outline.level === 'chapter' ? '1500-2000' : outline.level === 'section' ? '800-1200' : '400-600'}字
4. 语言：中文

**格式要求：**
1. 使用标准 LaTeX 格式
2. 使用以下自定义命令创建例题和解答：
   - \\ex{例题内容}
   - \\sol{解答内容}
3. 包含 2-3 个例题（使用 \\ex{} 和 \\sol{} 命令）
4. 使用适当的数学公式（$...$ 或 \\[...\\]）
5. 包含必要的定理、定义等环境

**内容结构：**
1. 引言/概述
2. 核心概念解释
3. 数学推导（如适用）
4. 例题（2-3个）
5. 小结

**参考资料：**
可以参考 Wikipedia 相关词条获取准确的物理知识。

请直接输出 LaTeX 格式的内容，不要包含额外的说明。`;
  }

  private extractExercises(content: string): Exercise[] {
    const exercises: Exercise[] = [];

    // Simple regex to extract exercises
    const exPattern = /\\ex\{([^}]+)\}/g;
    const solPattern = /\\sol\{([^}]+)\}/g;

    const exMatches = [...content.matchAll(exPattern)];
    const solMatches = [...content.matchAll(solPattern)];

    for (let i = 0; i < Math.min(exMatches.length, solMatches.length); i++) {
      exercises.push({
        id: `ex-${i + 1}`,
        question: exMatches[i][1],
        solution: solMatches[i][1],
        difficulty: 'medium',
      });
    }

    return exercises;
  }

  async researchTopic(topic: string): Promise<string> {
    try {
      if (this.geminiApiKey) {
        const response = await this.generateWithGemini(
          `请简要介绍物理学概念"${topic}"，包括基本定义、重要性和关键应用。限制在300字以内。`
        );
        return response.content;
      } else if (this.tongyiApiKey) {
        const response = await this.generateWithTongyi(
          `请简要介绍物理学概念"${topic}"，包括基本定义、重要性和关键应用。限制在300字以内。`
        );
        return response.content;
      } else if (this.openai) {
        const response = await this.generateWithOpenAI(
          `请简要介绍物理学概念"${topic}"，包括基本定义、重要性和关键应用。限制在300字以内。`
        );
        return response.content;
      }
      return '';
    } catch (error) {
      console.error('Research error:', error);
      return '';
    }
  }
}
