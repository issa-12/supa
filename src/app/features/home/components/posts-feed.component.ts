import { Component, ElementRef, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivityService, ActivityPost } from '../../../core/services/activity.service';
import { LikesService } from '../../../core/services/likes.service';
import { BookService } from '../../../core/services/book.service';
import { SupabaseService, RealtimeSubscription } from '../../../core/services/supabase.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog.service';
import { timeAgo } from '../../../core/util/time-ago';
import { detectLang } from '../../../core/util/detect-lang';
import { TranslationService, HOME_COPY, LanguageCode } from '../../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostCommentsComponent } from './post-comments.component';
import { LikesPopupComponent } from '../../../shared/likes-popup.component';

interface BookSearchResult {
  googleId: string;
  title: string;
  author: string;
  coverUrl: string | null;
}

@Component({
  selector: 'app-posts-feed',
  standalone: true,
  imports: [FormsModule, RouterLink, PostCommentsComponent, LikesPopupComponent],
  template: `
    <div class="feed-col">

      <!-- Compose Card -->
      @if (currentUserId) {
        <div #composeCard class="compose-card" [class.compose-card--expanded]="composeOpen">

          <!-- Input row -->
          @if (!composeOpen) {
            <button class="compose-input-row" (click)="openCompose()">
              <div class="compose-avatar">
                @if (currentUserAvatar) {
            <img [src]="currentUserAvatar" [alt]="copy.currentUserAlt" loading="lazy" (error)="currentUserAvatar = null" />
                } @else {
                  <span>{{ currentUserInitial }}</span>
                }
              </div>
              <span class="compose-placeholder">{{ copy.composePlaceholder }}</span>
            </button>
          } @else {
            <div class="compose-input-row compose-input-row--open">
              <div class="compose-avatar">
                @if (currentUserAvatar) {
                  <img [src]="currentUserAvatar" [alt]="copy.currentUserAlt" loading="lazy" (error)="currentUserAvatar = null" />
                } @else {
                  <span>{{ currentUserInitial }}</span>
                }
              </div>
              <textarea
                #composeTextarea
                class="compose-textarea"
                [(ngModel)]="postContent"
                [placeholder]="copy.composeTextareaPlaceholder"
                rows="3"
              ></textarea>
            </div>

            <!-- Book picker -->
            <div class="book-picker">
              @if (selectedBook) {
                <div class="selected-book">
                  @if (selectedBook.coverUrl) {
                    <img [src]="selectedBook.coverUrl" [alt]="selectedBook.title" class="selected-book-cover" loading="lazy" />
                  }
                  <div class="selected-book-info">
                    <span class="selected-book-title">{{ selectedBook.title }}</span>
                    <span class="selected-book-author">{{ selectedBook.author }}</span>
                  </div>
                  <button class="clear-book" (click)="clearBook()" [attr.aria-label]="copy.feedAriaRemoveBook">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              } @else {
                <div class="book-search-bar">
                  <svg class="book-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  <input
                    class="book-search-input"
                    type="text"
                    [placeholder]="copy.bookSearchPlaceholder"
                    [(ngModel)]="bookQuery"
                    (ngModelChange)="onBookQueryChange()"
                  />
                </div>
                @if (bookResults.length > 0) {
                  <ul class="book-results">
                    @for (b of bookResults; track b.googleId) {
                      <li class="book-result-item" (click)="selectBook(b)">
                        @if (b.coverUrl) {
                          <img [src]="b.coverUrl" [alt]="b.title" class="book-result-cover" loading="lazy" />
                        }
                        <div>
                          <p class="book-result-title">{{ b.title }}</p>
                          <p class="book-result-author">{{ b.author }}</p>
                        </div>
                      </li>
                    }
                  </ul>
                }
              }
            </div>

            @if (postError) {
              <p class="compose-error">{{ postError }}</p>
            }
          }

          <!-- Bottom row — always visible -->
          <div class="compose-bottom">
            @if (composeOpen) {
              <button class="btn-cancel" (click)="closeCompose()">{{ copy.cancelBtn }}</button>
              <button
                class="btn-post"
                [disabled]="!canPost || submitting"
                (click)="submitPost()"
              >
                {{ submitting ? copy.postingBtn : copy.postBtn }}
              </button>
            } @else {
              <button class="tag-book-pill" type="button" (click)="openCompose()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                {{ copy.tagBookBtn }}
              </button>
              <button class="btn-post" (click)="openCompose()">{{ copy.postBtn }}</button>
            }
          </div>
        </div>
      }

      <!-- Feed -->
      <div class="feed-header">
        <div class="feed-tabs">
          <button class="feed-tab" [class.feed-tab--active]="activeTab === 'friends'" (click)="switchTab('friends')">{{ copy.friendsTab }}</button>
          <button class="feed-tab" [class.feed-tab--active]="activeTab === 'trending'" (click)="switchTab('trending')">{{ copy.trendingTab }}</button>
        </div>
      </div>

      @if (loading) {
        <div class="feed-state">
          <div class="spinner"></div>
        </div>
      } @else if ((activeTab === 'friends' ? posts : trendingPosts).length === 0) {
        <div class="feed-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>{{ activeTab === 'friends' ? copy.noPostsFriendsMsg : copy.noTrendingPostsMsg }}</p>
        </div>
      } @else {
        <div class="posts-list">
          @for (post of (activeTab === 'friends' ? posts : trendingPosts); track post.id) {
            <article class="post-card post-card--preview" [routerLink]="['/community']" [queryParams]="{ post: post.id }">
              <div class="post-header">
                <div class="post-avatar">
                  @if (post.userAvatar) {
                    <img [src]="post.userAvatar" [alt]="post.userName" loading="lazy" (error)="post.userAvatar = null" />
                  } @else {
                    <span>{{ (post.userName || '?').charAt(0).toUpperCase() }}</span>
                  }
                </div>
                <div class="post-meta-col">
                  <span class="post-author">{{ post.userName }}</span>
                  <time class="post-time">{{ timeAgo(post.createdAt, lang) }}</time>
                </div>
                @if (post.bookTitle) {
                  <span class="post-book-badge">{{ post.bookTitle }}</span>
                }
              </div>

              <p class="post-content">{{ post.content }}</p>

              @if (post.tags && post.tags.length > 0) {
                <div class="post-tags">
                  @for (tag of post.tags; track tag) {
                    <span class="tag-pill">#{{ tag }}</span>
                  }
                </div>
              }

              <div class="post-footer">
                <span class="post-stat">
                  <svg width="13" height="13" viewBox="0 0 24 24" [attr.fill]="post.isLikedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" [style.color]="post.isLikedByMe ? '#E9783F' : 'currentColor'">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {{ post.likeCount }}
                </span>
                <span class="post-stat">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {{ post.commentCount }}
                </span>
              </div>
            </article>
          }
        </div>
      }
    </div>

    @if (likesPopup && currentUserId) {
      <app-likes-popup
        [type]="likesPopup.type"
        [entityId]="likesPopup.entityId"
        [count]="likesPopup.count"
        [currentUserId]="currentUserId"
        (closed)="likesPopup = null"
      />
    }
  `,
  styles: [`
    :host {
      display: contents;
      --ui-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      --display-serif: 'PT Serif', Georgia, 'Times New Roman', serif;
    }

    .feed-col {
      display: flex;
      flex-direction: column;
      gap: 14px;
      font-family: var(--ui-sans);
    }

    // ── Compose card ──────────────────────────────────────────

    // White "invitation" card: clear boundary so users know this is the composer.
    .compose-card {
      background: #fff;
      border-radius: 14px;
      border: 0.5px solid rgba(100, 70, 50, 0.2);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .compose-input-row {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: start;
      padding: 0;
      font-family: inherit;

      &:hover .compose-placeholder { color: var(--foreground); }

      &--open { align-items: flex-start; cursor: default; }
    }

    .compose-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      flex-shrink: 0;
      overflow: hidden;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;

      img { width: 100%; height: 100%; object-fit: cover; }
      span { color: #fff; font-size: 13px; font-weight: 700; }
    }

    .compose-placeholder {
      font-size: 13px;
      color: var(--muted-foreground);
      transition: color 0.15s;
    }

    .compose-textarea {
      flex: 1;
      min-width: 0;
      padding: 4px 0;
      border: none;
      background: transparent;
      font-size: 14px;
      color: var(--foreground);
      resize: none;
      outline: none;
      font-family: inherit;
      box-sizing: border-box;

      &::placeholder { color: var(--muted-foreground); }
    }

    .compose-bottom {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .tag-book-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-inline-end: auto;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: transparent;
      font-size: 12px;
      font-weight: 500;
      color: var(--muted-foreground);
      cursor: pointer;
      font-family: inherit;
      transition: color 0.15s, border-color 0.15s, background 0.15s;

      svg { flex-shrink: 0; }
      &:hover { color: var(--primary); border-color: rgba(217, 119, 87, 0.4); background: var(--primary-soft); }
    }

    .book-picker { display: flex; flex-direction: column; gap: 8px; }

    .book-search-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: transparent;

      &:focus-within { border-color: var(--primary); }
    }

    .book-search-icon { color: var(--muted-foreground); flex-shrink: 0; }

    .book-search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 13px;
      color: var(--foreground);
      outline: none;
      &::placeholder { color: var(--muted-foreground); }
    }

    .book-results {
      list-style: none;
      margin: 0;
      padding: 4px 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      max-height: 200px;
      overflow-y: auto;
    }

    .book-result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.15s;

      &:hover { background: var(--primary-soft); }
    }

    .book-result-cover {
      width: 32px;
      height: 48px;
      object-fit: cover;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .book-result-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .book-result-author {
      font-size: 12px;
      color: var(--muted-foreground);
      margin: 0;
    }

    .selected-book {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--primary-soft);
      border-radius: 10px;
      border: 1px solid rgba(217, 119, 87, 0.2);
    }

    .selected-book-cover {
      width: 28px;
      height: 42px;
      object-fit: cover;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .selected-book-info { flex: 1; min-width: 0; }

    .selected-book-title {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .selected-book-author {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .clear-book {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted-foreground);
      padding: 4px;
      border-radius: 50%;
      display: flex;

      &:hover { color: var(--foreground); background: var(--border); }
    }

    .compose-error {
      color: var(--destructive);
      background: rgba(220, 38, 38, 0.07);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      margin: 0 0 10px;
    }

    .btn-cancel {
      padding: 9px 18px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: transparent;
      font-size: 13px;
      font-weight: 600;
      color: var(--muted-foreground);
      cursor: pointer;
      font-family: inherit;

      &:hover { background: var(--surface-alt); }
    }

    .btn-post {
      padding: 9px 20px;
      border-radius: 10px;
      border: none;
      background: var(--primary);
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s, opacity 0.2s;

      &:disabled { opacity: 0.45; cursor: not-allowed; }
      &:not(:disabled):hover { background: var(--accent); }
    }

    // ── Feed ──────────────────────────────────────────────────

    .feed-header {
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--border);
    }

    .feed-tabs { display: flex; gap: 0; }

    .feed-tab {
      padding: 8px 16px;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      font-size: 13px;
      font-weight: 500;
      color: var(--muted-foreground);
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;
      margin-bottom: -1px;

      &:hover { color: var(--foreground); }
      &--active { color: var(--primary); font-weight: 600; border-bottom-color: var(--primary); }
    }

    .feed-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 40px 20px;
      color: var(--muted-foreground);
      font-size: 14px;
      text-align: center;

      svg { opacity: 0.35; }
      p { margin: 0; }
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(217, 119, 87, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .posts-list { display: flex; flex-direction: column; }

    .post-card {
      background: transparent;
      border-bottom: 1px solid var(--border);
      // Transparent accent rail by default → terracotta on hover (no layout shift).
      border-inline-start: 2px solid transparent;
      padding-block: 16px;
      padding-inline: 12px 2px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: border-inline-start-color 0.15s, background 0.15s;

      &:last-child { border-bottom: none; }
      &:hover {
        border-inline-start-color: rgba(193, 85, 58, 0.25);
        background: rgba(193, 85, 58, 0.02);
      }
    }

    .post-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .post-author-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      min-width: 0;

      &:hover .post-author { color: var(--primary); }
    }

    .post-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
      overflow: hidden;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;

      img { width: 100%; height: 100%; object-fit: cover; }
      span { color: #fff; font-size: 14px; font-weight: 700; }
    }

    .post-author {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      transition: color 0.15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .post-time {
      font-size: 11px;
      color: var(--muted-foreground);
      margin-inline-start: auto;
      flex-shrink: 0;
    }

    .post-delete {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted-foreground);
      padding: 4px;
      border-radius: 6px;
      display: flex;
      opacity: 0;
      transition: opacity 0.15s;

      .post-card:hover & { opacity: 1; }
      &:hover { color: #dc2626; background: rgba(220, 38, 38, 0.08); }
    }

    .post-content {
      font-family: var(--display-serif);
      font-style: italic;
      font-size: 14px;
      line-height: 1.55;
      color: var(--foreground);
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag-pill {
      padding: 2px 9px;
      border-radius: 999px;
      border: 1px solid rgba(217, 119, 87, 0.22);
      background: var(--primary-soft);
      font-size: 12px;
      font-weight: 600;
      color: var(--primary);
    }

    .post-book {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 11px;
      background: #F5EFE6;
      border-radius: 9px;
      border: 1px solid var(--border);
      text-decoration: none;
      transition: background 0.15s, border-color 0.15s;

      &:hover { background: var(--primary-soft); border-color: rgba(217, 119, 87, 0.2); }
    }

    .post-book-cover {
      width: 28px;
      height: 42px;
      object-fit: cover;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .post-book-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--muted-foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .post-card--preview {
      cursor: pointer;
      text-decoration: none;
      display: block;
      &:hover { background: var(--surface-alt, #f5f0e8); }
    }

    .post-meta-col {
      display: flex;
      flex-direction: column;
      gap: 1px;
      flex: 1;
      min-width: 0;
    }

    .post-book-badge {
      font-size: 11px;
      color: var(--primary);
      background: rgba(233,120,63,0.1);
      border-radius: 999px;
      padding: 2px 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 110px;
      flex-shrink: 0;
    }

    .post-footer {
      display: flex;
      align-items: center;
      gap: 12px;
      border-top: 0.5px solid rgba(100, 70, 50, 0.08);
      padding-top: 8px;
    }

    .post-stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted-foreground);
      svg { flex-shrink: 0; }
    }

    .post-content {
      overflow-wrap: break-word;
      word-break: break-word;
    }

    @media (max-width: 1024px) {
      .feed-col { display: flex; }
    }
  `],
})
export class PostsFeedComponent implements OnInit, OnChanges, OnDestroy {
  @Input() currentUserId: string | null = null;
  @Input() currentUserAvatar: string | null = null;
  @Input() currentUserName: string | null = null;

  private readonly activityService = inject(ActivityService);
  private readonly likesService = inject(LikesService);
  private readonly bookService = inject(BookService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return HOME_COPY[this.lang]; }

  posts: ActivityPost[] = [];
  trendingPosts: ActivityPost[] = [];
  activeTab: 'friends' | 'trending' = 'friends';
  loading = false;
  openCommentPostIds = new Set<number>();

  @ViewChild('composeCard') private composeCard?: ElementRef<HTMLElement>;
  @ViewChild('composeTextarea') private composeTextarea?: ElementRef<HTMLTextAreaElement>;

  composeOpen = false;
  postContent = '';
  bookQuery = '';
  bookResults: BookSearchResult[] = [];
  selectedBook: BookSearchResult | null = null;
  submitting = false;
  postError: string | null = null;

  private bookSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private realtimeSub: RealtimeSubscription | null = null;

  private translatedTexts = new Map<number, Map<string, string>>();
  translatingIds = new Set<number>();
  activeTranslations = new Set<number>();

  likesPopup: { type: 'post' | 'comment'; entityId: number; count: number } | null = null;
  private realtimeTimer: ReturnType<typeof setTimeout> | null = null;
  private realtimeStarted = false;
  private destroyed = false;

  get currentUserInitial(): string {
    return (this.currentUserName ?? 'R')[0].toUpperCase();
  }

  get canPost(): boolean {
    return this.postContent.trim().length > 0 && this.selectedBook !== null;
  }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => {
      this.lang = l;
      this.activeTranslations = new Set();
    });
  }

  ngOnInit(): void {
    if (this.currentUserId) {
      this.loadFeed();
      void this.setupRealtime();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const id = changes['currentUserId'];
    if (id && id.currentValue && id.currentValue !== id.previousValue) {
      this.loadFeed();
      void this.setupRealtime();
    }
  }

  private trendingFetchedAt = 0;
  private readonly TRENDING_TTL_MS = 60_000;

  switchTab(tab: 'friends' | 'trending'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    if (tab === 'trending') {
      const stale = Date.now() - this.trendingFetchedAt > this.TRENDING_TTL_MS;
      if (this.trendingPosts.length === 0 || stale) this.loadTrending();
    }
  }

  private loadFeed(silent = false): void {
    if (!silent) this.loading = true;
    this.activityService.getFriendActivity(this.currentUserId!, 30).subscribe({
      next: (posts) => { this.posts = posts; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  private loadTrending(silent = false): void {
    if (!silent) this.loading = true;
    this.activityService.getTrendingPosts(this.currentUserId!, 20).subscribe({
      next: (posts) => {
        this.trendingPosts = posts;
        this.trendingFetchedAt = Date.now();
        this.loading = false;
      },
      error: () => { this.trendingPosts = []; this.loading = false; },
    });
  }

  // Live-update the feed when anyone the viewer can see posts (or removes a
  // post). The raw event only says "posts changed", so we re-fetch the current
  // tab — that keeps all the server-side friend/privacy/moderation filtering
  // authoritative instead of trying to merge a raw row client-side. The refresh
  // is silent (no spinner) and `track post.id` preserves open comment panels.
  private async setupRealtime(): Promise<void> {
    // Synchronous guard: ngOnChanges (first change) and ngOnInit both call this
    // before the first await resolves, which would otherwise open two channels.
    if (this.realtimeStarted) return;
    this.realtimeStarted = true;
    const sub = await this.supabaseService.createRealtimeSubscription('home-feed', {
      tables: ['posts'],
      onChange: () => this.scheduleRealtimeRefresh(),
      onReconnect: () => this.scheduleRealtimeRefresh(),
    });
    if (this.destroyed) { void sub.teardown(); return; }
    this.realtimeSub = sub;
  }

  private scheduleRealtimeRefresh(): void {
    if (this.realtimeTimer) clearTimeout(this.realtimeTimer);
    this.realtimeTimer = setTimeout(() => {
      this.realtimeTimer = null;
      if (this.activeTab === 'friends') this.loadFeed(true);
      else this.loadTrending(true);
    }, 700);
  }

  openCompose(): void {
    this.composeOpen = true;
    // The compose form sits at the top of the feed; if the user triggered it
    // from the home FAB while scrolled down, bring it into view and focus the
    // textarea so they can start typing immediately. setTimeout lets the form
    // render first (it's behind @if (composeOpen)).
    setTimeout(() => {
      this.composeCard?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.composeTextarea?.nativeElement.focus({ preventScroll: true });
    });
  }

  closeCompose(): void {
    this.composeOpen = false;
    this.postContent = '';
    this.bookQuery = '';
    this.bookResults = [];
    this.selectedBook = null;
    this.postError = null;
  }

  onBookQueryChange(): void {
    if (this.bookSearchTimer) clearTimeout(this.bookSearchTimer);
    const q = this.bookQuery.trim();
    if (q.length < 2) { this.bookResults = []; return; }
    this.bookSearchTimer = setTimeout(() => this.searchBooks(q), 400);
  }

  private async searchBooks(q: string): Promise<void> {
    try {
      const session = await this.supabaseService.getCurrentSession();
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}&maxResults=5`, {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      if (!res.ok) return;
      const data = await res.json() as { books?: BookSearchResult[] };
      this.bookResults = data.books ?? [];
    } catch {
      this.bookResults = [];
    }
  }

  selectBook(book: BookSearchResult): void {
    this.selectedBook = book;
    this.bookQuery = '';
    this.bookResults = [];
  }

  clearBook(): void { this.selectedBook = null; }

  async submitPost(): Promise<void> {
    if (!this.canPost || !this.currentUserId || !this.selectedBook) return;
    this.submitting = true;
    this.postError = null;
    try {
      const bookId = await this.ensureBookInDb(this.selectedBook);
      // Route through the moderated backend endpoint (same as the community
      // page) so home-feed posts are checked too. Rejects profanity/abuse.
      const post = await this.activityService.createCommunityPost(
        this.currentUserId,
        bookId,
        this.postContent.trim(),
        [],
      );
      this.posts = [post, ...this.posts];
      this.closeCompose();
    } catch (err) {
      this.postError = (err as { status?: number })?.status === 422
        ? this.copy.contentRejected
        : this.copy.postFailed;
    } finally {
      this.submitting = false;
    }
  }

  private async ensureBookInDb(book: BookSearchResult): Promise<number> {
    // public.books is no longer client-writable — create it server-side.
    return this.bookService.ensureBookViaApi({
      googleId: book.googleId, title: book.title, author: book.author, coverUrl: book.coverUrl,
    });
  }

  toggleComments(postId: number): void {
    if (this.openCommentPostIds.has(postId)) {
      this.openCommentPostIds.delete(postId);
    } else {
      this.openCommentPostIds.add(postId);
    }
    this.openCommentPostIds = new Set(this.openCommentPostIds);
  }

  onToggleLike(post: ActivityPost): void {
    if (!this.currentUserId) return;
    const wasLiked = post.isLikedByMe;
    post.isLikedByMe = !wasLiked;
    post.likeCount += wasLiked ? -1 : 1;
    this.likesService.togglePostLike(post.id, this.currentUserId, post.userId, wasLiked).subscribe({
      error: () => {
        post.isLikedByMe = wasLiked;
        post.likeCount += wasLiked ? 1 : -1;
      },
    });
  }

  async deletePost(post: ActivityPost): Promise<void> {
    if (!(await this.confirmDialog.confirm({ message: this.copy.deletePostConfirm, danger: true }))) return;
    const prev = [...this.posts];
    this.posts = this.posts.filter((p) => p.id !== post.id);
    this.activityService.deletePost(post.id).subscribe({
      error: () => { this.posts = prev; },
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.realtimeTimer) clearTimeout(this.realtimeTimer);
    if (this.bookSearchTimer) clearTimeout(this.bookSearchTimer);
    void this.realtimeSub?.teardown();
  }

  readonly timeAgo = timeAgo;

  openLikesPopup(type: 'post' | 'comment', entityId: number, count: number, event: MouseEvent): void {
    event.stopPropagation();
    this.likesPopup = { type, entityId, count };
  }

  getPostContent(post: ActivityPost): string {
    if (!this.activeTranslations.has(post.id)) return post.content;
    return this.translatedTexts.get(post.id)?.get(this.lang) ?? post.content;
  }

  async translatePost(post: ActivityPost): Promise<void> {
    const postId = post.id;

    if (this.activeTranslations.has(postId)) {
      this.activeTranslations = new Set([...this.activeTranslations].filter(id => id !== postId));
      return;
    }

    const cached = this.translatedTexts.get(postId)?.get(this.lang);
    if (cached) {
      this.activeTranslations = new Set([...this.activeTranslations, postId]);
      return;
    }

    const targetLang = this.lang;
    const sourceLang = detectLang(post.content);
    if (sourceLang === targetLang) return;

    this.translatingIds = new Set([...this.translatingIds, postId]);
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(post.content)}&langpair=${sourceLang}|${targetLang}`
      );
      const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
      if (data?.responseStatus !== 200) return;
      const translated = data?.responseData?.translatedText ?? '';
      if (translated && translated.trim() !== post.content.trim()) {
        const map = this.translatedTexts.get(postId) ?? new Map<string, string>();
        map.set(this.lang, translated);
        this.translatedTexts.set(postId, map);
        this.activeTranslations = new Set([...this.activeTranslations, postId]);
      }
    } catch { /* silently ignore */ }
    finally {
      this.translatingIds = new Set([...this.translatingIds].filter(id => id !== postId));
    }
  }
}
