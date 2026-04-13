import { Controller, Post, Body } from '@nestjs/common';
import { LlmService } from './service';

@Controller('chat')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post()
  async chat(@Body('prompt') prompt: string) {
    return this.llmService.chat(prompt);
  }
}
