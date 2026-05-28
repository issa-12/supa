import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface FriendUser {
  friendshipId: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  username: string | null;
  since: string;
}

export interface FriendRequest {
  friendshipId: number;
  requesterId: string;
  name: string;
  avatarUrl: string | null;
  username: string | null;
  requestedAt: string;
}

export type FriendshipStatusValue =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'accepted'
  | 'rejected'
  | 'blocked';

export interface FriendshipStatusResult {
  status: FriendshipStatusValue;
  friendshipId: number | null;
}

@Injectable()
export class FriendsService {
  private readonly statusCache: Record<string, number> = {};

  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  async verifyUser(token: string): Promise<string> {
    const { data, error } = await this.supabase.getAdmin().auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid or expired session.');
    return data.user.id;
  }

  private async getStatusId(name: string): Promise<number> {
    if (this.statusCache[name] !== undefined) return this.statusCache[name];
    const { data, error } = await this.supabase
      .getAdmin()
      .from('friendship_status')
      .select('status_id')
      .eq('status_name', name)
      .single();
    if (error || !data) throw new InternalServerErrorException(`Status '${name}' not found.`);
    this.statusCache[name] = data['status_id'] as number;
    return this.statusCache[name];
  }

  async sendRequest(requesterId: string, toUserId: string): Promise<{ friendshipId: number }> {
    if (requesterId === toUserId) {
      throw new BadRequestException('Cannot send a friend request to yourself.');
    }
    if (!isUuid(toUserId)) {
      throw new BadRequestException('toUserId must be a valid UUID.');
    }

    const admin = this.supabase.getAdmin();
    const pendingId = await this.getStatusId('pending');

    const { data, error } = await admin
      .from('friendship')
      .insert({
        user_id1: requesterId,
        user_id2: toUserId,
        status_id: pendingId,
        requester_id: requesterId,
      })
      .select('friendship_id')
      .single();

    if (error) {
      // 23505 = unique_violation (friendship_unique_pair index)
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('A friendship or pending request already exists.');
      }
      // 23503 = foreign_key_violation (toUserId is not a real user)
      if ((error as { code?: string }).code === '23503') {
        throw new BadRequestException('Recipient user does not exist.');
      }
      throw new InternalServerErrorException(error.message);
    }
    const newFriendshipId = data['friendship_id'] as number;

    // Notify the recipient about the friend request (fire-and-forget)
    this.notifications
      .createNotification(toUserId, requesterId, 'friend_request', newFriendshipId, 'friendship')
      .catch(() => undefined);

    return { friendshipId: newFriendshipId };
  }

  async acceptRequest(friendshipId: number, userId: string): Promise<{ success: boolean }> {
    const admin = this.supabase.getAdmin();

    const { data: f } = await admin
      .from('friendship')
      .select('friendship_id, user_id1, user_id2, requester_id, status_id')
      .eq('friendship_id', friendshipId)
      .maybeSingle();

    if (!f) throw new NotFoundException('Friend request not found.');
    if (f['user_id1'] !== userId && f['user_id2'] !== userId) throw new ForbiddenException('Not authorized.');
    if (f['requester_id'] === userId) throw new ForbiddenException('Cannot accept your own request.');

    const acceptedId = await this.getStatusId('accepted');
    const { error } = await admin
      .from('friendship')
      .update({ status_id: acceptedId })
      .eq('friendship_id', friendshipId);

    if (error) throw new InternalServerErrorException(error.message);

    // Notify the original requester that their request was accepted (fire-and-forget)
    this.notifications
      .createNotification(f['requester_id'] as string, userId, 'friend_accepted', friendshipId, 'friendship')
      .catch(() => undefined);

    return { success: true };
  }

  async rejectRequest(friendshipId: number, userId: string): Promise<{ success: boolean }> {
    const admin = this.supabase.getAdmin();

    const { data: f } = await admin
      .from('friendship')
      .select('friendship_id, user_id1, user_id2')
      .eq('friendship_id', friendshipId)
      .maybeSingle();

    if (!f) throw new NotFoundException('Friend request not found.');
    if (f['user_id1'] !== userId && f['user_id2'] !== userId) throw new ForbiddenException('Not authorized.');

    const rejectedId = await this.getStatusId('rejected');
    const { error } = await admin
      .from('friendship')
      .update({ status_id: rejectedId })
      .eq('friendship_id', friendshipId);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async deleteFriendship(friendshipId: number, userId: string): Promise<{ success: boolean }> {
    const admin = this.supabase.getAdmin();

    const { data: f } = await admin
      .from('friendship')
      .select('friendship_id, user_id1, user_id2')
      .eq('friendship_id', friendshipId)
      .maybeSingle();

    if (!f) throw new NotFoundException('Friendship not found.');
    if (f['user_id1'] !== userId && f['user_id2'] !== userId) throw new ForbiddenException('Not authorized.');

    const { error } = await admin.from('friendship').delete().eq('friendship_id', friendshipId);
    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async getFriends(userId: string): Promise<FriendUser[]> {
    const admin = this.supabase.getAdmin();
    const acceptedId = await this.getStatusId('accepted');

    const { data: friendships, error } = await admin
      .from('friendship')
      .select('friendship_id, user_id1, user_id2, created_at')
      .or(`user_id1.eq.${userId},user_id2.eq.${userId}`)
      .eq('status_id', acceptedId);

    if (error) throw new InternalServerErrorException(error.message);
    if (!friendships?.length) return [];

    const friendIds = friendships.map((f) =>
      f['user_id1'] === userId ? f['user_id2'] : f['user_id1'],
    );

    const { data: users } = await admin
      .from('users')
      .select('id, name, profile_picture_url, username')
      .in('id', friendIds);

    const userMap = new Map((users ?? []).map((u) => [u['id'], u]));

    return friendships.map((f) => {
      const friendId = f['user_id1'] === userId ? f['user_id2'] : f['user_id1'];
      const user = userMap.get(friendId) as Record<string, unknown> | undefined;
      return {
        friendshipId: f['friendship_id'] as number,
        userId: friendId as string,
        name: (user?.['name'] as string) ?? 'Unknown',
        avatarUrl: (user?.['profile_picture_url'] as string) ?? null,
        username: (user?.['username'] as string) ?? null,
        since: f['created_at'] as string,
      };
    });
  }

  async getIncomingRequests(userId: string): Promise<FriendRequest[]> {
    const admin = this.supabase.getAdmin();
    const pendingId = await this.getStatusId('pending');

    const { data: requests, error } = await admin
      .from('friendship')
      .select('friendship_id, user_id1, user_id2, requester_id, created_at')
      .or(`user_id1.eq.${userId},user_id2.eq.${userId}`)
      .eq('status_id', pendingId)
      .neq('requester_id', userId);

    if (error) throw new InternalServerErrorException(error.message);
    if (!requests?.length) return [];

    const requesterIds = requests.map((r) => r['requester_id'] as string);

    const { data: users } = await admin
      .from('users')
      .select('id, name, profile_picture_url, username')
      .in('id', requesterIds);

    const userMap = new Map((users ?? []).map((u) => [u['id'], u]));

    return requests.map((r) => {
      const user = userMap.get(r['requester_id']) as Record<string, unknown> | undefined;
      return {
        friendshipId: r['friendship_id'] as number,
        requesterId: r['requester_id'] as string,
        name: (user?.['name'] as string) ?? 'Unknown',
        avatarUrl: (user?.['profile_picture_url'] as string) ?? null,
        username: (user?.['username'] as string) ?? null,
        requestedAt: r['created_at'] as string,
      };
    });
  }

  async getFriendshipStatus(userId: string, otherUserId: string): Promise<FriendshipStatusResult> {
    if (!isUuid(otherUserId)) {
      return { status: 'none', friendshipId: null };
    }
    const admin = this.supabase.getAdmin();

    const { data } = await admin
      .from('friendship')
      .select('friendship_id, status_id, requester_id, friendship_status(status_name)')
      .or(
        `and(user_id1.eq.${userId},user_id2.eq.${otherUserId}),and(user_id1.eq.${otherUserId},user_id2.eq.${userId})`,
      )
      .maybeSingle();

    if (!data) return { status: 'none', friendshipId: null };

    const statusName = ((data['friendship_status'] as unknown) as Record<string, unknown> | null)?.['status_name'] as string;
    const requesterId = data['requester_id'] as string;
    const friendshipId = data['friendship_id'] as number;

    let status: FriendshipStatusValue;
    if (statusName === 'pending') {
      status = requesterId === userId ? 'pending_sent' : 'pending_received';
    } else {
      status = statusName as FriendshipStatusValue;
    }

    return { status, friendshipId };
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string): boolean {
  return typeof value === 'string' && UUID_RE.test(value);
}
