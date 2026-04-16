import axios from 'axios';

interface EmbeddingResponse {
  id: string;
  model: string;
  data: {
    object: string;
    embedding: number[];
  };
}

export class Embeddings {
  private readonly url: string;
  private readonly model: string;
  private readonly apiKey: string;

  constructor() {
    this.url = process.env.EMBEDDING_URL!;
    this.model = process.env.EMBEDDING_MODEL!;
    this.apiKey = process.env.EMBEDDING_API_KEY!;
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      const response = await axios.post<EmbeddingResponse>(
        this.url,
        {
          model: this.model,
          input: [{ type: 'text', text }],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );
      return response.data.data.embedding;
    } catch {
      return [];
    }
  }
}
