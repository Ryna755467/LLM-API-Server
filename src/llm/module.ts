import { Module } from '@nestjs/common';
import { LlmService } from './service';
import { LlmController } from './controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '@sql/entities/conversation';
import { Message } from '@sql/entities/message';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message])],
  controllers: [LlmController],
  providers: [LlmService],
})
export class LlmModule {}
