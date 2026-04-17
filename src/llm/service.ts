import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { SemanticCache } from './caches/semantic';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '@sql/entities/conversation';
import { Message } from '@sql/entities/message';
import { visionTool } from './tools/vision';

@Injectable()
export class LlmService {
  private readonly model = new ChatOpenAI({
    model: process.env.LLM_MODEL,
    apiKey: process.env.LLM_API_KEY,
    configuration: {
      baseURL: process.env.LLM_BASE_URL,
    },
    modelKwargs: {
      reasoning_effort: 'minimal',
    },
    temperature: 0.7,
  });

  private readonly visionModel = new ChatOpenAI({
    model: process.env.VISION_MODEL,
    apiKey: process.env.VISION_API_KEY,
    configuration: {
      baseURL: process.env.VISION_BASE_URL,
    },
    temperature: 0.1,
  });

  private readonly agent = createAgent({
    model: this.model,
    tools: [visionTool(this.visionModel)],
    systemPrompt: '请简洁明了地回答，关键信息完整，无需多余铺垫和解释。',
  });

  private readonly cache = new SemanticCache();

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,

    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async chat(prompt: string, reqConversationId?: string) {
    try {
      let answer: string | null = null;
      let conversationId = reqConversationId;

      if (!conversationId) {
        const newConv = this.conversationRepo.create({
          title: prompt.slice(0, 20) + '...',
        });
        const conv = await this.conversationRepo.save(newConv);
        conversationId = conv.id;

        answer = await this.cache.lookup(prompt);
      }

      if (!answer) {
        const historyMessages = await this.messageRepo.find({
          where: { conversationId },
          order: { createdAt: 'ASC' },
        });

        const messages = historyMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
        messages.push({ role: 'user', content: prompt });

        const res = await this.agent.invoke({ messages });
        answer = res.messages.at(-1)?.content as string;
      }

      if (!answer) {
        return { success: false, content: 'no answer' };
      }

      if (!reqConversationId) {
        await this.cache.update(prompt, answer);
      }

      await this.messageRepo.save([
        this.messageRepo.create({
          conversationId,
          role: 'user',
          content: prompt,
        }),
        this.messageRepo.create({
          conversationId,
          role: 'assistant',
          content: answer,
        }),
      ]);

      return {
        success: true,
        content: answer,
        conversationId,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown error';
      return { success: false, content: message };
    }
  }
}
