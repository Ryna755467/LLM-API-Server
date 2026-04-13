import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class LlmService {
  private readonly model = new ChatOpenAI({
    model: process.env.LLM_MODEL,
    apiKey: process.env.LLM_API_KEY,
    configuration: {
      baseURL: process.env.LLM_BASE_URL,
    },
    temperature: 0.7,
  });

  async chat(prompt: string) {
    try {
      const messages = [{ role: 'human', content: prompt }];
      const res = await this.model.invoke(messages);
      return {
        success: true,
        content: res.content as string,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '未知错误';
      return {
        success: false,
        content: message,
      };
    }
  }
}
