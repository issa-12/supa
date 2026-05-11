import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { UserService, UserProfile, ReadingStats, UserGenre } from '../../core/services/user.service';
import { BookService, UserBook } from '../../core/services/book.service';
import {
  FriendshipService,
  FriendUser,
  FriendRequest,
  FriendshipStatusValue,
} from '../../core/services/friendship.service';

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
  private readonly friendshipService = inject(FriendshipService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  profile: UserProfile | null = null;
  readingStats: ReadingStats | null = null;
  genres: UserGenre[] = [];
  mostLikedBooks: ProfileBook[] = [];
  inBetweenBooks: ProfileBook[] = [];
  leastLikedBooks: ProfileBook[] = [];

  friendshipStatus: FriendshipStatusValue = 'none';
  friendshipId: number | null = null;
  friends: FriendUser[] = [];
  incomingRequests: FriendRequest[] = [];
  friendActionLoading = false;

  searchQuery = '';
  searchResults: UserProfile[] = [];
  searchLoading = false;
  sentRequestIds = new Set<string>();
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  currentUserId: string | null = null;
  isOwnProfile = true;
  isLoading = true;
  error: string | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUserId = user?.id ?? null;

      const routeId = this.route.snapshot.paramMap.get('id');
      const targetId = routeId ?? this.currentUserId;
      this.isOwnProfile = !routeId || routeId === this.currentUserId;

      if (!targetId) {
        this.error = 'Profile not found.';
        return;
      }

      const baseLoads: Promise<unknown>[] = [
        firstValueFrom(this.userService.getUserProfileById(targetId)),
        firstValueFrom(this.userService.getUserReadingStats(targetId)),
        firstValueFrom(this.userService.getUserGenres(targetId)),
        firstValueFrom(this.bookService.getUserBooksByRating(targetId, 5, 5)),
        firstValueFrom(this.bookService.getUserBooksByRating(targetId, 3, 4)),
        firstValueFrom(this.bookService.getUserBooksByRating(targetId, 1, 2)),
      ];

      const [profile, stats, genres, mostLiked, inBetween, leastLiked] = await Promise.all(baseLoads) as [
        UserProfile, ReadingStats, UserGenre[], UserBook[], UserBook[], UserBook[]
      ];

      this.profile = profile;
      this.readingStats = stats;
      this.genres = genres;
      this.mostLikedBooks = this.toProfileBooks(mostLiked);
      this.inBetweenBooks = this.toProfileBooks(inBetween);
      this.leastLikedBooks = this.toProfileBooks(leastLiked);

      if (this.isOwnProfile) {
        const [friends, requests] = await Promise.all([
          this.friendshipService.getFriends(),
          this.friendshipService.getIncomingRequests(),
        ]);
        this.friends = friends;
        this.incomingRequests = requests;
      } else if (this.currentUserId) {
        const status = await this.friendshipService.getFriendshipStatus(targetId);
        this.friendshipStatus = status.status;
        this.friendshipId = status.friendshipId;
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
    try {
      const result = await this.friendshipService.sendRequest(targetId);
      this.friendshipStatus = 'pending_sent';
      this.friendshipId = result.friendshipId;
    } catch {
      // silently ignore — user can retry
    } finally {
      this.friendActionLoading = false;
    }
  }

  async cancelRequest(): Promise<void> {
    if (!this.friendshipId || this.friendActionLoading) return;
    this.friendActionLoading = true;
    try {
      await this.friendshipService.deleteFriendship(this.friendshipId);
      this.friendshipStatus = 'none';
      this.friendshipId = null;
    } catch {
      // silently ignore
    } finally {
      this.friendActionLoading = false;
    }
  }

  async acceptRequest(): Promise<void> {
    if (!this.friendshipId || this.friendActionLoading) return;
    this.friendActionLoading = true;
    try {
      await this.friendshipService.acceptRequest(this.friendshipId);
      this.friendshipStatus = 'accepted';
    } catch {
      // silently ignore
    } finally {
      this.friendActionLoading = false;
    }
  }

  async rejectRequest(): Promise<void> {
    if (!this.friendshipId || this.friendActionLoading) return;
    this.friendActionLoading = true;
    try {
      await this.friendshipService.rejectRequest(this.friendshipId);
      this.friendshipStatus = 'rejected';
      this.friendshipId = null;
    } catch {
      // silently ignore
    } finally {
      this.friendActionLoading = false;
    }
  }

  async unfriend(): Promise<void> {
    if (!this.friendshipId || this.friendActionLoading) return;
    this.friendActionLoading = true;
    try {
      await this.friendshipService.deleteFriendship(this.friendshipId);
      this.friendshipStatus = 'none';
      this.friendshipId = null;
    } catch {
      // silently ignore
    } finally {
      this.friendActionLoading = false;
    }
  }

  async acceptIncoming(req: FriendRequest): Promise<void> {
    try {
      await this.friendshipService.acceptRequest(req.friendshipId);
      this.incomingRequests = this.incomingRequests.filter((r) => r.friendshipId !== req.friendshipId);
      this.friends = await this.friendshipService.getFriends();
    } catch {
      // silently ignore
    }
  }

  async rejectIncoming(req: FriendRequest): Promise<void> {
    try {
      await this.friendshipService.rejectRequest(req.friendshipId);
      this.incomingRequests = this.incomingRequests.filter((r) => r.friendshipId !== req.friendshipId);
    } catch {
      // silently ignore
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

  onEditProfile(): void {
    this.router.navigate(['/profile/edit']);
  }

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
