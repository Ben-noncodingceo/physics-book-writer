import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { Env, Outline, GenerationContext, AIResponse, Exercise } from '../types';

export class AIService {
  private claude: Anthropic;
  private openai: OpenAI;

  constructor(env: Env) {
    this.claude = new Anthropic({
      apiKey: env.CLAUDE_API_KEY,
    });
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async generateChapterContent(
    outline: Outline,
    context: GenerationContext
  ): Promise<AIResponse> {
    const prompt = this.buildPrompt(outline, context);

    try {
      const message = await this.claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract exercises if present
      const exercises = this.extractExercises(content);

      return {
        content,
        exercises,
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to generate content with Claude API');
    }
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
      const message = await this.claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `请简要介绍物理学概念"${topic}"，包括基本定义、重要性和关键应用。限制在300字以内。`,
          },
        ],
      });

      return message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (error) {
      console.error('Research error:', error);
      return '';
    }
  }
}
