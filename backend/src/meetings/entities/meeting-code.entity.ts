import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Meeting } from './meeting.entity';

export enum CodeRole {
  HOST = 'host',
  PARTICIPANT = 'participant',
}

@Entity('meeting_codes')
export class MeetingCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'varchar', default: CodeRole.PARTICIPANT })
  role: CodeRole;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  usedBy: string;

  @ManyToOne(() => Meeting, m => m.codes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: Meeting;

  @Column()
  meetingId: string;

  @CreateDateColumn()
  createdAt: Date;
}
