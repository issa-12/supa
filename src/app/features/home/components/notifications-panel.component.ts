import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  NotificationsService,
  AppNotification,
} from '../../../core/services/notifications.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BookService } from '../../../core/services/book.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog.service';
import { timeAgo } from '../../../core/util/time-ago';
import { TranslationService, NOTIFICATIONS_COPY, NotificationsCopy, LanguageCode } from '../../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// SVG icon paths per notification type (viewBox 0 0 24 24)
const TYPE_ICON: Record<string, { path: string; color: string }> = {
  friend_request:   { color: '#6366F1', path: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6' },
  friend_accepted:  { color: '#22C55E', path: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M16 11l2 2 4-4' },
  post_liked:       { color: '#E9783F', path: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
  post_commented:   { color: '#3B82F6', path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  comment_liked:    { color: '#E9783F', path: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
  comment_replied:  { color: '#3B82F6', path: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z' },
  review_liked:     { color: '#F59E0B', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  book_recommended: { color: '#E9783F', path: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
  friend_posted:    { color: '#8B5CF6', path: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13' },
};

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [],
  template: `
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">{{ copy.notificationsPanelTitle }}</h3>
        <div class="panel-actions">
          @if (hasUnread) {
            <button class="mark-all-btn" (click)="markAllRead()">{{ copy.markAllReadBtn }}</button>
          }
          @if (notifications.length > 0) {
            <button class="clear-all-btn" (click)="clearAll()">{{ copy.clearAllBtn }}</button>
          }
        </div>
      </div>

      @if (!isLoading && !loadError && notifications.length > 0) {
        <div class="filter-row">
          @for (f of filters; track f.key) {
            <button class="filter-pill" [class.filter-pill--active]="activeFilter === f.key" (click)="activeFilter = f.key" [title]="f.label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="f.icon" />
              </svg>
            </button>
          }
        </div>
      }

      @if (isLoading) {
        <div class="panel-state">{{ copy.loadingMsg }}</div>
      } @else if (loadError) {
        <div class="panel-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>{{ copy.loadErrorMsg }}</p>
          <button class="retry-btn" (click)="reload.emit()">{{ copy.retryBtn }}</button>
        </div>
      } @else if (filteredNotifications.length === 0) {
        <div class="panel-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p>{{ copy.noNotificationsMsg }}</p>
        </div>
      } @else {
        <ul class="notif-list">
          @for (n of filteredNotifications; track n.id) {
            <li class="notif-item" [class.notif-item--unread]="!n.isRead" (click)="onNotifClick(n)">

              <!-- Avatar with type-icon badge -->
              <div class="notif-avatar-wrap">
                <div class="notif-avatar">
                  @if (n.actorAvatarUrl) {
                    <img [src]="n.actorAvatarUrl" [alt]="n.actorName" loading="lazy" (error)="n.actorAvatarUrl = null" />
                  } @else {
                    <span>{{ (n.actorName || '?').charAt(0).toUpperCase() }}</span>
                  }
                </div>
                @if (typeIcon(n.type)) {
                  <span class="notif-type-badge" [style.background]="typeIcon(n.type)!.color">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path [attr.d]="typeIcon(n.type)!.path" />
                    </svg>
                  </span>
                }
              </div>

              <!-- Body: name + time (no text label) -->
              <div class="notif-body">
                <p class="notif-text"><strong>{{ n.actorName }}</strong></p>
                <time class="notif-time">{{ timeAgo(n.createdAt, lang) }}</time>
                @if (n.type === 'book_recommended' && n.referenceId && pendingRecBookIds.has(n.referenceId) && !handledRecIds.has(n.id)) {
                  <div class="notif-actions" (click)="$event.stopPropagation()">
                    <button class="notif-accept" (click)="acceptRec(n, $event)" [disabled]="processingRecId === n.id">{{ copy.acceptBtn }}</button>
                    <button class="notif-decline" (click)="declineRec(n, $event)" [disabled]="processingRecId === n.id">{{ copy.declineBtn }}</button>
                  </div>
                }
              </div>

              <div class="notif-aside">
                <button class="notif-dismiss" (click)="dismiss(n, $event)" [attr.aria-label]="copy.dismissAriaLabel">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                @if (!n.isRead) {
                  <div class="notif-dot"></div>
                }
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .panel {
      position: absolute;
      top: calc(100% + clamp(6px, 0.83vw, 12px));
      inset-inline-end: 0;
      width: min(clamp(280px, 25vw, 360px), 92vw);
      max-height: min(480px, 65vh);
      background: var(--surface);
      border-radius: clamp(14px, 1.4vw, 20px);
      border: 1px solid transparent;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 100;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: clamp(10px, 1.1vw, 16px) clamp(12px, 1.4vw, 18px) clamp(8px, 0.83vw, 12px);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .panel-title {
      font-size: clamp(13px, 1.1vw, 16px);
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .panel-actions {
      display: flex;
      align-items: center;
      gap: clamp(8px, 0.97vw, 14px);
    }

    .mark-all-btn {
      font-size: clamp(11px, 0.9vw, 13px);
      font-weight: 600;
      color: var(--primary);
      background: none;
      border: none;
      cursor: pointer;
      padding: clamp(2px, 0.28vw, 4px) 0;
      white-space: nowrap;
      &:hover { opacity: 0.7; }
    }

    .clear-all-btn {
      font-size: clamp(11px, 0.9vw, 13px);
      font-weight: 600;
      color: var(--muted-foreground);
      background: none;
      border: none;
      cursor: pointer;
      padding: clamp(2px, 0.28vw, 4px) 0;
      white-space: nowrap;
      &:hover { color: var(--destructive); }
    }

    .panel-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(8px, 0.83vw, 12px);
      padding: clamp(28px, 3.3vw, 48px) clamp(14px, 1.7vw, 24px);
      color: var(--muted-foreground);
      font-size: clamp(12px, 0.97vw, 14px);
      svg { opacity: 0.35; width: clamp(28px, 2.8vw, 40px); height: clamp(28px, 2.8vw, 40px); }
      p { margin: 0; }
    }

    .retry-btn {
      margin-top: clamp(2px, 0.28vw, 4px);
      font-size: clamp(11px, 0.9vw, 13px);
      font-weight: 600;
      color: var(--primary);
      background: var(--primary-soft);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: clamp(5px, 0.49vw, 7px) clamp(12px, 1.25vw, 18px);
      cursor: pointer;
      transition: opacity 0.15s;
      &:hover { opacity: 0.8; }
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: clamp(4px, 0.42vw, 6px);
      padding: clamp(6px, 0.56vw, 8px) clamp(10px, 1.1vw, 16px);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      overflow-x: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .filter-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      width: clamp(22px, 2.1vw, 30px);
      height: clamp(22px, 2.1vw, 30px);
      border-radius: 50%;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted-foreground);
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.13s, color 0.13s, border-color 0.13s;
      svg { width: clamp(10px, 0.9vw, 13px); height: clamp(10px, 0.9vw, 13px); }
      &:hover { background: var(--surface-alt); color: var(--foreground); }
      &--active {
        background: var(--primary-soft);
        color: var(--primary);
        border-color: var(--primary);
      }
    }

    .notif-list {
      list-style: none;
      margin: 0;
      padding: clamp(4px, 0.56vw, 8px) 0;
      overflow-y: auto;
      flex: 1;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: clamp(8px, 0.83vw, 12px);
      padding: clamp(8px, 0.83vw, 12px) clamp(12px, 1.4vw, 20px);
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
      &:hover { background: var(--border); }
      &--unread { background: var(--primary-soft); }
    }

    .notif-avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .notif-avatar {
      width: clamp(30px, 2.8vw, 40px);
      height: clamp(30px, 2.8vw, 40px);
      border-radius: 50%;
      overflow: hidden;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      img { width: 100%; height: 100%; object-fit: cover; }
      span { color: #fff; font-size: clamp(12px, 1.1vw, 16px); font-weight: 700; }
    }

    .notif-type-badge {
      position: absolute;
      bottom: -2px;
      inset-inline-end: -2px;
      width: clamp(14px, 1.25vw, 18px);
      height: clamp(14px, 1.25vw, 18px);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid var(--surface, #fff);
      svg { width: clamp(7px, 0.7vw, 10px); height: clamp(7px, 0.7vw, 10px); }
    }

    .notif-body {
      flex: 1;
      min-width: 0;
    }

    .notif-text {
      font-size: clamp(11px, 0.97vw, 14px);
      color: var(--foreground);
      margin: 0 0 clamp(2px, 0.28vw, 4px);
      line-height: 1.4;
      strong { font-weight: 700; }
    }

    .notif-time {
      font-size: clamp(10px, 0.83vw, 12px);
      color: var(--muted-foreground);
    }

    .notif-actions {
      display: flex;
      gap: clamp(5px, 0.56vw, 8px);
      margin-top: clamp(5px, 0.56vw, 8px);
    }

    .notif-accept,
    .notif-decline {
      padding: clamp(3px, 0.35vw, 5px) clamp(8px, 0.97vw, 14px);
      font-size: clamp(10px, 0.83vw, 12px);
      font-weight: 600;
      border-radius: 999px;
      cursor: pointer;
      transition: opacity 0.15s, background 0.15s;
      &:disabled { opacity: 0.55; cursor: default; }
    }

    .notif-accept {
      background: var(--primary);
      color: #fff;
      border: 1px solid var(--primary);
      &:hover:not(:disabled) { opacity: 0.9; }
    }

    .notif-decline {
      background: transparent;
      color: var(--muted-foreground);
      border: 1px solid var(--border);
      &:hover:not(:disabled) { background: var(--border); }
    }

    .notif-aside {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(5px, 0.56vw, 8px);
      flex-shrink: 0;
    }

    .notif-dismiss {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted-foreground);
      padding: 2px;
      display: flex;
      align-items: center;
      border-radius: 6px;
      opacity: 0.55;
      transition: opacity 0.15s, background 0.15s, color 0.15s;
      svg { width: clamp(11px, 0.97vw, 14px); height: clamp(11px, 0.97vw, 14px); }
      &:hover { opacity: 1; color: var(--foreground); background: var(--border); }
    }

    .notif-dot {
      width: clamp(6px, 0.56vw, 8px);
      height: clamp(6px, 0.56vw, 8px);
      border-radius: 50%;
      background: var(--primary);
      flex-shrink: 0;
    }

    @media (max-width: 480px) {
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
  private readonly bookService = inject(BookService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);
  private readonly cdr = inject(ChangeDetectorRef);

  private currentUserId: string | null = null;
  protected readonly handledRecIds = new Set<number>();
  protected processingRecId: number | null = null;
  protected pendingRecBookIds = new Set<number>();

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return NOTIFICATIONS_COPY[this.lang]; }

  protected activeFilter: 'all' | 'friends' | 'likes' | 'comments' | 'books' = 'all';

  private static readonly FILTER_TYPES: Record<string, string[]> = {
    friends:  ['friend_request', 'friend_accepted'],
    likes:    ['post_liked', 'comment_liked', 'review_liked'],
    comments: ['post_commented', 'comment_replied'],
    books:    ['book_recommended', 'friend_posted'],
  };

  protected readonly filters = [
    { key: 'all' as const,      label: 'All',      icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { key: 'friends' as const,  label: 'Friends',  icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
    { key: 'likes' as const,    label: 'Likes',    icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
    { key: 'comments' as const, label: 'Comments', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
    { key: 'books' as const,    label: 'Books',    icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
  ];

  protected get filteredNotifications() {
    if (this.activeFilter === 'all') return this.notifications;
    const types = NotificationsPanelComponent.FILTER_TYPES[this.activeFilter] ?? [];
    return this.notifications.filter(n => types.includes(n.type));
  }

  private tickInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  ngOnInit(): void {
    this.tickInterval = setInterval(() => this.cdr.markForCheck(), 60_000);
    void this.resolveCurrentUser();
  }

  private async resolveCurrentUser(): Promise<void> {
    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUserId = user?.id ?? null;
      if (this.currentUserId) {
        this.pendingRecBookIds = await this.bookService.getPendingRecommendationBookIds(this.currentUserId);
        this.cdr.markForCheck();
      }
    } catch { /* best-effort */ }
  }

  typeIcon(type: string): { path: string; color: string } | null {
    return TYPE_ICON[type] ?? null;
  }

  dismiss(n: AppNotification, event: Event): void {
    event.stopPropagation();
    void this.notificationsService.deleteNotification(n.id);
  }

  async acceptRec(n: AppNotification, event: Event): Promise<void> {
    event.stopPropagation();
    if (!n.referenceId || !this.currentUserId || this.processingRecId === n.id) return;
    this.processingRecId = n.id;
    try {
      const userBookId = await this.bookService.findPendingRecommendationUserBookId(this.currentUserId, n.referenceId);
      if (userBookId != null) await firstValueFrom(this.bookService.acceptFriendRecommendation(userBookId));
      this.handledRecIds.add(n.id);
      if (!n.isRead) void this.notificationsService.markAsRead(n.id);
    } catch (err) {
      console.error('[Notifications] accept recommendation failed:', err);
    } finally {
      this.processingRecId = null;
      this.cdr.markForCheck();
    }
  }

  async declineRec(n: AppNotification, event: Event): Promise<void> {
    event.stopPropagation();
    if (!n.referenceId || !this.currentUserId || this.processingRecId === n.id) return;
    this.processingRecId = n.id;
    try {
      const userBookId = await this.bookService.findPendingRecommendationUserBookId(this.currentUserId, n.referenceId);
      if (userBookId != null) await firstValueFrom(this.bookService.declineFriendRecommendation(userBookId));
      this.handledRecIds.add(n.id);
      if (!n.isRead) void this.notificationsService.markAsRead(n.id);
    } catch (err) {
      console.error('[Notifications] decline recommendation failed:', err);
    } finally {
      this.processingRecId = null;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  get hasUnread(): boolean {
    return this.notifications.some(n => !n.isRead);
  }

  onNotifClick(n: AppNotification): void {
    if (!n.isRead) void this.notificationsService.markAsRead(n.id);
    this.close.emit();
    void this.navigate(n);
  }

  private async navigate(n: AppNotification): Promise<void> {
    try {
      const supabase = await this.supabaseService.getClient();

      switch (n.type) {
        case 'friend_request':
        case 'friend_accepted':
          this.router.navigate(['/profile', n.actorId]);
          break;

        case 'post_liked':
        case 'post_commented':
        case 'friend_posted':
          this.router.navigate(['/community'], { queryParams: n.referenceId ? { post: n.referenceId } : {} });
          break;

        case 'comment_liked':
        case 'comment_replied': {
          if (!n.referenceId) { this.router.navigate(['/community']); break; }
          const { data: comment } = await supabase
            .from('comments')
            .select('post_id')
            .eq('comment_id', n.referenceId)
            .maybeSingle();
          const postId = comment?.['post_id'];
          this.router.navigate(['/community'], { queryParams: postId ? { post: postId } : {} });
          break;
        }

        case 'review_liked': {
          if (!n.referenceId) break;
          const { data: ub } = await supabase
            .from('user_books')
            .select('book_id')
            .eq('user_book_id', n.referenceId)
            .maybeSingle();
          if (!ub?.['book_id']) break;
          const { data: book } = await supabase
            .from('books')
            .select('google_books_id')
            .eq('book_id', ub['book_id'])
            .maybeSingle();
          if (book?.['google_books_id']) this.router.navigate(['/books', book['google_books_id']]);
          break;
        }

        case 'book_recommended': {
          if (!n.referenceId) break;
          const { data: b } = await supabase
            .from('books')
            .select('google_books_id')
            .eq('book_id', n.referenceId)
            .maybeSingle();
          if (b?.['google_books_id']) this.router.navigate(['/books', b['google_books_id']]);
          break;
        }
      }
    } catch {
      // navigation is best-effort
    }
  }

  markAllRead(): void {
    void this.notificationsService.markAllAsRead();
  }

  async clearAll(): Promise<void> {
    if (!(await this.confirmDialog.confirm({ message: this.copy.clearAllConfirm, danger: true }))) return;
    void this.notificationsService.deleteAll();
  }

  readonly timeAgo = timeAgo;
}
