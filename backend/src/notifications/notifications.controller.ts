import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Body,
  ForbiddenException,
  Headers,
  Param,
  Patch,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Headers('authorization') auth: string,
    @Query('limit') limit?: string,
  ) {
    const token = extractToken(auth);
    const userId = await this.notificationsService.verifyUser(token);
    return this.notificationsService.getNotifications(userId, limit ? +limit : 20);
  }

  @Get('unread-count')
  async getUnreadCount(@Headers('authorization') auth: string) {
    const token = extractToken(auth);
    const userId = await this.notificationsService.verifyUser(token);
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  async markAllAsRead(@Headers('authorization') auth: string) {
    const token = extractToken(auth);
    const userId = await this.notificationsService.verifyUser(token);
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    const token = extractToken(auth);
    const userId = await this.notificationsService.verifyUser(token);
    return this.notificationsService.markAsRead(+id, userId);
  }

  @Delete()
  async deleteAll(@Headers('authorization') auth: string) {
    const token = extractToken(auth);
    const userId = await this.notificationsService.verifyUser(token);
    return this.notificationsService.deleteAllNotifications(userId);
  }

  @Delete('matching')
  async deleteMatching(
    @Headers('authorization') auth: string,
    @Body() body: {
      userId?: string;
      actorId?: string;
      type?: string;
      referenceId?: number | null;
      referenceType?: string | null;
    } = {},
  ) {
    const token = extractToken(auth);
    const currentUserId = await this.notificationsService.verifyUser(token);
    if (!body.userId || !body.actorId || !body.type) {
      throw new BadRequestException('Missing notification match fields.');
    }
    if (body.actorId !== currentUserId) {
      throw new ForbiddenException('Can only remove notifications caused by your own action.');
    }
    return this.notificationsService.deleteMatchingNotification(
      body.userId,
      body.actorId,
      body.type,
      body.referenceId ?? null,
      body.referenceType ?? null,
    );
  }

  @Delete(':id')
  async deleteNotification(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    const token = extractToken(auth);
    const userId = await this.notificationsService.verifyUser(token);
    return this.notificationsService.deleteNotification(+id, userId);
  }
}

function extractToken(auth: string): string {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing auth token.');
  return auth.slice(7);
}
