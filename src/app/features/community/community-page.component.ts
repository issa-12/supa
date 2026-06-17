import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivityService, ActivityPost } from '../../core/services/activity.service';
import { LikesService } from '../../core/services/likes.service';
import { SupabaseService } from '../../core/services/supabase.service';
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
export class CommunityPageComponent implements OnInit {
  private readonly activityService = inject(ActivityService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly likesService = inject(LikesService);
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
  activeTab: 'all' | 'trending' = 'all';
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
  }

  async loadPosts(append = false): Promise<void> {
    if (!this.currentUserId) return;
    if (append) { this.loadingMore = true; }
    else { this.loading = true; this.posts = []; this.page = 0; }

    try {
      const newPosts =
        this.activeTab === 'trending'
          ? await this.activityService.getCommunityTrendingPosts(this.currentUserId)
          : await this.activityService.getCommunityPosts(
              this.currentUserId,
              this.activeTag ?? undefined,
              this.page,
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

  switchTab(tab: 'all' | 'trending'): void {
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
      this.submitError = err instanceof Error ? err.message : 'Could not post. Try again.';
    } finally {
      this.submitting = false;
    }
  }

  private async ensureBookInDb(book: BookResult): Promise<number> {
    const supabase = await this.supabaseService.getClient();
    const { data: existing } = await supabase
      .from('books').select('book_id').eq('google_books_id', book.googleId).maybeSingle();
    if (existing) return existing['book_id'] as number;
    const { data: inserted, error } = await supabase
      .from('books')
      .insert({ title: book.title, author_name: book.author, cover_image_url: book.coverUrl, google_books_id: book.googleId })
      .select('book_id').single();
    if (error || !inserted) throw error ?? new Error('Failed to save book');
    return inserted['book_id'] as number;
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

  readonly timeAgo = timeAgo;
}
