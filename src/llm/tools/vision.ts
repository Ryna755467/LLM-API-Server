import { ChatOpenAI } from '@langchain/openai';
import { tool } from 'langchain';
import { z } from 'zod';

export const visionTool = (visionModel: ChatOpenAI) =>
  tool(
    async ({ mediaType, mediaData, query }) => {
      try {
        const result = await visionModel.invoke([
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: mediaData } },
              { type: 'text', text: query },
            ],
          },
        ]);
        return result.content || '识别失败';
      } catch {
        return '图片识别失败';
      }
    },
    {
      name: 'vision_recognition',
      description: '识别图片内容，当用户发送图片时调用',
      schema: z.object({
        mediaType: z.enum(['image']).describe('媒体类型'),
        mediaData: z.string().describe('媒体URL'),
        query: z.string().describe('识别指令'),
      }),
    },
  );
