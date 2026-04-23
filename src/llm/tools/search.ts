import { tool } from 'langchain';
import { z } from 'zod';
import axios from 'axios';

interface WebPageValue {
  name: string; // 网页的标题
  url: string; // 网页的URL
  snippet?: string; // 内容的简短描述
  summary?: string; // 内容的文本摘要
  [key: string]: unknown;
}

interface SearchResponse {
  data: {
    webPages: {
      value: WebPageValue[];
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const SearchTool = tool(
  async ({ query, count = 10 }) => {
    try {
      const response = await axios.post<SearchResponse>(
        process.env.SEARCH_BASE_URL!,
        {
          query,
          summary: true,
          freshness: 'noLimit',
          count,
        },
        {
          headers: { Authorization: `Bearer ${process.env.SEARCH_API_KEY}` },
        },
      );

      const resData = response.data;
      return JSON.stringify(resData.data.webPages.value);
    } catch {
      return '联网搜索失败';
    }
  },
  {
    name: 'online_search',
    description: '用于联网搜索实时信息、资料等内容',
    schema: z.object({
      query: z.string().describe('要搜索的问题'),
      count: z.number().default(10).describe('返回的结果数量，默认10条'),
    }),
  },
);
