import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { MeetingsModule } from './meetings/meetings.module';
import { WebsocketModule } from './websocket/websocket.module';
import { Admin } from './admin/admin.entity';
import { Meeting } from './meetings/entities/meeting.entity';
import { MeetingCode } from './meetings/entities/meeting-code.entity';
import { MeetingParticipant } from './meetings/entities/participant.entity';
import { ChatMessage } from './meetings/entities/chat-message.entity';
import { AttendanceLog } from './meetings/entities/attendance-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH || './data/tst-meet.db',
      entities: [Admin, Meeting, MeetingCode, MeetingParticipant, ChatMessage, AttendanceLog],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    AdminModule,
    MeetingsModule,
    WebsocketModule,
  ],
})
export class AppModule {}
