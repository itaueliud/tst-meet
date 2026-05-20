import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Meeting } from './meeting.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderName: string;

  @Column()
  senderRole: string;

  @Column('text')
  message: string;

  @Column({ nullable: true })
  type: string; // text | file | reaction

  @ManyToOne(() => Meeting, m => m.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: Meeting;

  @Column()
  meetingId: string;

  @CreateDateColumn()
  createdAt: Date;
}
