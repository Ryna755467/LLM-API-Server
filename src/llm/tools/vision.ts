import { ChatOpenAI } from '@langchain/openai';
import { tool } from 'langchain';
import { z } from 'zod';

export const VisionTool = (visionModel: ChatOpenAI) =>
  tool(
    async ({ list, query }) => {
      try {
        const content = [
          ...list.map((item) => {
            const { mediaType, mediaData } = item;

            const mediaContent = {
              image: { type: 'image_url', image_url: { url: mediaData } },
              video: { type: 'video_url', video_url: { url: mediaData } },
            }[mediaType];

            return mediaContent;
          }),
          { type: 'text', text: query },
        ];

        const result = await visionModel.invoke([{ role: 'user', content }]);
        return result.content || '识别失败';
      } catch {
        return '视觉内容识别失败';
      }
    },
    {
      name: 'vision_recognition',
      description: '识别图片或视频内容，当用户发送图片或视频时调用',
      schema: z.object({
        list: z.array(
          z.object({
            mediaType: z.enum(['image', 'video']).describe('媒体类型'),
            mediaData: z.string().describe('媒体URL'),
          }),
        ),
        query: z.string().describe('识别指令'),
      }),
    },
  );
