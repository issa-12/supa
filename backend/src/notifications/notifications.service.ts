import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface NotificationRow {
  id: number;
  type: string;
  actorId: string;
  actorName: string;
  actorAvatarUrl: string | null;
  isRead: boolean;
  createdAt: string;
  referenceId: number | null;
  referenceType: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly typeCache: Record<string, number> = {};

  constructor(private readonly supabase: SupabaseService) {}

  async verifyUser(token: string): Promise<string> {
    const userId = await this.supabase.getVerifiedUserId(token);
    if (!userId) throw new UnauthorizedException('Invalid or expired session.');
    return userId;
  }

  private async getTypeId(typeName: string): Promise<number> {
    if (this.typeCache[typeName] !== undefined) return this.typeCache[typeName];
    const { data, error } = await this.supabase
      .getAdmin()
      .from('notifications_type')
      .select('notifications_typeid')
      .eq('notifications_type', typeName)
      .single();
    if (error || !data) throw new InternalServerErrorException(`Notification type '${typeName}' not found.`);
    this.typeCache[typeName] = data['notifications_typeid'] as number;
    return this.typeCache[typeName];
  }

  async createNotification(
    recipientId: string,
    actorId: string,
    typeName: string,
    referenceId?: number,
    referenceType?: string,
  ): Promise<void> {
    const typeId = await this.getTypeId(typeName);
    await this.supabase.getAdmin().from('notifications').insert({
      user_id: recipientId,
      actor_user_id: actorId,
      notifications_typeid: typeId,
      reference_id: referenceId ?? null,
      reference_type: referenceType ?? null,
      read_status: false,
    });
  }

  async getNotifications(userId: string, limit = 20): Promise<NotificationRow[]> {
    const admin = this.supabase.getAdmin();

    const { data: rows, error } = await admin
      .from('notifications')
      .select(
        'notification_id, read_status, created_at, actor_user_id, reference_id, reference_type, notifications_typeid',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new InternalServerErrorException(error.message);
    if (!rows?.length) return [];

    const actorIds = [...new Set(rows.map((r) => r['actor_user_id'] as string).filter(Boolean))];
    const typeIds = [...new Set(rows.map((r) => r['notifications_typeid'] as number))];

    const [actorsResult, typesResult] = await Promise.all([
      admin.from('users').select('id, name, profile_picture_url').in('id', actorIds),
      admin
        .from('notifications_type')
        .select('notifications_typeid, notifications_type')
        .in('notifications_typeid', typeIds),
    ]);

    const actorMap = new Map((actorsResult.data ?? []).map((a) => [a['id'], a]));
    const typeMap = new Map(
      (typesResult.data ?? []).map((t) => [t['notifications_typeid'], t['notifications_type']]),
    );

    return rows.map((r) => {
      const actor = actorMap.get(r['actor_user_id']) as Record<string, unknown> | undefined;
      return {
        id: r['notification_id'] as number,
        type: (typeMap.get(r['notifications_typeid']) as string) ?? '',
        actorId: r['actor_user_id'] as string,
        actorName: (actor?.['name'] as string) ?? 'Someone',
        actorAvatarUrl: (actor?.['profile_picture_url'] as string) ?? null,
        isRead: r['read_status'] as boolean,
        createdAt: r['created_at'] as string,
        referenceId: r['reference_id'] as number | null,
        referenceType: r['reference_type'] as string | null,
      };
    });
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const { count, error } = await this.supabase
      .getAdmin()
      .from('notifications')
      .select('notification_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read_status', false);
    if (error) throw new InternalServerErrorException(error.message);
    return { count: count ?? 0 };
  }

  async markAsRead(notificationId: number, userId: string): Promise<{ success: boolean }> {
    const admin = this.supabase.getAdmin();
    const { data: n } = await admin
      .from('notifications')
      .select('notification_id, user_id')
      .eq('notification_id', notificationId)
      .maybeSingle();

    if (!n) throw new NotFoundException('Notification not found.');
    if (n['user_id'] !== userId) throw new ForbiddenException('Not authorized.');

    await admin.from('notifications').update({ read_status: true }).eq('notification_id', notificationId);
    return { success: true };
  }

  async deleteNotification(notificationId: number, userId: string): Promise<{ success: boolean }> {
    const admin = this.supabase.getAdmin();
    const { data: n } = await admin
      .from('notifications')
      .select('notification_id, user_id')
      .eq('notification_id', notificationId)
      .maybeSingle();

    if (!n) throw new NotFoundException('Notification not found.');
    if (n['user_id'] !== userId) throw new ForbiddenException('Not authorized.');

    await admin.from('notifications').delete().eq('notification_id', notificationId);
    return { success: true };
  }

  async deleteAllNotifications(userId: string): Promise<{ success: boolean }> {
    const { error } = await this.supabase
      .getAdmin()
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean }> {
    await this.supabase
      .getAdmin()
      .from('notifications')
      .update({ read_status: true })
      .eq('user_id', userId)
      .eq('read_status', false);
    return { success: true };
  }
}
