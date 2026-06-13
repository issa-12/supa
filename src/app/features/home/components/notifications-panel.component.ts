import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  NotificationsService,
  AppNotification,
} from '../../../core/services/notifications.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { timeAgo } from '../../../core/util/time-ago';
import { TranslationService, NOTIFICATIONS_COPY, NotificationsCopy, LanguageCode } from '../../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const LABEL_KEY_BY_TYPE: Record<string, keyof NotificationsCopy> = {
  friend_request: 'friendRequestSent',
  friend_accepted: 'friendRequestAccepted',
  book_recommended: 'bookRecommended',
  post_liked: 'postLiked',
  post_commented: 'postCommented',
  comment_liked: 'commentLiked',
  comment_replied: 'commentReply',
  review_liked: 'reviewLiked',
  friend_posted: 'newPost',
};

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
      } @else if (loadError) {
        <div class="panel-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>{{ copy.loadErrorMsg }}</p>
          <button class="retry-btn" (click)="reload.emit()">{{ copy.retryBtn }}</button>
        </div>
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
                  <img [src]="n.actorAvatarUrl" [alt]="n.actorName" loading="lazy" (error)="n.actorAvatarUrl = null" />
                } @else {
                  <span>{{ (n.actorName || '?').charAt(0).toUpperCase() }}</span>
                }
              </div>
              <div class="notif-body">
                <p class="notif-text">
                  <strong>{{ n.actorName }}</strong> {{ label(n.type) }}
                </p>
                <time class="notif-time">{{ timeAgo(n.createdAt, lang) }}</time>
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
      inset-inline-end: 0;
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

    .retry-btn {
      margin-top: 4px;
      font-size: 13px;
      font-weight: 600;
      color: var(--primary);
      background: var(--primary-soft);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 7px 18px;
      cursor: pointer;
      transition: opacity 0.15s;

      &:hover { opacity: 0.8; }
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
      /* Fixed sheet so the home page's .app-viewport (overflow:hidden) can't
         clip the dropdown, and it never runs off-screen. Sits below the nav. */
      .panel {
        position: fixed;
        top: 124px;
        inset-inline: 8px;
        width: auto;
        max-height: calc(100vh - 140px);
      }
    }
  `],
})
export class NotificationsPanelComponent implements OnInit, OnDestroy {
  @Input() notifications: AppNotification[] = [];
  @Input() isLoading = false;
  @Input() loadError = false;
  @Output() close = new EventEmitter<void>();
  @Output() reload = new EventEmitter<void>();

  private readonly notificationsService = inject(NotificationsService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return NOTIFICATIONS_COPY[this.lang]; }

  // Re-render once a minute so the relative timestamps ("2m ago") stay accurate
  // while the panel is open, without re-fetching from the server.
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  ngOnInit(): void {
    this.tickInterval = setInterval(() => this.cdr.markForCheck(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  get hasUnread(): boolean {
    return this.notifications.some((n) => !n.isRead);
  }

  label(type: string): string {
    const key = LABEL_KEY_BY_TYPE[type];
    return key ? this.copy[key] : this.copy.interactedWithYou;
  }

  onNotifClick(n: AppNotification): void {
    if (!n.isRead) void this.notificationsService.markAsRead(n.id);
    this.close.emit();
    void this.navigate(n);
  }

  private async navigate(n: AppNotification): Promise<void> {
    try {
      if (n.type === 'book_recommended' && n.referenceId) {
        const supabase = await this.supabaseService.getClient();
        const { data } = await supabase
          .from('books')
          .select('google_books_id')
          .eq('book_id', n.referenceId)
          .maybeSingle();
        if (data?.['google_books_id']) {
          this.router.navigate(['/books', data['google_books_id']]);
        }
      } else if (n.type === 'friend_request' || n.type === 'friend_accepted') {
        this.router.navigate(['/profile', n.actorId]);
      }
    } catch {
      // navigation is best-effort — never surface a routing/lookup error
    }
  }

  markAllRead(): void {
    void this.notificationsService.markAllAsRead();
  }

  readonly timeAgo = timeAgo;
}
