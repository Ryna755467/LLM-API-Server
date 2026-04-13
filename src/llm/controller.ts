import { Controller, Post, Body } from '@nestjs/common';
import { LlmService } from './service';

@Controller()
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('chat')
  async chat(@Body() body: { prompt: string; conversationId?: string }) {
    return this.llmService.chat(body.prompt, body.conversationId);
  }
}
