import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  // conversationId索引 加速查找
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  role: 'user' | 'assistant';

  @Column({ type: 'text' })
  content: string;

  @Index()
  @CreateDateColumn()
  // createdAt索引 加速排序
  createdAt: Date;
}
