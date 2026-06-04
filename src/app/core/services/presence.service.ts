import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

/**
 * Tracks which users are currently online using a single shared Supabase
 * Realtime Presence channel keyed by user id. The channel membership IS the
 * online set — when a user closes the tab / loses connection, Supabase emits a
 * `leave` and drops them from presence state automatically, so there is no
 * stale "online" row to clean up and no DB table to maintain.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly zone = inject(NgZone);

  readonly onlineUserIds$ = new BehaviorSubject<Set<string>>(new Set());

  private channel: RealtimeChannel | null = null;
  private joinedUserId: string | null = null;
  private authListenerSet = false;

  /**
   * Call once at app startup. Joins presence for the current session (if any)
   * and keeps it in sync with auth changes, so presence is app-wide and does
   * not depend on any particular page/component being mounted.
   */
  async init(): Promise<void> {
    const supabase = await this.supabaseService.getClient();

    if (!this.authListenerSet) {
      this.authListenerSet = true;
      supabase.auth.onAuthStateChange((_event, session) => {
        const uid = session?.user?.id ?? null;
        // Defer out of the callback: doing supabase/realtime work synchronously
        // inside onAuthStateChange can deadlock the auth LockManager.
        setTimeout(() => {
          if (uid) void this.join(uid);
          else this.leave();
        }, 0);
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) await this.join(user.id);
  }

  private async join(userId: string): Promise<void> {
    if (this.joinedUserId === userId && this.channel) return;
    this.leave();

    const supabase = await this.supabaseService.getClient();
    this.joinedUserId = userId;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });
    this.channel = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const ids = new Set(Object.keys(channel.presenceState()));
        // Realtime callbacks can fire outside Angular's zone; re-enter it so
        // subscribed components run change detection and the dots update live.
        this.zone.run(() => this.onlineUserIds$.next(ids));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel.track({ online_at: new Date().toISOString() });
        }
      });
  }

  isOnline(userId: string | null | undefined): boolean {
    return !!userId && this.onlineUserIds$.value.has(userId);
  }

  private leave(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.joinedUserId = null;
    if (this.onlineUserIds$.value.size > 0) {
      this.zone.run(() => this.onlineUserIds$.next(new Set()));
    }
  }
}
