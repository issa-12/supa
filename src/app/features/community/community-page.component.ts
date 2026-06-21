import { Component, OnInit, OnDestroy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivityService, ActivityPost } from '../../core/services/activity.service';
import { LikesService } from '../../core/services/likes.service';
import { BookService } from '../../core/services/book.service';
import { SupabaseService, RealtimeSubscription } from '../../core/services/supabase.service';
import { PostCommentsComponent } from '../home/components/post-comments.component';
import { TopNavComponent } from '../home/components/top-nav.component';
import { timeAgo } from '../../core/util/time-ago';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { TranslationService, COMMUNITY_COPY, LanguageCode } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface BookResult {
  googleId: string;
  title: string;
  author: string;
  coverUrl: string | null;
}

interface TrendingTag {
  tag: string;
  count: number;
}

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PostCommentsComponent, TopNavComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './community-page.component.html',
  styleUrl: './community-page.component.scss',
})
export class CommunityPageComponent implements OnInit, OnDestroy {
  private readonly activityService = inject(ActivityService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly likesService = inject(LikesService);
  private readonly bookService = inject(BookService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return COMMUNITY_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  currentUserId: string | null = null;
  currentUserAvatar: string | null = null;
  currentUserName: string | null = null;
  currentUserInitial = 'R';

  posts: ActivityPost[] = [];
  loading = false;
  loadingMore = false;
  page = 0;
  hasMore = true;
  activeTab: 'all' | 'friends' | 'mine' | 'trending' = 'all';
  activeTag: string | null = null;
  openCommentPostIds = new Set<number>();

  composeOpen = false;
  postContent = '';
  tagsInput = '';
  bookQuery = '';
  bookResults: BookResult[] = [];
  selectedBook: BookResult | null = null;
  submitting = false;
  submitError: string | null = null;
  private bookSearchTimer: ReturnType<typeof setTimeout> | null = null;

  trendingTags: TrendingTag[] = [];
  tagSearchQuery = '';
  private tagSearchTimer: ReturnType<typeof setTimeout> | null = null;

  private realtimeSub: RealtimeSubscription | null = null;
  private realtimeTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  get canPost(): boolean {
    return this.postContent.trim().length > 0 && this.selectedBook !== null;
  }

  async ngOnInit(): Promise<void> {
    const supabase = await this.supabaseService.getClient();
    const { data: { user } } = await supabase.auth.getUser();
    this.currentUserId = user?.id ?? null;

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('name, profile_picture_url')
        .eq('id', user.id)
        .single();
      this.currentUserName = (profile?.['name'] as string) ?? 'Reader';
      this.currentUserAvatar = (profile?.['profile_picture_url'] as string) ?? null;
      this.currentUserInitial = (this.currentUserName[0] ?? 'R').toUpperCase();
    }

    await Promise.all([this.loadPosts(), this.loadTrendingTags()]);
    void this.setupRealtime();
  }

  // Live-update the community feed when anyone posts/removes a post. The raw
  // event only signals "posts changed", so we silently re-fetch the first page
  // of the current tab/tag — the backend keeps all block/privacy/moderation
  // filtering authoritative. (Mirrors the home feed.)
  private async setupRealtime(): Promise<void> {
    if (this.realtimeSub) return;
    const sub = await this.supabaseService.createRealtimeSubscription('community-feed', {
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
      void this.silentRefresh();
    }, 700);
  }

  // Re-fetch the first page without the loading spinner or clearing the list
  // (avoids flicker; `track post.id` preserves open comment panels).
  private async silentRefresh(): Promise<void> {
    if (!this.currentUserId) return;
    // Don't yank the user back to the top if they've paged past the first page —
    // resetting to page 0 would drop their loaded pages. They'll get fresh
    // content on their next tab switch / manual action instead.
    if (this.page > 1) return;
    try {
      const scope =
        this.activeTab === 'friends' ? 'friends' :
        this.activeTab === 'mine' ? 'mine' : undefined;
      const fresh =
        this.activeTab === 'trending'
          ? await this.activityService.getCommunityTrendingPosts(this.currentUserId)
          : await this.activityService.getCommunityPosts(
              this.currentUserId,
              this.activeTag ?? undefined,
              0,
              scope,
            );
      this.posts = fresh;
      this.page = 1;
      this.hasMore = fresh.length >= 20 && this.activeTab !== 'trending';
    } catch { /* silently ignore */ }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.realtimeTimer) clearTimeout(this.realtimeTimer);
    void this.realtimeSub?.teardown();
  }

  async loadPosts(append = false): Promise<void> {
    if (!this.currentUserId) return;
    if (append) { this.loadingMore = true; }
    else { this.loading = true; this.posts = []; this.page = 0; }

    try {
      const scope =
        this.activeTab === 'friends' ? 'friends' :
        this.activeTab === 'mine' ? 'mine' : undefined;
      const newPosts =
        this.activeTab === 'trending'
          ? await this.activityService.getCommunityTrendingPosts(this.currentUserId)
          : await this.activityService.getCommunityPosts(
              this.currentUserId,
              this.activeTag ?? undefined,
              this.page,
              scope,
            );

      this.posts = append ? [...this.posts, ...newPosts] : newPosts;
      // Only assume "more" if the last fetch returned a full page AND
      // we got at least one new row. Stops Load-more from looping
      // forever on a page boundary that returns exactly 0 rows.
      this.hasMore = newPosts.length >= 20 && this.activeTab !== 'trending';
      this.page++;
    } catch { /* silently ignore */ }
    finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }

  async loadTrendingTags(): Promise<void> {
    try {
      const session = await this.supabaseService.getCurrentSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch('/api/community/tags/trending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) this.trendingTags = (await res.json()) as TrendingTag[];
    } catch { /* ignore */ }
  }

  switchTab(tab: 'all' | 'friends' | 'mine' | 'trending'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.activeTag = null;
    this.loadPosts();
  }

  filterByTag(tag: string): void {
    this.activeTag = tag;
    this.activeTab = 'all';
    this.tagSearchQuery = '';
    this.loadPosts();
  }

  clearTagFilter(): void {
    this.activeTag = null;
    this.loadPosts();
  }

  onTagSearchInput(): void {
    if (this.tagSearchTimer) clearTimeout(this.tagSearchTimer);
    const q = this.tagSearchQuery.trim().replace(/^#/, '');
    if (!q) { this.clearTagFilter(); return; }
    this.tagSearchTimer = setTimeout(() => this.filterByTag(q), 500);
  }

  loadMore(): void { this.loadPosts(true); }

  openCompose(): void { this.composeOpen = true; }

  closeCompose(): void {
    this.composeOpen = false;
    this.postContent = '';
    this.tagsInput = '';
    this.bookQuery = '';
    this.bookResults = [];
    this.selectedBook = null;
    this.submitError = null;
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
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (!res.ok) return;
      const data = (await res.json()) as { books?: BookResult[] };
      this.bookResults = data.books ?? [];
    } catch { this.bookResults = []; }
  }

  selectBook(book: BookResult): void {
    this.selectedBook = book;
    this.bookQuery = '';
    this.bookResults = [];
  }

  clearBook(): void { this.selectedBook = null; }

  parseTags(input: string): string[] {
    return input
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, '').toLowerCase().trim())
      .filter((t) => t.length > 0 && t.length <= 30)
      .slice(0, 5);
  }

  async submitPost(): Promise<void> {
    if (!this.canPost || !this.currentUserId || !this.selectedBook) return;
    this.submitting = true;
    this.submitError = null;
    try {
      const bookId = await this.ensureBookInDb(this.selectedBook);
      const tags = this.parseTags(this.tagsInput);
      const post = await this.activityService.createCommunityPost(
        this.currentUserId, bookId, this.postContent.trim(), tags,
      );
      this.posts = [post, ...this.posts];
      this.closeCompose();
      void this.loadTrendingTags();
    } catch (err: unknown) {
      this.submitError = (err as { status?: number })?.status === 422
        ? this.copy.contentRejected
        : this.copy.postFailed;
    } finally {
      this.submitting = false;
    }
  }

  private async ensureBookInDb(book: BookResult): Promise<number> {
    // public.books is no longer client-writable — create it server-side.
    return this.bookService.ensureBookViaApi({
      googleId: book.googleId, title: book.title, author: book.author, coverUrl: book.coverUrl,
    });
  }

  toggleComments(postId: number): void {
    if (this.openCommentPostIds.has(postId)) this.openCommentPostIds.delete(postId);
    else this.openCommentPostIds.add(postId);
    this.openCommentPostIds = new Set(this.openCommentPostIds);
  }

  onToggleLike(post: ActivityPost): void {
    if (!this.currentUserId) return;
    const wasLiked = post.isLikedByMe;
    post.isLikedByMe = !wasLiked;
    post.likeCount += wasLiked ? -1 : 1;
    this.likesService.togglePostLike(post.id, this.currentUserId, post.userId, wasLiked).subscribe({
      error: () => { post.isLikedByMe = wasLiked; post.likeCount += wasLiked ? 1 : -1; },
    });
  }

  async deletePost(post: ActivityPost): Promise<void> {
    if (!(await this.confirmDialog.confirm({ message: this.copy.confirmDelete, danger: true }))) return;
    const prev = [...this.posts];
    this.posts = this.posts.filter((p) => p.id !== post.id);
    this.activityService.deletePost(post.id).subscribe({
      error: () => { this.posts = prev; },
    });
  }

  sentimentEmoji(s: string | null): string {
    return ({ positive: '😊', negative: '😞', neutral: '😐', mixed: '🤔' } as Record<string, string>)[s ?? ''] ?? '';
  }

  sentimentLabel(s: string | null): string {
    switch (s) {
      case 'positive': return this.copy.sentimentPositive;
      case 'negative': return this.copy.sentimentNegative;
      case 'neutral': return this.copy.sentimentNeutral;
      case 'mixed': return this.copy.sentimentMixed;
      default: return s ?? '';
    }
  }

  readonly timeAgo = timeAgo;
}
