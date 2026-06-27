import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommentService, Comment } from '../../../core/services/comment.service';
import { LikesService } from '../../../core/services/likes.service';
import { SupabaseService, RealtimeSubscription } from '../../../core/services/supabase.service';
import { timeAgo } from '../../../core/util/time-ago';
import { TranslationService, COMMENTS_COPY, LanguageCode } from '../../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LikesPopupComponent } from '../../../shared/likes-popup.component';
import { detectLang } from '../../../core/util/detect-lang';

@Component({
  selector: 'app-post-comments',
  standalone: true,
  imports: [FormsModule, RouterLink, LikesPopupComponent],
  template: `
    <div class="comments-section">
      @if (loading) {
        <div class="comments-loading"><div class="spinner-sm"></div></div>
      } @else {
        @if (comments.length > 0) {
          <div class="comments-list">
            @for (comment of visibleComments; track comment.id) {
              <div class="comment">
                <div class="comment-avatar">
                  @if (comment.userAvatar) {
                    <img [src]="comment.userAvatar" [alt]="comment.userName" loading="lazy" />
                  } @else {
                    <span>{{ comment.userName[0].toUpperCase() }}</span>
                  }
                </div>
                <div class="comment-body">
                  <div class="comment-bubble">
                    <a class="comment-author" [routerLink]="['/profile', comment.userId]">{{ comment.userName }}</a>
                    <p class="comment-text">{{ getCommentContent(comment) }}</p>
                  </div>
                  <div class="comment-meta">
                    <span class="meta-like-group">
                      <button class="meta-btn" [class.meta-btn--liked]="comment.isLikedByMe" (click)="toggleCommentLike(comment)">
                        <svg width="12" height="12" viewBox="0 0 24 24" [attr.fill]="comment.isLikedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </button>
                      @if (comment.likeCount > 0) {
                        <button class="meta-like-count" [class.meta-like-count--liked]="comment.isLikedByMe" (click)="openLikesPopup(comment.id, comment.likeCount, $event)">{{ comment.likeCount }}</button>
                      }
                    </span>
                    <time class="meta-time">{{ timeAgo(comment.createdAt, lang) }}</time>
                    <button class="meta-translate" [class.meta-translate--active]="activeTranslations.has(comment.id)" [disabled]="translatingIds.has(comment.id)" (click)="translateComment(comment)">
                      @if (translatingIds.has(comment.id)) {
                        <span class="spinner-sm"></span>
                      } @else {
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>
                        {{ activeTranslations.has(comment.id) ? copy.showOriginalBtn : copy.translateBtn }}
                      }
                    </button>
                    @if (comment.userId === currentUserId) {
                      <button class="meta-btn meta-btn--danger" [attr.aria-label]="copy.deleteBtn" (click)="deleteComment(comment)">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    }
                  </div>
                  @for (reply of comment.replies; track reply.id) {
                    <div class="comment comment--reply">
                      <div class="comment-avatar comment-avatar--sm">
                        @if (reply.userAvatar) { <img [src]="reply.userAvatar" [alt]="reply.userName" loading="lazy" /> }
                        @else { <span>{{ reply.userName[0].toUpperCase() }}</span> }
                      </div>
                      <div class="comment-body">
                        <div class="comment-bubble">
                          <a class="comment-author" [routerLink]="['/profile', reply.userId]">{{ reply.userName }}</a>
                          <p class="comment-text">{{ getCommentContent(reply) }}</p>
                        </div>
                        <div class="comment-meta">
                          <span class="meta-like-group">
                            <button class="meta-btn" [class.meta-btn--liked]="reply.isLikedByMe" (click)="toggleCommentLike(reply)">
                              <svg width="12" height="12" viewBox="0 0 24 24" [attr.fill]="reply.isLikedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            </button>
                            @if (reply.likeCount > 0) {
                              <button class="meta-like-count" [class.meta-like-count--liked]="reply.isLikedByMe" (click)="openLikesPopup(reply.id, reply.likeCount, $event)">{{ reply.likeCount }}</button>
                            }
                          </span>
                          <time class="meta-time">{{ timeAgo(reply.createdAt, lang) }}</time>
                          <button class="meta-translate" [class.meta-translate--active]="activeTranslations.has(reply.id)" [disabled]="translatingIds.has(reply.id)" (click)="translateComment(reply)">
                            @if (translatingIds.has(reply.id)) {
                              <span class="spinner-sm"></span>
                            } @else {
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>
                              {{ activeTranslations.has(reply.id) ? copy.showOriginalBtn : copy.translateBtn }}
                            }
                          </button>
                          @if (reply.userId === currentUserId) { <button class="meta-btn meta-btn--danger" [attr.aria-label]="copy.deleteBtn" (click)="deleteComment(reply)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button> }
                        </div>
                        @for (deep of reply.replies; track deep.id) {
                          <div class="comment comment--deep-reply">
                            <div class="comment-avatar comment-avatar--sm">
                              @if (deep.userAvatar) { <img [src]="deep.userAvatar" [alt]="deep.userName" loading="lazy" /> }
                              @else { <span>{{ deep.userName[0].toUpperCase() }}</span> }
                            </div>
                            <div class="comment-body">
                              <div class="comment-bubble">
                                <a class="comment-author" [routerLink]="['/profile', deep.userId]">{{ deep.userName }}</a>
                                <p class="comment-text">{{ getCommentContent(deep) }}</p>
                              </div>
                              <div class="comment-meta">
                                <span class="meta-like-group">
                                  <button class="meta-btn" [class.meta-btn--liked]="deep.isLikedByMe" (click)="toggleCommentLike(deep)">
                                    <svg width="12" height="12" viewBox="0 0 24 24" [attr.fill]="deep.isLikedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                  </button>
                                  @if (deep.likeCount > 0) {
                                    <button class="meta-like-count" [class.meta-like-count--liked]="deep.isLikedByMe" (click)="openLikesPopup(deep.id, deep.likeCount, $event)">{{ deep.likeCount }}</button>
                                  }
                                </span>
                                <time class="meta-time">{{ timeAgo(deep.createdAt, lang) }}</time>
                                <button class="meta-translate" [class.meta-translate--active]="activeTranslations.has(deep.id)" [disabled]="translatingIds.has(deep.id)" (click)="translateComment(deep)">
                                  @if (translatingIds.has(deep.id)) {
                                    <span class="spinner-sm"></span>
                                  } @else {
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>
                                    {{ activeTranslations.has(deep.id) ? copy.showOriginalBtn : copy.translateBtn }}
                                  }
                                </button>
                                @if (deep.userId === currentUserId) { <button class="meta-btn meta-btn--danger" [attr.aria-label]="copy.deleteBtn" (click)="deleteComment(deep)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button> }
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            @if (comments.length > 2) {
              <button type="button" class="view-comments-toggle" (click)="toggleCommentsExpanded()">
                {{ commentsExpanded ? copy.hideComments : copy.viewAllComments.replace('{count}', comments.length.toString()) }}
              </button>
            }
          </div>
        }

        <!-- Add top-level comment -->
        <div class="add-comment">
          <div class="comment-avatar">
            @if (currentUserAvatar) {
              <img [src]="currentUserAvatar" [alt]="copy.currentUserAlt" loading="lazy" />
            } @else {
              <span>{{ userInitial }}</span>
            }
          </div>
          <div class="comment-input-row">
            <input
              class="comment-input"
              type="text"
              [placeholder]="copy.commentPlaceholder"
              [(ngModel)]="newContent"
              (keydown.enter)="submitComment()"
            />
            <button class="send-btn" [disabled]="!newContent.trim() || submitting" (click)="submitComment()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          @if (commentError) {
            <p class="comment-error">{{ commentError }}</p>
          }
        </div>
      }
    </div>

    @if (likesPopup) {
      <app-likes-popup
        type="comment"
        [entityId]="likesPopup.entityId"
        [count]="likesPopup.count"
        [currentUserId]="currentUserId"
        (closed)="likesPopup = null"
      />
    }
  `,
  styles: [`
    :host { display: block; }

    .comments-section {
      border-top: 1px solid var(--border);
      padding-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .comments-loading {
      display: flex;
      justify-content: center;
      padding: 16px;
    }

    .spinner-sm {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(217, 119, 87, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .comments-list { display: flex; flex-direction: column; }

    .view-comments-toggle {
      display: block;
      background: none;
      border: none;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      color: #C1553A;
      cursor: pointer;
      padding: 4px 0;
      margin-top: 4px;
      text-align: start;

      &:hover { text-decoration: underline; }
    }

    .comments-list > .comment {
      padding: 12px 0;
      border-bottom: 0.5px solid rgba(100, 70, 50, 0.08);
    }
    .comments-list > .comment:first-child { padding-top: 0; }
    .comments-list > .comment:last-child { padding-bottom: 0; border-bottom: none; }

    .comment {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .comment--reply,
    .comment--deep-reply {
      margin-top: 8px;
    }

    .comment--deep-reply {
      padding-inline-start: 24px;
    }

    .comment-avatar {
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
      span { color: #fff; font-size: 11px; font-weight: 700; }

      &--sm { width: 26px; height: 26px; }
    }

    .comment-body { flex: 1; min-width: 0; }

    .comment-bubble {
      background: transparent;
      border-radius: 0;
      padding: 0;
      display: block;
      max-width: 100%;
    }

    .comment-author {
      font-size: 13px;
      font-weight: 600;
      color: #1C1410;
      text-decoration: none;
      display: block;
      overflow-wrap: break-word;
      margin-bottom: 3px;

      &:hover { color: var(--primary); }
    }

    .comment-text {
      font-size: 13px;
      color: #4A3828;
      margin: 0;
      line-height: 1.55;
      font-style: normal;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .comment-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 6px;
      direction: ltr;
    }

    .meta-btn {
      background: none;
      border: none;
      font-size: 12px;
      font-weight: 400;
      color: #9E8E82;
      cursor: pointer;
      padding: 2px 0;
      display: flex;
      align-items: center;
      gap: 3px;
      transition: color 0.15s;

      &:hover { color: #C1553A; }
      &--liked { color: var(--primary); }
      &--danger:hover { color: #C1553A; }
    }

    .meta-like-group {
      display: flex;
      align-items: center;
    }

    .meta-like-count {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      color: #9E8E82;
      padding: 2px 4px 2px 1px;
      border-radius: 4px;
      transition: color 0.15s;
      &:hover { color: #C1553A; }
      &--liked { color: var(--primary); }
    }

    .meta-time {
      font-size: 11px;
      color: #9E8E82;
    }

    .reply-form {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
    }

    .add-comment {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .comment-error {
      color: var(--destructive);
      font-size: 12px;
      margin: 6px 0 0;
    }

    .comment-input-row {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      background: #FFFFFF;
      border-radius: 20px;
      padding: 9px 16px;
      border: 0.5px solid rgba(100, 70, 50, 0.18);

      &:focus-within { border-color: rgba(193, 85, 58, 0.35); }
    }

    .comment-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 13px;
      color: var(--foreground);
      outline: none;

      &::placeholder { color: #9E8E82; }
    }

    .send-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #C1553A;
      padding: 2px;
      display: flex;
      transition: color 0.15s;

      &:not(:disabled):hover { color: #A8432A; }
      &:disabled { color: #C0B0A0; cursor: not-allowed; }
    }

    .cancel-reply-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 11px;
      color: var(--muted-foreground);
      padding: 2px 4px;
      border-radius: 4px;

      &:hover { background: var(--border); }
    }

    .meta-translate {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 11px;
      color: #9E8E82;
      padding: 2px 5px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 3px;
      transition: color 0.15s, background 0.15s;

      &:hover { color: var(--primary); background: rgba(233,120,63,0.08); }
      &--active { color: var(--primary); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  `],
})
export class PostCommentsComponent implements OnInit, OnDestroy {
  @Input() postId!: number;
  @Input() currentUserId!: string;
  @Input() currentUserAvatar: string | null = null;
  @Input() currentUserName: string | null = null;

  private readonly commentService = inject(CommentService);
  private readonly likesService = inject(LikesService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly translationService = inject(TranslationService);

  private realtimeSub: RealtimeSubscription | null = null;
  private realtimeTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return COMMENTS_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => {
      this.lang = l;
      this.activeTranslations = new Set();
    });
  }

  comments: Comment[] = [];
  loading = true;
  commentsExpanded = false;

  // Collapse long comment threads: show 2 by default, toggle to show all.
  // Purely UI state — all comments are already loaded.
  get visibleComments(): Comment[] {
    return this.commentsExpanded ? this.comments : this.comments.slice(0, 2);
  }

  toggleCommentsExpanded(): void {
    this.commentsExpanded = !this.commentsExpanded;
  }

  newContent = '';
  replyingToId: number | null = null;
  replyContent = '';
  submitting = false;
  commentError: string | null = null;
  likesPopup: { entityId: number; count: number } | null = null;

  openLikesPopup(commentId: number, count: number, event: MouseEvent): void {
    event.stopPropagation();
    this.likesPopup = { entityId: commentId, count };
  }

  private translatedTexts = new Map<number, Map<string, string>>();
  translatingIds = new Set<number>();
  activeTranslations = new Set<number>();

  getCommentContent(comment: Comment): string {
    if (!this.activeTranslations.has(comment.id)) return comment.content;
    return this.translatedTexts.get(comment.id)?.get(this.lang) ?? comment.content;
  }

  async translateComment(comment: Comment): Promise<void> {
    const id = comment.id;
    if (this.activeTranslations.has(id)) {
      this.activeTranslations = new Set([...this.activeTranslations].filter(x => x !== id));
      return;
    }
    const cached = this.translatedTexts.get(id)?.get(this.lang);
    if (cached) {
      this.activeTranslations = new Set([...this.activeTranslations, id]);
      return;
    }
    const sourceLang = detectLang(comment.content);
    if (sourceLang === this.lang) return;
    this.translatingIds = new Set([...this.translatingIds, id]);
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(comment.content)}&langpair=${sourceLang}|${this.lang}`
      );
      const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
      if (data?.responseStatus !== 200) return;
      const translated = data?.responseData?.translatedText ?? '';
      if (translated && translated.trim() !== comment.content.trim()) {
        const map = this.translatedTexts.get(id) ?? new Map<string, string>();
        map.set(this.lang, translated);
        this.translatedTexts.set(id, map);
        this.activeTranslations = new Set([...this.activeTranslations, id]);
      }
    } catch { /* ignore */ }
    finally {
      this.translatingIds = new Set([...this.translatingIds].filter(x => x !== id));
    }
  }

  get userInitial(): string {
    return (this.currentUserName ?? 'R')[0].toUpperCase();
  }

  ngOnInit(): void {
    this.loadComments();
    void this.setupRealtime();
  }

  private loadComments(silent = false): void {
    if (!silent) this.loading = true;
    this.commentService.getComments(this.postId, this.currentUserId).subscribe({
      next: (comments) => { this.comments = comments; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // Live-update this post's comments when anyone adds/removes one. Scoped to
  // this post via the row filter so an open panel only reacts to its own thread.
  // Silent reload keeps the server-side block/privacy filtering + tree-build
  // authoritative.
  private async setupRealtime(): Promise<void> {
    if (this.realtimeSub) return;
    const sub = await this.supabaseService.createRealtimeSubscription('post-comments', {
      tables: ['comments'],
      filter: `post_id=eq.${this.postId}`,
      onChange: () => this.scheduleRealtimeRefresh(),
      onReconnect: () => this.scheduleRealtimeRefresh(),
    });
    // The panel can be toggled shut before the channel resolves — don't leak it.
    if (this.destroyed) { void sub.teardown(); return; }
    this.realtimeSub = sub;
  }

  private scheduleRealtimeRefresh(): void {
    if (this.realtimeTimer) clearTimeout(this.realtimeTimer);
    this.realtimeTimer = setTimeout(() => {
      this.realtimeTimer = null;
      this.loadComments(true);
    }, 600);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.realtimeTimer) clearTimeout(this.realtimeTimer);
    void this.realtimeSub?.teardown();
  }

  submitComment(): void {
    const text = this.newContent.trim();
    if (!text || this.submitting) return;
    this.submitting = true;
    this.commentError = null;
    this.commentService.addComment(this.postId, this.currentUserId, text).subscribe({
      next: (comment) => {
        this.comments = [...this.comments, comment];
        this.newContent = '';
        this.submitting = false;
      },
      error: (err) => {
        this.commentError = (err as { status?: number })?.status === 422 ? this.copy.contentRejected : this.copy.commentFailed;
        this.submitting = false;
      },
    });
  }

  startReply(comment: Comment): void {
    this.replyingToId = comment.id;
    this.replyContent = '';
  }

  cancelReply(): void {
    this.replyingToId = null;
    this.replyContent = '';
  }

  submitReply(parent: Comment): void {
    const text = this.replyContent.trim();
    if (!text || this.submitting) return;
    this.submitting = true;
    this.commentError = null;
    this.commentService.addComment(this.postId, this.currentUserId, text, parent.id, parent.depth + 1).subscribe({
      next: (reply) => {
        const topLevel = this.findAndAddReply(this.comments, parent.id, reply);
        if (topLevel) this.comments = [...this.comments];
        this.replyingToId = null;
        this.replyContent = '';
        this.submitting = false;
      },
      error: (err) => {
        this.commentError = (err as { status?: number })?.status === 422 ? this.copy.contentRejected : this.copy.commentFailed;
        this.submitting = false;
      },
    });
  }

  private findAndAddReply(list: Comment[], parentId: number, reply: Comment): boolean {
    for (const c of list) {
      if (c.id === parentId) { c.replies = [...c.replies, reply]; return true; }
      if (this.findAndAddReply(c.replies, parentId, reply)) return true;
    }
    return false;
  }

  deleteComment(comment: Comment): void {
    this.commentService.deleteComment(comment.id).subscribe({
      next: () => { this.comments = this.removeComment(this.comments, comment.id); },
    });
  }

  private removeComment(list: Comment[], id: number): Comment[] {
    return list
      .filter((c) => c.id !== id)
      .map((c) => ({ ...c, replies: this.removeComment(c.replies, id) }));
  }

  toggleCommentLike(comment: Comment): void {
    const wasLiked = comment.isLikedByMe;
    comment.isLikedByMe = !wasLiked;
    comment.likeCount += wasLiked ? -1 : 1;
    this.likesService.toggleCommentLike(comment.id, this.currentUserId, comment.userId, wasLiked).subscribe({
      error: () => {
        comment.isLikedByMe = wasLiked;
        comment.likeCount += wasLiked ? 1 : -1;
      },
    });
  }

  readonly timeAgo = timeAgo;
}
