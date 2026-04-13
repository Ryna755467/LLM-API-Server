import { Module } from '@nestjs/common';
import { LlmService } from './service';
import { LlmController } from './controller';

@Module({
  controllers: [LlmController],
  providers: [LlmService],
})
export class LlmModule {}
