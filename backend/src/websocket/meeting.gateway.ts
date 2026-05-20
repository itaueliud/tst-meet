import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MeetingsService } from '../meetings/meetings.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
      : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
    credentials: true,
  },
  namespace: '/meeting',
})
export class MeetingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('MeetingGateway');

  // Track socket -> meeting/user info
  private socketMap = new Map<string, { meetingId: string; displayName: string; role: string; participantId?: string }>();

  constructor(private meetingsService: MeetingsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const info = this.socketMap.get(client.id);
    if (info) {
      await this.meetingsService.removeParticipant(client.id);
      this.server.to(info.meetingId).emit('participant-left', {
        socketId: client.id,
        displayName: info.displayName,
        role: info.role,
      });
      // Send updated list
      const participants = await this.meetingsService.getActiveParticipants(info.meetingId);
      this.server.to(info.meetingId).emit('participants-updated', participants);
      this.socketMap.delete(client.id);
    }
  }

  @SubscribeMessage('join-meeting')
  async handleJoinMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; displayName: string; role: string },
  ) {
    const { meetingId, displayName, role } = data;

    client.join(meetingId);
    const participant = await this.meetingsService.addParticipant(meetingId, displayName, role, client.id);
    if (role === 'host') {
      try {
        await this.meetingsService.startMeeting(meetingId);
      } catch (err) {
        this.logger.warn(`Failed to mark meeting as active for ${meetingId}: ${String(err)}`);
      }
    }

    this.socketMap.set(client.id, { meetingId, displayName, role, participantId: participant.id });

    // Notify others
    client.to(meetingId).emit('participant-joined', {
      socketId: client.id,
      displayName,
      role,
      participantId: participant.id,
    });

    // Send current participants to new joiner
    const participants = await this.meetingsService.getActiveParticipants(meetingId);
    this.server.to(meetingId).emit('participants-updated', participants);

    // Send chat history
    const messages = await this.meetingsService.getMessages(meetingId);
    client.emit('chat-history', messages);

    return { success: true, participantId: participant.id };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; message: string; senderName: string; senderRole: string },
  ) {
    const saved = await this.meetingsService.saveMessage(
      data.meetingId,
      data.senderName,
      data.senderRole,
      data.message,
    );
    this.server.to(data.meetingId).emit('new-message', saved);
  }

  @SubscribeMessage('reaction')
  handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; emoji: string; senderName: string },
  ) {
    this.server.to(data.meetingId).emit('reaction', {
      emoji: data.emoji,
      senderName: data.senderName,
      socketId: client.id,
    });
  }

  @SubscribeMessage('raise-hand')
  async handleRaiseHand(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; raised: boolean; displayName: string },
  ) {
    await this.meetingsService.updateParticipant(client.id, { handRaised: data.raised });
    this.server.to(data.meetingId).emit('hand-raised', {
      socketId: client.id,
      displayName: data.displayName,
      raised: data.raised,
    });
    const participants = await this.meetingsService.getActiveParticipants(data.meetingId);
    this.server.to(data.meetingId).emit('participants-updated', participants);
  }

  @SubscribeMessage('toggle-mute')
  async handleToggleMute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; isMuted: boolean },
  ) {
    await this.meetingsService.updateParticipant(client.id, { isMuted: data.isMuted });
    this.server.to(data.meetingId).emit('participant-mute-changed', {
      socketId: client.id,
      isMuted: data.isMuted,
    });
    const participants = await this.meetingsService.getActiveParticipants(data.meetingId);
    this.server.to(data.meetingId).emit('participants-updated', participants);
  }

  @SubscribeMessage('toggle-camera')
  async handleToggleCamera(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; isCameraOff: boolean },
  ) {
    await this.meetingsService.updateParticipant(client.id, { isCameraOff: data.isCameraOff });
    this.server.to(data.meetingId).emit('participant-camera-changed', {
      socketId: client.id,
      isCameraOff: data.isCameraOff,
    });
    const participants = await this.meetingsService.getActiveParticipants(data.meetingId);
    this.server.to(data.meetingId).emit('participants-updated', participants);
  }

  @SubscribeMessage('screen-share-started')
  handleScreenShareStarted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; displayName: string },
  ) {
    client.to(data.meetingId).emit('screen-share-started', {
      socketId: client.id,
      displayName: data.displayName,
    });
  }

  @SubscribeMessage('screen-share-stopped')
  handleScreenShareStopped(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string },
  ) {
    client.to(data.meetingId).emit('screen-share-stopped', { socketId: client.id });
  }

  // WebRTC signaling
  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; offer: any; from: string },
  ) {
    this.server.to(data.to).emit('offer', { offer: data.offer, from: client.id, fromName: data.from });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; answer: any },
  ) {
    this.server.to(data.to).emit('answer', { answer: data.answer, from: client.id });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; candidate: any },
  ) {
    this.server.to(data.to).emit('ice-candidate', { candidate: data.candidate, from: client.id });
  }

  // Host controls
  @SubscribeMessage('host-mute-participant')
  async handleHostMuteParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; targetSocketId: string; mute: boolean },
  ) {
    const info = this.socketMap.get(client.id);
    if (info?.role !== 'host') return;
    await this.meetingsService.updateParticipant(data.targetSocketId, { isMuted: data.mute });
    this.server.to(data.targetSocketId).emit('force-muted', { muted: data.mute });
    const participants = await this.meetingsService.getActiveParticipants(data.meetingId);
    this.server.to(data.meetingId).emit('participants-updated', participants);
  }

  @SubscribeMessage('host-remove-participant')
  async handleHostRemoveParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; targetSocketId: string },
  ) {
    const info = this.socketMap.get(client.id);
    if (info?.role !== 'host') return;
    this.server.to(data.targetSocketId).emit('removed-from-meeting');
    const targetSocket = this.server.sockets.sockets.get(data.targetSocketId);
    if (targetSocket) targetSocket.disconnect();
  }

  @SubscribeMessage('host-end-meeting')
  async handleHostEndMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string },
  ) {
    const info = this.socketMap.get(client.id);
    if (info?.role !== 'host') return;
    try {
      await this.meetingsService.endMeeting(data.meetingId);
    } catch (err) {
      this.logger.error(`Failed to end meeting ${data.meetingId}: ${String(err)}`);
    }
    this.server.to(data.meetingId).emit('meeting-ended');
  }

  @SubscribeMessage('host-lock-meeting')
  handleHostLockMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; locked: boolean },
  ) {
    const info = this.socketMap.get(client.id);
    if (info?.role !== 'host') return;
    this.server.to(data.meetingId).emit('meeting-locked', { locked: data.locked });
  }

  @SubscribeMessage('whiteboard-draw')
  handleWhiteboardDraw(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; drawData: any },
  ) {
    client.to(data.meetingId).emit('whiteboard-draw', data.drawData);
  }

  @SubscribeMessage('whiteboard-clear')
  handleWhiteboardClear(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string },
  ) {
    client.to(data.meetingId).emit('whiteboard-clear');
  }

  @SubscribeMessage('speaking')
  handleSpeaking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; isSpeaking: boolean },
  ) {
    client.to(data.meetingId).emit('speaking', { socketId: client.id, isSpeaking: data.isSpeaking });
  }
}
