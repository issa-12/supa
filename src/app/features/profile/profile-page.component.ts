import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { UserService, UserProfile, ReadingStats, UserGenre } from '../../core/services/user.service';
import { BookService, UserBook } from '../../core/services/book.service';
import { ActivityService, ActivityPost } from '../../core/services/activity.service';
import {
  FriendshipService,
  FriendUser,
  FriendRequest,
  FriendshipStatusValue,
} from '../../core/services/friendship.service';
import { timeAgo } from '../../core/util/time-ago';
import { TranslationService, PROFILE_COPY, LanguageCode } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ProfileBook {
  userBookId: number;
  title: string;
  author: string;
  coverUrl: string | null;
  rating: number;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly userService = inject(UserService);
  private readonly bookService = inject(BookService);
  private readonly activityService = inject(ActivityService);
  private readonly friendshipService = inject(FriendshipService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return PROFILE_COPY[this.lang]; }

  profile: UserProfile | null = null;
  readingStats: ReadingStats | null = null;
  genres: UserGenre[] = [];
  mostLikedBooks: ProfileBook[] = [];
  inBetweenBooks: ProfileBook[] = [];
  leastLikedBooks: ProfileBook[] = [];
  currentlyReadingBooks: ProfileBook[] = [];
  recentPosts: ActivityPost[] = [];

  editingGoal = false;
  goalInput = 20;
  savingGoal = false;

  editingProfile = false;
  editName = '';
  editUsername = '';
  editBio = '';
  savingProfile = false;

  uploadingAvatar = false;
  avatarError: string | null = null;

  friendshipStatus: FriendshipStatusValue = 'none';
  friendshipId: number | null = null;
  friends: FriendUser[] = [];
  incomingRequests: FriendRequest[] = [];
  friendActionLoading = false;
  friendActionError: string | null = null;
  friendCount = 0;

  searchQuery = '';
  searchResults: UserProfile[] = [];
  searchLoading = false;
  sentRequestIds = new Set<string>();
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  currentUserId: string | null = null;
  isOwnProfile = true;
  isLoading = true;
  error: string | null = null;

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  async ngOnInit(): Promise<void> {
    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUserId = user?.id ?? null;

      const routeId = this.route.snapshot.paramMap.get('id');
      const targetId = routeId ?? this.currentUserId;
      this.isOwnProfile = !routeId || routeId === this.currentUserId;

      if (!targetId) {
        this.error = this.copy.profileNotFoundMsg;
        return;
      }

      const [profile, stats, genres, mostLiked, inBetween, leastLiked, currentlyReading, recentPosts] =
        await Promise.all([
          firstValueFrom(this.userService.getUserProfileById(targetId)),
          firstValueFrom(this.userService.getUserReadingStats(targetId)),
          firstValueFrom(this.userService.getUserGenres(targetId)),
          firstValueFrom(this.bookService.getUserBooksByRating(targetId, 5, 5)),
          firstValueFrom(this.bookService.getUserBooksByRating(targetId, 3, 4)),
          firstValueFrom(this.bookService.getUserBooksByRating(targetId, 1, 2)),
          firstValueFrom(this.bookService.getUserBooksByStatus(targetId, 'currently_reading', 6)),
          firstValueFrom(this.activityService.getUserPosts(targetId, this.currentUserId ?? targetId, 5)),
        ]);

      this.profile = profile;
      this.readingStats = stats;
      this.goalInput = stats.booksGoal;
      this.genres = genres;
      this.mostLikedBooks = this.toProfileBooks(mostLiked);
      this.inBetweenBooks = this.toProfileBooks(inBetween);
      this.leastLikedBooks = this.toProfileBooks(leastLiked);
      this.currentlyReadingBooks = this.toProfileBooks(currentlyReading);
      this.recentPosts = recentPosts;

      if (this.isOwnProfile) {
        const [friends, requests, count] = await Promise.all([
          this.friendshipService.getFriends(),
          this.friendshipService.getIncomingRequests(),
          this.friendshipService.getFriendCount(targetId),
        ]);
        this.friends = friends;
        this.incomingRequests = requests;
        this.friendCount = count.count;
      } else if (this.currentUserId) {
        const [status, count] = await Promise.all([
          this.friendshipService.getFriendshipStatus(targetId),
          this.friendshipService.getFriendCount(targetId),
        ]);
        this.friendshipStatus = status.status;
        this.friendshipId = status.friendshipId;
        this.friendCount = count.count;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load profile.';
    } finally {
      this.isLoading = false;
    }
  }

  async sendFriendRequest(): Promise<void> {
    const targetId = this.route.snapshot.paramMap.get('id');
    if (!targetId || this.friendActionLoading) return;
    this.friendActionLoading = true;
    this.friendActionError = null;
    try {
      const result = await this.friendshipService.sendRequest(targetId);
      this.friendshipStatus = 'pending_sent';
      this.friendshipId = result.friendshipId;
    } catch {
      this.friendActionError = 'Could not send friend request. Please try again.';
    } finally {
      this.friendActionLoading = false;
    }
  }

  async cancelRequest(): Promise<void> {
    if (!this.friendshipId || this.friendActionLoading) return;
    this.friendActionLoading = true;
    this.friendActionError = null;
    try {
      await this.friendshipService.deleteFriendship(this.friendshipId);
      this.friendshipStatus = 'none';
      this.friendshipId = null;
    } catch {
      this.friendActionError = 'Could not cancel request. Please try again.';
    } finally {
      this.friendActionLoading = false;
    }
  }

  async acceptRequest(): Promise<void> {
    if (!this.friendshipId || this.friendActionLoading) return;
    this.friendActionLoading = true;
    this.friendActionError = null;
    try {
      await this.friendshipService.acceptRequest(this.friendshipId);
      this.friendshipStatus = 'accepted';
      this.friendCount += 1;
    } catch {
      this.friendActionError = 'Could not accept request. Please try again.';
    } finally {
      this.friendActionLoading = false;
    }
  }

  async rejectRequest(): Promise<void> {
    if (!this.friendshipId || this.friendActionLoading) return;
    this.friendActionLoading = true;
    this.friendActionError = null;
    try {
      await this.friendshipService.rejectRequest(this.friendshipId);
      this.friendshipStatus = 'none';
      this.friendshipId = null;
    } catch {
      this.friendActionError = 'Could not decline request. Please try again.';
    } finally {
      this.friendActionLoading = false;
    }
  }

  async unfriend(): Promise<void> {
    if (!this.friendshipId || this.friendActionLoading) return;
    this.friendActionLoading = true;
    this.friendActionError = null;
    try {
      await this.friendshipService.deleteFriendship(this.friendshipId);
      this.friendshipStatus = 'none';
      this.friendshipId = null;
      this.friendCount = Math.max(0, this.friendCount - 1);
    } catch {
      this.friendActionError = 'Could not remove friend. Please try again.';
    } finally {
      this.friendActionLoading = false;
    }
  }

  async acceptIncoming(req: FriendRequest): Promise<void> {
    try {
      await this.friendshipService.acceptRequest(req.friendshipId);
      this.incomingRequests = this.incomingRequests.filter((r) => r.friendshipId !== req.friendshipId);
      this.friends = await this.friendshipService.getFriends();
      this.friendCount = this.friends.length;
    } catch {
      this.friendActionError = 'Could not accept request. Please try again.';
    }
  }

  async rejectIncoming(req: FriendRequest): Promise<void> {
    try {
      await this.friendshipService.rejectRequest(req.friendshipId);
      this.incomingRequests = this.incomingRequests.filter((r) => r.friendshipId !== req.friendshipId);
    } catch {
      this.friendActionError = 'Could not decline request. Please try again.';
    }
  }

  onSearchInput(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const q = this.searchQuery.trim();
    if (!q) { this.searchResults = []; return; }
    this.searchTimer = setTimeout(() => this.runSearch(q), 350);
  }

  private async runSearch(q: string): Promise<void> {
    this.searchLoading = true;
    try {
      const results = await firstValueFrom(this.userService.searchUsers(q, 8));
      this.searchResults = results.filter(
        (u) => u.id !== this.currentUserId && !this.friends.some((f) => f.userId === u.id),
      );
    } catch {
      this.searchResults = [];
    } finally {
      this.searchLoading = false;
    }
  }

  async sendRequestFromSearch(user: UserProfile): Promise<void> {
    try {
      await this.friendshipService.sendRequest(user.id);
      this.sentRequestIds = new Set([...this.sentRequestIds, user.id]);
    } catch {
      // silently ignore duplicate/error
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  get goalPercent(): number {
    if (!this.readingStats || this.readingStats.booksGoal === 0) return 0;
    return Math.min(
      Math.round((this.readingStats.booksReadThisYear / this.readingStats.booksGoal) * 100),
      100,
    );
  }

  get avatarInitials(): string {
    return (this.profile?.name ?? '?')
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  async onAvatarFileChange(event: Event): Promise<void> {
    if (!this.currentUserId || this.uploadingAvatar) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.avatarError = 'Please select an image file.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.avatarError = 'Image must be under 5 MB.';
      return;
    }
    this.uploadingAvatar = true;
    this.avatarError = null;
    try {
      const url = await this.userService.uploadAvatar(this.currentUserId, file);
      await firstValueFrom(
        this.userService.updateUserProfile(this.currentUserId, { avatarUrl: url }),
      );
      if (this.profile) this.profile = { ...this.profile, avatarUrl: url };
    } catch {
      this.avatarError = 'Could not upload photo. Please try again.';
    } finally {
      this.uploadingAvatar = false;
      input.value = '';
    }
  }

  onEditProfile(): void {
    if (!this.profile) return;
    this.editName = this.profile.name;
    this.editUsername = this.profile.username ?? '';
    this.editBio = this.profile.bio ?? '';
    this.editingProfile = true;
  }

  cancelEditProfile(): void {
    this.editingProfile = false;
  }

  async saveProfile(): Promise<void> {
    if (!this.currentUserId || this.savingProfile) return;
    this.savingProfile = true;
    try {
      const updated = await firstValueFrom(
        this.userService.updateUserProfile(this.currentUserId, {
          name: this.editName.trim() || this.profile!.name,
          username: this.editUsername.trim() || null,
          bio: this.editBio.trim() || null,
        }),
      );
      this.profile = updated;
      this.editingProfile = false;
    } catch {
      // silently ignore — user can retry
    } finally {
      this.savingProfile = false;
    }
  }

  startEditGoal(): void {
    this.goalInput = this.readingStats?.booksGoal ?? 20;
    this.editingGoal = true;
  }

  cancelGoalEdit(): void {
    this.editingGoal = false;
  }

  async saveGoal(): Promise<void> {
    if (!this.currentUserId || this.savingGoal) return;
    const target = Math.max(1, Math.round(this.goalInput));
    this.savingGoal = true;
    try {
      await firstValueFrom(
        this.userService.setReadingGoal(this.currentUserId, new Date().getFullYear(), target),
      );
      if (this.readingStats) this.readingStats = { ...this.readingStats, booksGoal: target };
      this.editingGoal = false;
    } catch {
      // silently ignore — user can retry
    } finally {
      this.savingGoal = false;
    }
  }

  readonly timeAgo = timeAgo;

  private toProfileBooks(userBooks: UserBook[]): ProfileBook[] {
    return userBooks
      .filter((ub) => ub.book)
      .map((ub) => ({
        userBookId: ub.id,
        title: ub.book!.title,
        author: ub.book!.author,
        coverUrl: ub.book!.coverUrl,
        rating: ub.rating ?? 0,
      }));
  }
}
