import Redis from 'ioredis';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createHash } from 'crypto';

interface CacheEntry {
  vector: number[];
  answer: string;
}

export class SemanticCache {
  private readonly redis: Redis;
  private readonly embeddings: OpenAIEmbeddings;

  constructor(embeddings: OpenAIEmbeddings) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    });
    this.embeddings = embeddings;
  }

  async lookup(prompt: string): Promise<string | null> {
    try {
      const vec = await this.embeddings.embedQuery(prompt);
      const keys = await this.redis.keys('semantic:*');

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (!data) continue;

        const { vector, answer } = JSON.parse(data) as CacheEntry;
        const sim = this.cosineSimilarity(vec, vector);

        if (sim >= 0.92) return answer;
      }
    } catch (err) {
      console.error('SemanticCache lookup error', err);
    }
    return null;
  }

  async update(prompt: string, answer: string): Promise<void> {
    try {
      const vec = await this.embeddings.embedQuery(prompt);
      const hash = this.hash(prompt);

      await this.redis.set(
        `semantic:${hash}`,
        JSON.stringify({ vector: vec, answer }),
        'EX',
        86400 * 7,
      );
    } catch (err) {
      console.error('SemanticCache update error', err);
    }
  }

  // 余弦相似度计算
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0,
      magA = 0,
      magB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] ** 2;
      magB += b[i] ** 2;
    }

    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom ? dot / denom : 0;
  }

  // 生成32位MD5字符串作为key
  private hash(s: string): string {
    return createHash('md5').update(s).digest('hex');
  }
}
