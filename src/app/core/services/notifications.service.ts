import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface AppNotification {
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

export const NOTIFICATION_LABELS: Record<string, string> = {
  friend_request: 'sent you a friend request',
  friend_accepted: 'accepted your friend request',
  book_recommended: 'recommended a book to you',
  post_liked: 'liked your post',
  comment_liked: 'liked your comment',
  review_liked: 'liked your review',
  friend_posted: 'shared a new post',
};

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly supabaseService = inject(SupabaseService);

  readonly unreadCount$ = new BehaviorSubject<number>(0);
  readonly notifications$ = new BehaviorSubject<AppNotification[]>([]);

  private realtimeChannel: ReturnType<Awaited<ReturnType<typeof this.supabaseService.getClient>>['channel']> | null = null;

  private async authHeaders(): Promise<Record<string, string>> {
    const session = await this.supabaseService.getCurrentSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  private async apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.authHeaders();
    const res = await fetch(`/api/notifications${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((payload as { message?: string }).message ?? 'Request failed.');
    return payload as T;
  }

  async loadUnreadCount(): Promise<void> {
    try {
      const { count } = await this.apiFetch<{ count: number }>('/unread-count');
      this.unreadCount$.next(count);
    } catch {
      // silently ignore — badge just stays at 0
    }
  }

  async loadNotifications(): Promise<void> {
    try {
      const items = await this.apiFetch<AppNotification[]>('');
      this.notifications$.next(items);
      const unread = items.filter((n) => !n.isRead).length;
      this.unreadCount$.next(unread);
    } catch {
      // silently ignore
    }
  }

  async markAsRead(id: number): Promise<void> {
    await this.apiFetch(`/${id}/read`, { method: 'PATCH' });
    this.notifications$.next(
      this.notifications$.value.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    this.unreadCount$.next(Math.max(0, this.unreadCount$.value - 1));
  }

  async markAllAsRead(): Promise<void> {
    await this.apiFetch('/read-all', { method: 'PATCH' });
    this.notifications$.next(this.notifications$.value.map((n) => ({ ...n, isRead: true })));
    this.unreadCount$.next(0);
  }

  async subscribeToRealtime(userId: string): Promise<void> {
    const supabase = await this.supabaseService.getClient();
    this.realtimeChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          this.unreadCount$.next(this.unreadCount$.value + 1);
          this.loadNotifications();
        },
      )
      .subscribe();
  }

  unsubscribe(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
  }
}
