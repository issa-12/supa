import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async sendRequest(
    @Headers('authorization') auth: string,
    @Body() body: { toUserId?: string },
  ) {
    const token = extractToken(auth);
    const requesterId = await this.friendsService.verifyUser(token);
    if (!body.toUserId?.trim()) {
      throw new BadRequestException('toUserId is required.');
    }
    return this.friendsService.sendRequest(requesterId, body.toUserId.trim());
  }

  @Patch(':id/accept')
  async acceptRequest(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    const token = extractToken(auth);
    const userId = await this.friendsService.verifyUser(token);
    return this.friendsService.acceptRequest(+id, userId);
  }

  @Patch(':id/reject')
  async rejectRequest(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    const token = extractToken(auth);
    const userId = await this.friendsService.verifyUser(token);
    return this.friendsService.rejectRequest(+id, userId);
  }

  @Delete(':id')
  async deleteFriendship(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    const token = extractToken(auth);
    const userId = await this.friendsService.verifyUser(token);
    return this.friendsService.deleteFriendship(+id, userId);
  }

  @Get()
  async getFriends(@Headers('authorization') auth: string) {
    const token = extractToken(auth);
    const userId = await this.friendsService.verifyUser(token);
    return this.friendsService.getFriends(userId);
  }

  @Get('requests')
  async getIncomingRequests(@Headers('authorization') auth: string) {
    const token = extractToken(auth);
    const userId = await this.friendsService.verifyUser(token);
    return this.friendsService.getIncomingRequests(userId);
  }

  @Get('status/:userId')
  async getFriendshipStatus(
    @Headers('authorization') auth: string,
    @Param('userId') otherUserId: string,
  ) {
    const token = extractToken(auth);
    const userId = await this.friendsService.verifyUser(token);
    return this.friendsService.getFriendshipStatus(userId, otherUserId);
  }

  @Get('count/:userId')
  async getFriendCount(
    @Headers('authorization') auth: string,
    @Param('userId') targetUserId: string,
  ) {
    const token = extractToken(auth);
    await this.friendsService.verifyUser(token);
    return this.friendsService.getFriendCount(targetUserId);
  }

  @Post('block/:userId')
  @HttpCode(HttpStatus.OK)
  async blockUser(
    @Headers('authorization') auth: string,
    @Param('userId') targetUserId: string,
  ) {
    const token = extractToken(auth);
    const blockerId = await this.friendsService.verifyUser(token);
    return this.friendsService.blockUser(blockerId, targetUserId);
  }

  @Delete('block/:userId')
  async unblockUser(
    @Headers('authorization') auth: string,
    @Param('userId') targetUserId: string,
  ) {
    const token = extractToken(auth);
    const blockerId = await this.friendsService.verifyUser(token);
    return this.friendsService.unblockUser(blockerId, targetUserId);
  }
}

function extractToken(auth: string): string {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing auth token.');
  return auth.slice(7);
}
