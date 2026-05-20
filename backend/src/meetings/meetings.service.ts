import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting, MeetingStatus } from './entities/meeting.entity';
import { MeetingCode, CodeRole } from './entities/meeting-code.entity';
import { MeetingParticipant } from './entities/participant.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { AttendanceLog } from './entities/attendance-log.entity';
// nanoid v3 is CommonJS compatible
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const customAlphabet = (alphabet: string, size: number) => () => {
  let id = '';
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(size);
  for (let i = 0; i < size; i++) { id += alphabet[bytes[i] % alphabet.length]; }
  return id;
};

const nanoid = customAlphabet(chars, 8);

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting) private meetingRepo: Repository<Meeting>,
    @InjectRepository(MeetingCode) private codeRepo: Repository<MeetingCode>,
    @InjectRepository(MeetingParticipant) private participantRepo: Repository<MeetingParticipant>,
    @InjectRepository(ChatMessage) private chatRepo: Repository<ChatMessage>,
    @InjectRepository(AttendanceLog) private attendanceRepo: Repository<AttendanceLog>,
  ) {}

  async createMeeting(dto: any): Promise<Meeting> {
    const meeting = this.meetingRepo.create({
      title: dto.title,
      description: dto.description,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      allowScreenShare: dto.allowScreenShare ?? false,
      allowChat: dto.allowChat ?? true,
      allowFileShare: dto.allowFileShare ?? false,
      requireApproval: dto.requireApproval ?? false,
    });
    const saved = await this.meetingRepo.save(meeting);

    const hostCode = this.createCodeEntity(saved.id, CodeRole.HOST);
    const participantCode = this.createCodeEntity(saved.id, CodeRole.PARTICIPANT);
    await this.codeRepo.save([hostCode, participantCode]);
    return this.getMeetingById(saved.id);
  }

  private getExpiry(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }

  async getMeetingById(id: string): Promise<Meeting> {
    const meeting = await this.meetingRepo.findOne({
      where: { id },
      relations: ['codes', 'participants'],
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return this.meetingRepo.find({
      relations: ['codes', 'participants'],
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveMeetings(): Promise<Meeting[]> {
    return this.meetingRepo.find({
      where: { status: MeetingStatus.ACTIVE },
      relations: ['codes', 'participants'],
      order: { startedAt: 'DESC' },
    });
  }

  async getMeetingHistory(): Promise<Meeting[]> {
    return this.meetingRepo.find({
      where: { status: MeetingStatus.ENDED },
      relations: ['participants'],
      order: { endedAt: 'DESC' },
    });
  }

  async validateCode(code: string): Promise<{ valid: boolean; meeting?: Meeting; role?: string; codeId?: string }> {
    const codeRecord = await this.codeRepo.findOne({
      where: { code, isActive: true },
      relations: ['meeting'],
    });

    if (!codeRecord) return { valid: false };
    if (!codeRecord.meeting) return { valid: false };

    const now = new Date();
    if (codeRecord.expiresAt && codeRecord.expiresAt < now) return { valid: false };

    if (codeRecord.meeting.status === MeetingStatus.ENDED || codeRecord.meeting.status === MeetingStatus.CANCELLED) {
      return { valid: false };
    }

    if (codeRecord.meeting.isLocked && codeRecord.role === CodeRole.PARTICIPANT) {
      return { valid: false };
    }

    return {
      valid: true,
      meeting: codeRecord.meeting,
      role: codeRecord.role,
      codeId: codeRecord.id,
    };
  }

  async startMeeting(id: string): Promise<Meeting> {
    const meeting = await this.getMeetingById(id);
    meeting.status = MeetingStatus.ACTIVE;
    meeting.startedAt = new Date();
    return this.meetingRepo.save(meeting);
  }

  async endMeeting(id: string): Promise<Meeting> {
    const meeting = await this.getMeetingById(id);
    meeting.status = MeetingStatus.ENDED;
    meeting.endedAt = new Date();

    // Deactivate all codes
    await this.codeRepo.update({ meetingId: id }, { isActive: false });

    // Mark all participants as inactive
    const activeParticipants = await this.participantRepo.find({
      where: { meetingId: id, isActive: true },
    });

    for (const p of activeParticipants) {
      p.isActive = false;
      p.leftAt = new Date();
      await this.participantRepo.save(p);

      // Log attendance
      if (p.joinedAt) {
        const duration = Math.floor((new Date().getTime() - new Date(p.joinedAt).getTime()) / 1000);
        await this.attendanceRepo.save({
          participantName: p.displayName,
          role: p.role,
          joinedAt: p.joinedAt,
          leftAt: new Date(),
          duration,
          meetingId: id,
        });
      }
    }

    return this.meetingRepo.save(meeting);
  }

  async lockMeeting(id: string, lock: boolean): Promise<Meeting> {
    const meeting = await this.getMeetingById(id);
    meeting.isLocked = lock;
    return this.meetingRepo.save(meeting);
  }

  async addParticipant(meetingId: string, displayName: string, role: string, socketId: string): Promise<MeetingParticipant> {
    const participant = this.participantRepo.create({
      displayName,
      role,
      socketId,
      meetingId,
      isActive: true,
      joinedAt: new Date(),
    });
    return this.participantRepo.save(participant);
  }

  async removeParticipant(socketId: string): Promise<void> {
    const p = await this.participantRepo.findOne({ where: { socketId, isActive: true } });
    if (p) {
      p.isActive = false;
      p.leftAt = new Date();
      await this.participantRepo.save(p);

      if (p.joinedAt) {
        const duration = Math.floor((new Date().getTime() - new Date(p.joinedAt).getTime()) / 1000);
        await this.attendanceRepo.save({
          participantName: p.displayName,
          role: p.role,
          joinedAt: p.joinedAt,
          leftAt: new Date(),
          duration,
          meetingId: p.meetingId,
        });
      }
    }
  }

  async getActiveParticipants(meetingId: string): Promise<MeetingParticipant[]> {
    return this.participantRepo.find({ where: { meetingId, isActive: true } });
  }

  async updateParticipant(socketId: string, updates: Partial<MeetingParticipant>): Promise<void> {
    await this.participantRepo.update({ socketId }, updates);
  }

  async saveMessage(meetingId: string, senderName: string, senderRole: string, message: string, type = 'text'): Promise<ChatMessage> {
    return this.chatRepo.save({ meetingId, senderName, senderRole, message, type });
  }

  async getMessages(meetingId: string): Promise<ChatMessage[]> {
    return this.chatRepo.find({ where: { meetingId }, order: { createdAt: 'ASC' } });
  }

  async getAttendance(meetingId: string): Promise<AttendanceLog[]> {
    return this.attendanceRepo.find({ where: { meetingId }, order: { joinedAt: 'ASC' } });
  }

  async generateMoreCodes(meetingId: string, count: number, role: CodeRole): Promise<MeetingCode[]> {
    await this.getMeetingById(meetingId); // validates exists
    await this.codeRepo.update({ meetingId, role, isActive: true }, { isActive: false });
    const newCode = this.createCodeEntity(meetingId, role);
    const savedCode = await this.codeRepo.save(newCode);
    return [savedCode];
  }

  private createCodeEntity(meetingId: string, role: CodeRole): MeetingCode {
    return this.codeRepo.create({
      code: role === CodeRole.HOST ? `H-${nanoid()}` : `P-${nanoid()}`,
      role,
      meetingId,
      expiresAt: this.getExpiry(),
      isActive: true,
    });
  }

  async deleteMeeting(id: string): Promise<void> {
    const meeting = await this.getMeetingById(id);
    await this.meetingRepo.remove(meeting);
  }

  async getDashboardStats() {
    const total = await this.meetingRepo.count();
    const active = await this.meetingRepo.count({ where: { status: MeetingStatus.ACTIVE } });
    const ended = await this.meetingRepo.count({ where: { status: MeetingStatus.ENDED } });
    const scheduled = await this.meetingRepo.count({ where: { status: MeetingStatus.SCHEDULED } });
    const totalParticipants = await this.participantRepo.count();
    const activeParticipants = await this.participantRepo.count({ where: { isActive: true } });
    return { total, active, ended, scheduled, totalParticipants, activeParticipants };
  }
}
