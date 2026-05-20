import { Module } from '@nestjs/common';
import { MeetingGateway } from './meeting.gateway';
import { MeetingsModule } from '../meetings/meetings.module';

@Module({
  imports: [MeetingsModule],
  providers: [MeetingGateway],
})
export class WebsocketModule {}
