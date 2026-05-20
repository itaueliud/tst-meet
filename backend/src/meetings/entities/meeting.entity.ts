import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MeetingCode } from './meeting-code.entity';
import { MeetingParticipant } from './participant.entity';
import { ChatMessage } from './chat-message.entity';
import { AttendanceLog } from './attendance-log.entity';

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', default: MeetingStatus.SCHEDULED })
  status: MeetingStatus;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ default: false })
  allowScreenShare: boolean;

  @Column({ default: true })
  allowChat: boolean;

  @Column({ default: false })
  allowFileShare: boolean;

  @Column({ default: false })
  requireApproval: boolean;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column({ nullable: true })
  scheduledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MeetingCode, code => code.meeting, { cascade: true })
  codes: MeetingCode[];

  @OneToMany(() => MeetingParticipant, p => p.meeting, { cascade: true })
  participants: MeetingParticipant[];

  @OneToMany(() => ChatMessage, m => m.meeting, { cascade: true })
  messages: ChatMessage[];

  @OneToMany(() => AttendanceLog, a => a.meeting, { cascade: true })
  attendanceLogs: AttendanceLog[];
}
