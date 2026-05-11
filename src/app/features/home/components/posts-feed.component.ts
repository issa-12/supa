import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ActivityService, ActivityPost } from '../../../core/services/activity.service';
import { SupabaseService } from '../../../core/services/supabase.service';

interface BookSearchResult {
  googleId: string;
  title: string;
  author: string;
  coverUrl: string | null;
}

@Component({
  selector: 'app-posts-feed',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="feed-col">

      <!-- Compose Card -->
      @if (currentUserId) {
        <div class="compose-card" [class.compose-card--expanded]="composeOpen">

          @if (!composeOpen) {
            <button class="compose-trigger" (click)="openCompose()">
              <div class="compose-avatar">
                @if (currentUserAvatar) {
                  <img [src]="currentUserAvatar" alt="You" />
                } @else {
                  <span>{{ currentUserInitial }}</span>
                }
              </div>
              <span class="compose-placeholder">Share your thoughts on a book…</span>
            </button>
          } @else {
            <div class="compose-form">
              <textarea
                class="compose-textarea"
                [(ngModel)]="postContent"
                placeholder="What did you think? Any quotes? Recommend it?"
                rows="3"
                autofocus
              ></textarea>

              <!-- Book picker -->
              <div class="book-picker">
                @if (selectedBook) {
                  <div class="selected-book">
                    @if (selectedBook.coverUrl) {
                      <img [src]="selectedBook.coverUrl" [alt]="selectedBook.title" class="selected-book-cover" />
                    }
                    <div class="selected-book-info">
                      <span class="selected-book-title">{{ selectedBook.title }}</span>
                      <span class="selected-book-author">{{ selectedBook.author }}</span>
                    </div>
                    <button class="clear-book" (click)="clearBook()" aria-label="Remove book">
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
                      placeholder="Search for a book…"
                      [(ngModel)]="bookQuery"
                      (ngModelChange)="onBookQueryChange()"
                    />
                  </div>
                  @if (bookResults.length > 0) {
                    <ul class="book-results">
                      @for (b of bookResults; track b.googleId) {
                        <li class="book-result-item" (click)="selectBook(b)">
                          @if (b.coverUrl) {
                            <img [src]="b.coverUrl" [alt]="b.title" class="book-result-cover" />
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

              <div class="compose-actions">
                <button class="btn-cancel" (click)="closeCompose()">Cancel</button>
                <button
                  class="btn-post"
                  [disabled]="!canPost || submitting"
                  (click)="submitPost()"
                >
                  {{ submitting ? 'Posting…' : 'Post' }}
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Feed -->
      <div class="feed-header">
        <h3 class="feed-title">Friends Activity</h3>
      </div>

      @if (loading) {
        <div class="feed-state">
          <div class="spinner"></div>
        </div>
      } @else if (posts.length === 0) {
        <div class="feed-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>No posts yet. Add friends and start sharing!</p>
        </div>
      } @else {
        <div class="posts-list">
          @for (post of posts; track post.id) {
            <article class="post-card">
              <div class="post-header">
                <a class="post-author-link" [routerLink]="['/profile', post.userId]">
                  <div class="post-avatar">
                    @if (post.userAvatar) {
                      <img [src]="post.userAvatar" [alt]="post.userName" />
                    } @else {
                      <span>{{ post.userName[0].toUpperCase() }}</span>
                    }
                  </div>
                  <div class="post-meta">
                    <span class="post-author">{{ post.userName }}</span>
                    <time class="post-time">{{ timeAgo(post.createdAt) }}</time>
                  </div>
                </a>
                @if (post.userId === currentUserId) {
                  <button class="post-delete" (click)="deletePost(post)" aria-label="Delete post">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                }
              </div>

              <p class="post-content">{{ post.content }}</p>

              @if (post.bookTitle) {
                <a class="post-book" [routerLink]="['/books/search']" [queryParams]="{ q: post.bookTitle }">
                  @if (post.bookCover) {
                    <img [src]="post.bookCover" [alt]="post.bookTitle" class="post-book-cover" />
                  }
                  <span class="post-book-title">{{ post.bookTitle }}</span>
                </a>
              }

              <div class="post-footer">
                <span class="post-likes">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {{ post.likeCount }}
                </span>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .feed-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    // ── Compose card ──────────────────────────────────────────

    .compose-card {
      background: rgba(255, 250, 245, 0.8);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 16px rgba(51, 38, 29, 0.05);
      overflow: hidden;
      transition: box-shadow 0.2s;

      &--expanded { box-shadow: 0 8px 32px rgba(51, 38, 29, 0.1); }
    }

    .compose-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;

      &:hover .compose-placeholder { color: var(--foreground); }
    }

    .compose-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
      overflow: hidden;
      background: linear-gradient(135deg, var(--primary) 0%, var(--warning) 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      img { width: 100%; height: 100%; object-fit: cover; }
      span { color: #fff; font-size: 14px; font-weight: 700; }
    }

    .compose-placeholder {
      font-size: 14px;
      color: var(--muted-foreground);
      transition: color 0.15s;
    }

    .compose-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }

    .compose-textarea {
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid rgba(126, 107, 93, 0.2);
      background: rgba(255, 255, 255, 0.5);
      font-size: 14px;
      color: var(--foreground);
      resize: vertical;
      outline: none;
      font-family: inherit;
      box-sizing: border-box;

      &:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(233, 120, 63, 0.1); }
      &::placeholder { color: var(--muted-foreground); }
    }

    .book-picker { display: flex; flex-direction: column; gap: 8px; }

    .book-search-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(126, 107, 93, 0.2);
      background: rgba(255, 255, 255, 0.5);

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
      background: rgba(255, 250, 245, 0.95);
      border: 1px solid rgba(126, 107, 93, 0.15);
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

      &:hover { background: rgba(233, 120, 63, 0.06); }
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
      background: rgba(233, 120, 63, 0.08);
      border-radius: 10px;
      border: 1px solid rgba(233, 120, 63, 0.2);
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

      &:hover { color: var(--foreground); background: rgba(126, 107, 93, 0.1); }
    }

    .compose-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-cancel {
      padding: 8px 16px;
      border-radius: 999px;
      border: 1px solid rgba(126, 107, 93, 0.25);
      background: transparent;
      font-size: 13px;
      font-weight: 600;
      color: var(--muted-foreground);
      cursor: pointer;

      &:hover { background: rgba(126, 107, 93, 0.06); }
    }

    .btn-post {
      padding: 8px 20px;
      border-radius: 999px;
      border: none;
      background: linear-gradient(135deg, var(--primary) 0%, var(--warning) 100%);
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      transition: opacity 0.2s;

      &:disabled { opacity: 0.45; cursor: not-allowed; }
      &:not(:disabled):hover { opacity: 0.9; }
    }

    // ── Feed ──────────────────────────────────────────────────

    .feed-header { display: flex; align-items: center; justify-content: space-between; }

    .feed-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
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
      border: 3px solid rgba(233, 120, 63, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .posts-list { display: flex; flex-direction: column; gap: 16px; }

    .post-card {
      background: rgba(255, 250, 245, 0.7);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 12px rgba(51, 38, 29, 0.04);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .post-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }

    .post-author-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;

      &:hover .post-author { color: var(--primary); }
    }

    .post-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
      overflow: hidden;
      background: linear-gradient(135deg, var(--primary) 0%, var(--warning) 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      img { width: 100%; height: 100%; object-fit: cover; }
      span { color: #fff; font-size: 14px; font-weight: 700; }
    }

    .post-meta { display: flex; flex-direction: column; gap: 2px; }

    .post-author {
      font-size: 14px;
      font-weight: 700;
      color: var(--foreground);
      transition: color 0.15s;
    }

    .post-time { font-size: 12px; color: var(--muted-foreground); }

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
      font-size: 14px;
      line-height: 1.6;
      color: var(--foreground);
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .post-book {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: rgba(126, 107, 93, 0.06);
      border-radius: 10px;
      border: 1px solid rgba(126, 107, 93, 0.12);
      text-decoration: none;
      transition: background 0.15s;

      &:hover { background: rgba(233, 120, 63, 0.08); border-color: rgba(233, 120, 63, 0.2); }
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

    .post-footer { display: flex; align-items: center; gap: 16px; }

    .post-likes {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: var(--muted-foreground);

      svg { flex-shrink: 0; }
    }

    @media (max-width: 1024px) {
      .feed-col { display: flex; }
    }
  `],
})
export class PostsFeedComponent implements OnInit, OnChanges {
  @Input() currentUserId: string | null = null;
  @Input() currentUserAvatar: string | null = null;
  @Input() currentUserName: string | null = null;

  private readonly activityService = inject(ActivityService);
  private readonly supabaseService = inject(SupabaseService);

  posts: ActivityPost[] = [];
  loading = false;

  composeOpen = false;
  postContent = '';
  bookQuery = '';
  bookResults: BookSearchResult[] = [];
  selectedBook: BookSearchResult | null = null;
  submitting = false;

  private bookSearchTimer: ReturnType<typeof setTimeout> | null = null;

  get currentUserInitial(): string {
    return (this.currentUserName ?? 'R')[0].toUpperCase();
  }

  get canPost(): boolean {
    return this.postContent.trim().length > 0 && this.selectedBook !== null;
  }

  ngOnInit(): void {
    if (this.currentUserId) this.loadFeed();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const id = changes['currentUserId'];
    if (id && id.currentValue && id.currentValue !== id.previousValue) {
      this.loadFeed();
    }
  }

  private loadFeed(): void {
    this.loading = true;
    this.activityService.getFriendActivity(this.currentUserId!, 30).subscribe({
      next: (posts) => { this.posts = posts; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openCompose(): void { this.composeOpen = true; }

  closeCompose(): void {
    this.composeOpen = false;
    this.postContent = '';
    this.bookQuery = '';
    this.bookResults = [];
    this.selectedBook = null;
  }

  onBookQueryChange(): void {
    if (this.bookSearchTimer) clearTimeout(this.bookSearchTimer);
    const q = this.bookQuery.trim();
    if (!q) { this.bookResults = []; return; }
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
    try {
      const bookId = await this.ensureBookInDb(this.selectedBook);
      this.activityService.createPost(this.currentUserId, bookId, this.postContent.trim()).subscribe({
        next: (post) => {
          this.posts = [post, ...this.posts];
          this.closeCompose();
          this.submitting = false;
        },
        error: () => { this.submitting = false; },
      });
    } catch {
      this.submitting = false;
    }
  }

  private async ensureBookInDb(book: BookSearchResult): Promise<number> {
    const supabase = await this.supabaseService.getClient();
    const { data: existing } = await supabase
      .from('books')
      .select('book_id')
      .eq('google_books_id', book.googleId)
      .maybeSingle();

    if (existing) return existing['book_id'] as number;

    const { data: inserted, error } = await supabase
      .from('books')
      .insert({
        title: book.title,
        author_name: book.author,
        cover_image_url: book.coverUrl,
        google_books_id: book.googleId,
      })
      .select('book_id')
      .single();

    if (error || !inserted) throw error ?? new Error('Failed to save book');
    return inserted['book_id'] as number;
  }

  deletePost(post: ActivityPost): void {
    this.activityService.deletePost(post.id).subscribe({
      next: () => { this.posts = this.posts.filter((p) => p.id !== post.id); },
    });
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
}
