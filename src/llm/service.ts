import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../sql/entities/conversation';
import { Message } from '../sql/entities/message';

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

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,

    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async chat(prompt: string, conversationId?: string) {
    try {
      if (!conversationId) {
        const newConv = this.conversationRepo.create({
          title: prompt.slice(0, 20) + '...',
        });
        const conv = await this.conversationRepo.save(newConv);
        conversationId = conv.id;
      }

      const historyMessages = await this.messageRepo.find({
        where: { conversationId },
        order: { createdAt: 'ASC' },
      });

      const messages = historyMessages.map((msg) => ({
        role: msg.role === 'user' ? 'human' : 'assistant',
        content: msg.content,
      }));
      messages.push({ role: 'human', content: prompt });

      const res = await this.model.invoke(messages);
      const answer = res.content as string;

      await this.messageRepo.save(
        this.messageRepo.create({
          conversationId,
          role: 'user',
          content: prompt,
        }),
      );

      await this.messageRepo.save(
        this.messageRepo.create({
          conversationId,
          role: 'assistant',
          content: answer,
        }),
      );

      return {
        success: true,
        content: answer,
        conversationId,
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
