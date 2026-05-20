import { Controller, Get, Post, Delete, Param, Body, UseGuards, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CodeRole } from './entities/meeting-code.entity';

@ApiTags('Meetings')
@Controller('meetings')
export class MeetingsController {
  constructor(private meetingsService: MeetingsService) {}

  // Public: validate code
  @Post('validate-code')
  @ApiOperation({ summary: 'Validate a meeting code' })
  async validateCode(@Body() body: { code: string }) {
    const result = await this.meetingsService.validateCode(body.code);
    if (!result.valid) return { valid: false, message: 'Invalid or expired code' };
    return {
      valid: true,
      meetingId: result.meeting.id,
      meetingTitle: result.meeting.title,
      role: result.role,
      settings: {
        allowChat: result.meeting.allowChat,
        allowScreenShare: result.meeting.allowScreenShare,
        allowFileShare: result.meeting.allowFileShare,
        requireApproval: result.meeting.requireApproval,
      },
    };
  }

  // Admin routes below
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAllMeetings() {
    return this.meetingsService.getAllMeetings();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getStats() {
    return this.meetingsService.getDashboardStats();
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getActiveMeetings() {
    return this.meetingsService.getActiveMeetings();
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMeetingHistory() {
    return this.meetingsService.getMeetingHistory();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMeeting(@Param('id') id: string) {
    return this.meetingsService.getMeetingById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new meeting' })
  async createMeeting(@Body() dto: any) {
    return this.meetingsService.createMeeting(dto);
  }

  @Patch(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async startMeeting(@Param('id') id: string) {
    return this.meetingsService.startMeeting(id);
  }

  @Patch(':id/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async endMeeting(@Param('id') id: string) {
    return this.meetingsService.endMeeting(id);
  }

  @Patch(':id/lock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async lockMeeting(@Param('id') id: string, @Body() body: { lock: boolean }) {
    return this.meetingsService.lockMeeting(id, body.lock);
  }

  @Post(':id/codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async generateCodes(@Param('id') id: string, @Body() body: { count: number; role: CodeRole }) {
    return this.meetingsService.generateMoreCodes(id, body.count || 1, body.role || CodeRole.PARTICIPANT);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMessages(@Param('id') id: string) {
    return this.meetingsService.getMessages(id);
  }

  @Get(':id/attendance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAttendance(@Param('id') id: string) {
    return this.meetingsService.getAttendance(id);
  }

  @Get(':id/participants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getParticipants(@Param('id') id: string) {
    return this.meetingsService.getActiveParticipants(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteMeeting(@Param('id') id: string) {
    await this.meetingsService.deleteMeeting(id);
    return { message: 'Meeting deleted' };
  }
}
