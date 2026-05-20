import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Meeting } from './meeting.entity';

@Entity('meeting_participants')
export class MeetingParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  displayName: string;

  @Column()
  role: string; // host | participant

  @Column({ nullable: true })
  socketId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isMuted: boolean;

  @Column({ default: false })
  isCameraOff: boolean;

  @Column({ default: false })
  handRaised: boolean;

  @Column({ nullable: true })
  joinedAt: Date;

  @Column({ nullable: true })
  leftAt: Date;

  @ManyToOne(() => Meeting, m => m.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: Meeting;

  @Column()
  meetingId: string;

  @CreateDateColumn()
  createdAt: Date;
}
