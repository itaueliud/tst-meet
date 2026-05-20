import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { Meeting } from './entities/meeting.entity';
import { MeetingCode } from './entities/meeting-code.entity';
import { MeetingParticipant } from './entities/participant.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { AttendanceLog } from './entities/attendance-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, MeetingCode, MeetingParticipant, ChatMessage, AttendanceLog])],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
