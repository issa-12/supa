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

  async loadNotifications(): Promise<boolean> {
    try {
      // The list endpoint is capped (default 20 rows), so deriving the badge
      // from `items` would under-report once a user has more unread than that.
      // Pull the exact count from the dedicated endpoint in parallel instead.
      const [items] = await Promise.all([
        this.apiFetch<AppNotification[]>(''),
        this.loadUnreadCount(),
      ]);
      this.notifications$.next(items);
      return true;
    } catch {
      // Surface the failure to the caller so the panel can show an error
      // state instead of a misleading "no notifications" empty state.
      return false;
    }
  }

  async markAsRead(id: number): Promise<void> {
    const prev = this.notifications$.value;
    const target = prev.find((n) => n.id === id);
    if (!target || target.isRead) return;

    // Optimistic: flip the row and decrement the badge immediately, then roll
    // back if the request fails. Never rejects, so template click handlers
    // can fire-and-forget without risking an unhandled promise rejection.
    this.notifications$.next(prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    this.unreadCount$.next(Math.max(0, this.unreadCount$.value - 1));
    try {
      await this.apiFetch(`/${id}/read`, { method: 'PATCH' });
    } catch {
      this.notifications$.next(prev);
      void this.loadUnreadCount();
    }
  }

  async deleteNotification(id: number): Promise<void> {
    const prev = this.notifications$.value;
    const target = prev.find((n) => n.id === id);
    if (!target) return;

    // Optimistic: drop it from the list (and the badge if it was unread), roll
    // back on failure. Never rejects — template click handlers fire-and-forget.
    this.notifications$.next(prev.filter((n) => n.id !== id));
    if (!target.isRead) this.unreadCount$.next(Math.max(0, this.unreadCount$.value - 1));
    try {
      await this.apiFetch(`/${id}`, { method: 'DELETE' });
    } catch {
      this.notifications$.next(prev);
      void this.loadUnreadCount();
    }
  }

  async markAllAsRead(): Promise<void> {
    const prev = this.notifications$.value;
    const prevCount = this.unreadCount$.value;
    if (prevCount === 0 && prev.every((n) => n.isRead)) return;

    this.notifications$.next(prev.map((n) => ({ ...n, isRead: true })));
    this.unreadCount$.next(0);
    try {
      await this.apiFetch('/read-all', { method: 'PATCH' });
    } catch {
      this.notifications$.next(prev);
      this.unreadCount$.next(prevCount);
    }
  }

  private subscribedUserId: string | null = null;
  private refetchTimer: ReturnType<typeof setTimeout> | null = null;

  async subscribeToRealtime(userId: string): Promise<void> {
    if (this.subscribedUserId === userId && this.realtimeChannel) return;
    this.unsubscribe();

    const supabase = await this.supabaseService.getClient();
    this.subscribedUserId = userId;
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
          // Reconcile the badge against the exact server count rather than a
          // blind +1 — that way the bell can never show a number with no
          // matching row behind it. Debounce the full list refetch so a burst
          // of inserts collapses into a single round-trip.
          void this.loadUnreadCount();
          if (this.refetchTimer) clearTimeout(this.refetchTimer);
          this.refetchTimer = setTimeout(() => {
            this.refetchTimer = null;
            void this.loadNotifications();
          }, 500);
        },
      )
      .subscribe();
  }

  private readonly typeIdCache = new Map<string, number>();

  async fireNotification(
    recipientId: string,
    actorId: string,
    typeName: string,
    referenceId?: number,
    referenceType?: string,
  ): Promise<void> {
    if (recipientId === actorId) return;
    try {
      const supabase = await this.supabaseService.getClient();
      let typeId = this.typeIdCache.get(typeName);
      if (typeId === undefined) {
        const { data: typeRow } = await supabase
          .from('notifications_type')
          .select('notifications_typeid')
          .eq('notifications_type', typeName)
          .single();
        if (!typeRow) return;
        typeId = typeRow['notifications_typeid'] as number;
        this.typeIdCache.set(typeName, typeId);
      }
      await supabase.from('notifications').insert({
        user_id: recipientId,
        actor_user_id: actorId,
        notifications_typeid: typeId,
        reference_id: referenceId ?? null,
        reference_type: referenceType ?? null,
        read_status: false,
      });
    } catch {
      // fire-and-forget — never block the UI action
    }
  }

  unsubscribe(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
    this.subscribedUserId = null;
    this.unreadCount$.next(0);
    this.notifications$.next([]);
  }
}
