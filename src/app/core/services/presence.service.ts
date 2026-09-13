import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

/**
 * Tracks online presence via a DB heartbeat on users.last_seen_at.
 * Every 2 minutes the current user's last_seen_at is updated.
 * isOnline() checks whether a given user's last_seen_at is within
 * the last 5 minutes, fetched on demand via loadPresenceForUser().
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly zone = inject(NgZone);

  readonly onlineUserIds$ = new BehaviorSubject<Set<string>>(new Set());

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private currentUserId: string | null = null;
  private authListenerSet = false;

  async init(): Promise<void> {
    const supabase = await this.supabaseService.getClient();

    if (!this.authListenerSet) {
      this.authListenerSet = true;
      supabase.auth.onAuthStateChange((_event, session) => {
        const uid = session?.user?.id ?? null;
        setTimeout(() => {
          if (uid) void this.startHeartbeat(uid);
          else this.stopHeartbeat();
        }, 0);
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) await this.startHeartbeat(user.id);
  }

  private async startHeartbeat(userId: string): Promise<void> {
    if (this.currentUserId === userId) return;
    this.stopHeartbeat();
    this.currentUserId = userId;
    await this.touch(userId);
    // Run the recurring timer outside Angular: it only does a background DB
    // write, needs no change detection, and an in-zone setInterval would keep
    // the app perpetually "unstable".
    this.zone.runOutsideAngular(() => {
      this.heartbeatTimer = setInterval(() => void this.touch(userId), 120_000);
    });
  }

  private async touch(userId: string): Promise<void> {
    try {
      const supabase = await this.supabaseService.getClient();
      await supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId);
    } catch { /* non-critical */ }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.currentUserId = null;
  }

  async loadPresenceForUser(userId: string): Promise<void> {
    if (!userId) return;
    try {
      const supabase = await this.supabaseService.getClient();
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('users')
        .select('last_seen_at')
        .eq('id', userId)
        .not('last_seen_at', 'is', null)
        .gte('last_seen_at', cutoff)
        .maybeSingle();

      const online = !!data;
      const current = this.onlineUserIds$.value;
      const hasIt = current.has(userId);

      if (online && !hasIt) {
        this.zone.run(() => this.onlineUserIds$.next(new Set([...current, userId])));
      } else if (!online && hasIt) {
        const next = new Set(current);
        next.delete(userId);
        this.zone.run(() => this.onlineUserIds$.next(next));
      }
    } catch { /* non-critical */ }
  }

  // Batched variant of loadPresenceForUser: resolves the online status of
  // many users in a single query instead of one round-trip per id. Used by
  // the profile page to check a whole friends list at once.
  async loadPresenceForUsers(userIds: string[]): Promise<void> {
    const ids = [...new Set(userIds.filter(Boolean))];
    if (!ids.length) return;
    try {
      const supabase = await this.supabaseService.getClient();
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('users')
        .select('id')
        .in('id', ids)
        .not('last_seen_at', 'is', null)
        .gte('last_seen_at', cutoff);

      const onlineNow = new Set((data ?? []).map((r) => r['id'] as string));
      const current = this.onlineUserIds$.value;
      const next = new Set(current);
      let changed = false;

      for (const id of ids) {
        const isOnline = onlineNow.has(id);
        if (isOnline && !next.has(id)) {
          next.add(id);
          changed = true;
        } else if (!isOnline && next.has(id)) {
          next.delete(id);
          changed = true;
        }
      }

      if (changed) this.zone.run(() => this.onlineUserIds$.next(next));
    } catch { /* non-critical */ }
  }

  isOnline(userId: string | null | undefined): boolean {
    return !!userId && this.onlineUserIds$.value.has(userId);
  }
}
