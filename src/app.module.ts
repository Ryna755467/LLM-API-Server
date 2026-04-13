import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SqlModule } from './sql/module';
import { LlmModule } from './llm/module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    SqlModule,
    LlmModule,
  ],
})
export class AppModule {}
