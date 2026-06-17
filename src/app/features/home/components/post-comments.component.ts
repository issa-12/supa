import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommentService, Comment } from '../../../core/services/comment.service';
import { LikesService } from '../../../core/services/likes.service';
import { timeAgo } from '../../../core/util/time-ago';
import { TranslationService, COMMENTS_COPY, LanguageCode } from '../../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-post-comments',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="comments-section">
      @if (loading) {
        <div class="comments-loading"><div class="spinner-sm"></div></div>
      } @else {
        @if (comments.length > 0) {
          <div class="comments-list">
            @for (comment of comments; track comment.id) {
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
                    <p class="comment-text">{{ comment.content }}</p>
                  </div>
                  <div class="comment-meta">
                    <button class="meta-btn" [class.meta-btn--liked]="comment.isLikedByMe" (click)="toggleCommentLike(comment)">
                      <svg width="12" height="12" viewBox="0 0 24 24" [attr.fill]="comment.isLikedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      @if (comment.likeCount > 0) { {{ comment.likeCount }} }
                    </button>
                    @if (comment.depth < 3) {
                      <button class="meta-btn" (click)="startReply(comment)">{{ copy.replyBtn }}</button>
                    }
                    <time class="meta-time">{{ timeAgo(comment.createdAt, lang) }}</time>
                    @if (comment.userId === currentUserId) {
                      <button class="meta-btn meta-btn--danger" (click)="deleteComment(comment)">{{ copy.deleteBtn }}</button>
                    }
                  </div>
                  @if (replyingToId === comment.id) {
                    <div class="reply-form">
                      <input class="comment-input" type="text" [placeholder]="copy.replyToPlaceholder + comment.userName + '…'" [(ngModel)]="replyContent" (keydown.enter)="submitReply(comment)" />
                      <button class="send-btn" [disabled]="!replyContent.trim() || submitting" (click)="submitReply(comment)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                      <button class="cancel-reply-btn" (click)="cancelReply()">✕</button>
                    </div>
                  }
                  @for (reply of comment.replies; track reply.id) {
                    <div class="comment" style="margin-top: 8px;">
                      <div class="comment-avatar comment-avatar--sm">
                        @if (reply.userAvatar) { <img [src]="reply.userAvatar" [alt]="reply.userName" loading="lazy" /> }
                        @else { <span>{{ reply.userName[0].toUpperCase() }}</span> }
                      </div>
                      <div class="comment-body">
                        <div class="comment-bubble">
                          <a class="comment-author" [routerLink]="['/profile', reply.userId]">{{ reply.userName }}</a>
                          <p class="comment-text">{{ reply.content }}</p>
                        </div>
                        <div class="comment-meta">
                          <button class="meta-btn" [class.meta-btn--liked]="reply.isLikedByMe" (click)="toggleCommentLike(reply)">
                            <svg width="12" height="12" viewBox="0 0 24 24" [attr.fill]="reply.isLikedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            @if (reply.likeCount > 0) { {{ reply.likeCount }} }
                          </button>
                          @if (reply.depth < 3) { <button class="meta-btn" (click)="startReply(reply)">{{ copy.replyBtn }}</button> }
                          <time class="meta-time">{{ timeAgo(reply.createdAt, lang) }}</time>
                          @if (reply.userId === currentUserId) { <button class="meta-btn meta-btn--danger" (click)="deleteComment(reply)">{{ copy.deleteBtn }}</button> }
                        </div>
                        @if (replyingToId === reply.id) {
                          <div class="reply-form">
                            <input class="comment-input" type="text" [placeholder]="copy.replyToPlaceholder + reply.userName + '…'" [(ngModel)]="replyContent" (keydown.enter)="submitReply(reply)" />
                            <button class="send-btn" [disabled]="!replyContent.trim() || submitting" (click)="submitReply(reply)">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            </button>
                            <button class="cancel-reply-btn" (click)="cancelReply()">✕</button>
                          </div>
                        }
                        @for (deep of reply.replies; track deep.id) {
                          <div class="comment" style="padding-left: 24px; margin-top: 8px;">
                            <div class="comment-avatar comment-avatar--sm">
                              @if (deep.userAvatar) { <img [src]="deep.userAvatar" [alt]="deep.userName" loading="lazy" /> }
                              @else { <span>{{ deep.userName[0].toUpperCase() }}</span> }
                            </div>
                            <div class="comment-body">
                              <div class="comment-bubble">
                                <a class="comment-author" [routerLink]="['/profile', deep.userId]">{{ deep.userName }}</a>
                                <p class="comment-text">{{ deep.content }}</p>
                              </div>
                              <div class="comment-meta">
                                <button class="meta-btn" [class.meta-btn--liked]="deep.isLikedByMe" (click)="toggleCommentLike(deep)">
                                  <svg width="12" height="12" viewBox="0 0 24 24" [attr.fill]="deep.isLikedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                  @if (deep.likeCount > 0) { {{ deep.likeCount }} }
                                </button>
                                <time class="meta-time">{{ timeAgo(deep.createdAt, lang) }}</time>
                                @if (deep.userId === currentUserId) { <button class="meta-btn meta-btn--danger" (click)="deleteComment(deep)">{{ copy.deleteBtn }}</button> }
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
          </div>
        }

        <!-- Add top-level comment -->
        <div class="add-comment">
          <div class="comment-avatar">
            @if (currentUserAvatar) {
              <img [src]="currentUserAvatar" alt="You" loading="lazy" />
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

    .comments-list { display: flex; flex-direction: column; gap: 10px; }

    .comment {
      display: flex;
      gap: 8px;
      align-items: flex-start;
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
      background: var(--border);
      border-radius: 10px;
      padding: 8px 12px;
      display: inline-block;
      max-width: 100%;
    }

    .comment-author {
      font-size: 12px;
      font-weight: 700;
      color: var(--foreground);
      text-decoration: none;
      display: block;
      overflow-wrap: break-word;
      margin-bottom: 2px;

      &:hover { color: var(--primary); }
    }

    .comment-text {
      font-size: 13px;
      color: var(--foreground);
      margin: 0;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .comment-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 3px 4px 0;
    }

    .meta-btn {
      background: none;
      border: none;
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      cursor: pointer;
      padding: 2px 0;
      display: flex;
      align-items: center;
      gap: 3px;
      transition: color 0.15s;

      &:hover { color: var(--foreground); }
      &--liked { color: var(--primary); }
      &--danger:hover { color: #dc2626; }
    }

    .meta-time {
      font-size: 11px;
      color: var(--muted-foreground);
      margin-left: auto;
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
      background: var(--border);
      border-radius: 999px;
      padding: 6px 10px 6px 14px;
      border: 1px solid var(--border);

      &:focus-within { border-color: var(--primary); }
    }

    .comment-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 13px;
      color: var(--foreground);
      outline: none;

      &::placeholder { color: var(--muted-foreground); }
    }

    .send-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--primary);
      padding: 2px;
      display: flex;
      opacity: 0.7;
      transition: opacity 0.15s;

      &:not(:disabled):hover { opacity: 1; }
      &:disabled { opacity: 0.3; cursor: not-allowed; }
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
  `],
})
export class PostCommentsComponent implements OnInit {
  @Input() postId!: number;
  @Input() currentUserId!: string;
  @Input() currentUserAvatar: string | null = null;
  @Input() currentUserName: string | null = null;

  private readonly commentService = inject(CommentService);
  private readonly likesService = inject(LikesService);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return COMMENTS_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  comments: Comment[] = [];
  loading = true;

  newContent = '';
  replyingToId: number | null = null;
  replyContent = '';
  submitting = false;
  commentError: string | null = null;

  get userInitial(): string {
    return (this.currentUserName ?? 'R')[0].toUpperCase();
  }

  ngOnInit(): void {
    this.loadComments();
  }

  private loadComments(): void {
    this.loading = true;
    this.commentService.getComments(this.postId, this.currentUserId).subscribe({
      next: (comments) => { this.comments = comments; this.loading = false; },
      error: () => { this.loading = false; },
    });
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
        this.commentError = err instanceof Error ? err.message : 'Could not post comment.';
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
        this.commentError = err instanceof Error ? err.message : 'Could not post comment.';
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
