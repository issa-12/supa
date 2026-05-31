import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  NotificationsService,
  AppNotification,
  NOTIFICATION_LABELS,
} from '../../../core/services/notifications.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { timeAgo } from '../../../core/util/time-ago';
import { TranslationService, NOTIFICATIONS_COPY, LanguageCode } from '../../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [],
  template: `
    <div class="panel-overlay" (click)="close.emit()"></div>
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">{{ copy.notificationsPanelTitle }}</h3>
        @if (hasUnread) {
          <button class="mark-all-btn" (click)="markAllRead()">{{ copy.markAllReadBtn }}</button>
        }
      </div>

      @if (isLoading) {
        <div class="panel-state">{{ copy.loadingMsg }}</div>
      } @else if (notifications.length === 0) {
        <div class="panel-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p>{{ copy.noNotificationsMsg }}</p>
        </div>
      } @else {
        <ul class="notif-list">
          @for (n of notifications; track n.id) {
            <li class="notif-item" [class.notif-item--unread]="!n.isRead" (click)="onNotifClick(n)">
              <div class="notif-avatar">
                @if (n.actorAvatarUrl) {
                  <img [src]="n.actorAvatarUrl" [alt]="n.actorName" />
                } @else {
                  <span>{{ (n.actorName || '?').charAt(0).toUpperCase() }}</span>
                }
              </div>
              <div class="notif-body">
                <p class="notif-text">
                  <strong>{{ n.actorName }}</strong> {{ label(n.type) }}
                </p>
                <time class="notif-time">{{ timeAgo(n.createdAt) }}</time>
              </div>
              @if (!n.isRead) {
                <div class="notif-dot"></div>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .panel-overlay {
      position: fixed;
      inset: 0;
      z-index: 90;
    }

    .panel {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      width: 360px;
      max-height: 480px;
      background: var(--surface);
      border-radius: 20px;
      border: 1px solid transparent;
       overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 100;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 20px 14px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .panel-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .mark-all-btn {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary);
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 0;

      &:hover { opacity: 0.7; }
    }

    .panel-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 24px;
      color: var(--muted-foreground);
      font-size: 14px;

      svg { opacity: 0.35; }
      p { margin: 0; }
    }

    .notif-list {
      list-style: none;
      margin: 0;
      padding: 8px 0;
      overflow-y: auto;
      flex: 1;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 20px;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;

      &:hover { background: var(--border); }

      &--unread { background: var(--primary-soft); }
    }

    .notif-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
      overflow: hidden;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;

      img { width: 100%; height: 100%; object-fit: cover; }
      span { color: #fff; font-size: 16px; font-weight: 700; }
    }

    .notif-body {
      flex: 1;
      min-width: 0;
    }

    .notif-text {
      font-size: 14px;
      color: var(--foreground);
      margin: 0 0 4px;
      line-height: 1.4;

      strong { font-weight: 700; }
    }

    .notif-time {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .notif-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary);
      flex-shrink: 0;
      margin-top: 6px;
    }

    @media (max-width: 480px) {
      .panel {
        width: calc(100vw - 32px);
        right: -16px;
      }
    }
  `],
})
export class NotificationsPanelComponent {
  @Input() notifications: AppNotification[] = [];
  @Input() isLoading = false;
  @Output() close = new EventEmitter<void>();

  private readonly notificationsService = inject(NotificationsService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return NOTIFICATIONS_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  get hasUnread(): boolean {
    return this.notifications.some((n) => !n.isRead);
  }

  label(type: string): string {
    return NOTIFICATION_LABELS[type] ?? 'interacted with you';
  }

  async onNotifClick(n: AppNotification): Promise<void> {
    if (!n.isRead) this.notificationsService.markAsRead(n.id);
    this.close.emit();
    await this.navigate(n);
  }

  private async navigate(n: AppNotification): Promise<void> {
    if (n.type === 'book_recommended' && n.referenceId) {
      const supabase = await this.supabaseService.getClient();
      const { data } = await supabase
        .from('books')
        .select('google_books_id')
        .eq('book_id', n.referenceId)
        .single();
      if (data?.['google_books_id']) {
        this.router.navigate(['/books', data['google_books_id']]);
      }
    } else if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      this.router.navigate(['/profile', n.actorId]);
    }
  }

  markAllRead(): void {
    this.notificationsService.markAllAsRead();
  }

  readonly timeAgo = timeAgo;
}
