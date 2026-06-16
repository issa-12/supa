import {
  Controller,
  Delete,
  Get,
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
