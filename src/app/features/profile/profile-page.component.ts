import { Component, HostListener, OnInit, inject } from '@angular/core';
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
import { ReportService, ReportReason } from '../../core/services/report.service';
import { PresenceService } from '../../core/services/presence.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { timeAgo } from '../../core/util/time-ago';
import { TranslationService, PROFILE_COPY, LanguageCode, GenreNamePipe } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TopNavComponent } from '../home/components/top-nav.component';

interface ProfileBook {
  userBookId: number;
  title: string;
  author: string;
  coverUrl: string | null;
  rating: number;
  googleBooksId: string | null;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [RouterLink, FormsModule, GenreNamePipe, TopNavComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly userService = inject(UserService);
  private readonly bookService = inject(BookService);
  private readonly activityService = inject(ActivityService);
  private readonly friendshipService = inject(FriendshipService);
  private readonly reportService = inject(ReportService);
  private readonly presenceService = inject(PresenceService);
  private readonly confirmDialog = inject(ConfirmDialogService);
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
  editIsPrivate = false;
  savingProfile = false;
  editProfileError: string | null = null;

  // True when viewing a private account that isn't an accepted friend (and not
  // our own) — the detailed profile is locked; only the header + a notice show.
  isPrivateLocked = false;

  allGenres: UserGenre[] = [];
  selectedGenreIds = new Set<number>();
  loadingGenres = false;
  deletingAccount = false;
  deleteAccountError: string | null = null;

  uploadingAvatar = false;
  avatarError: string | null = null;
  avatarMenuOpen = false;

  friendshipStatus: FriendshipStatusValue = 'none';
  friendshipId: number | null = null;
  friends: FriendUser[] = [];
  incomingRequests: FriendRequest[] = [];
  friendActionLoading = false;
  friendActionError: string | null = null;
  friendCount = 0;
  blockedByMe = false;
  blockedByThem = false;

  showReportModal = false;
  reportReason: ReportReason = 'spam';
  reportDescription = '';
  reportSubmitting = false;
  reportError = '';
  reportSuccess = '';

  readonly reportReasons: ReportReason[] = [
    'spam',
    'harassment',
    'inappropriate_content',
    'impersonation',
    'other',
  ];

  searchQuery = '';
  searchResults: UserProfile[] = [];
  searchLoading = false;
  sentRequestIds = new Set<string>();
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  currentUserId: string | null = null;
  viewedUserId: string | null = null;
  isOwnProfile = true;
  isLoading = true;
  error: string | null = null;

  onlineIds = new Set<string>();

  readonly friendChipLimit = 12;
  friendsExpanded = false;
  showFriendsModal = false;

  // Friends modal state
  modalFriends: FriendUser[] = [];
  modalFriendsLoading = false;
  myFriendIds = new Set<string>();
  myFriendshipMap = new Map<string, number>(); // userId -> friendshipId
  modalActionLoading = new Set<string>();
  modalSentRequests = new Set<string>();

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
    this.presenceService.onlineUserIds$.pipe(takeUntilDestroyed()).subscribe(ids => this.onlineIds = ids);
  }

  isOnline(userId: string | null | undefined): boolean {
    return !!userId && this.onlineIds.has(userId);
  }

  get displayedFriends(): FriendUser[] {
    return this.friendsExpanded ? this.friends : this.friends.slice(0, this.friendChipLimit);
  }

  toggleFriendsExpanded(): void {
    this.friendsExpanded = !this.friendsExpanded;
  }

  async openFriendsModal(): Promise<void> {
    this.showFriendsModal = true;
    this.modalFriendsLoading = true;
    try {
      const targetId = this.viewedUserId;
      if (!targetId) return;

      if (this.isOwnProfile) {
        this.modalFriends = [...this.friends];
        this.myFriendIds = new Set(this.friends.map(f => f.userId));
        this.myFriendshipMap = new Map(this.friends.map(f => [f.userId, f.friendshipId]));
      } else {
        const [targetFriends, myFriends] = await Promise.all([
          this.friendshipService.getFriendsForUser(targetId),
          this.friendshipService.getFriends(),
        ]);
        this.modalFriends = targetFriends;
        this.myFriendIds = new Set(myFriends.map(f => f.userId));
        this.myFriendshipMap = new Map(myFriends.map(f => [f.userId, f.friendshipId]));
      }
      void this.presenceService.loadPresenceForUsers(this.modalFriends.map(f => f.userId));
    } catch { /* ignore */ }
    finally { this.modalFriendsLoading = false; }
  }

  closeFriendsModal(): void {
    this.showFriendsModal = false;
    this.modalFriends = [];
    this.modalSentRequests = new Set();
  }

  bookCountLabel(n: number): string {
    return `${n} ${n === 1 ? this.copy.bookUnit : this.copy.booksUnit}`;
  }

  // Online/offline status is only visible between accepted friends — not for
  // strangers or pending/blocked relationships.
  get canSeeViewedUserPresence(): boolean {
    return !this.isOwnProfile && this.friendshipStatus === 'accepted';
  }

  async ngOnInit(): Promise<void> {
    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUserId = user?.id ?? null;

      const routeId = this.route.snapshot.paramMap.get('id');
      const targetId = routeId ?? this.currentUserId;
      this.viewedUserId = targetId;
      this.isOwnProfile = !routeId || routeId === this.currentUserId;

      if (!targetId) {
        this.error = this.copy.profileNotFoundMsg;
        return;
      }

      // For another user's profile, resolve the block relationship first. If
      // they've blocked us, show an "unavailable" state and don't load any of
      // their data at all.
      if (!this.isOwnProfile && this.currentUserId) {
        const status = await this.friendshipService.getFriendshipStatus(targetId);
        this.friendshipStatus = status.status;
        this.friendshipId = status.friendshipId;
        this.blockedByMe = status.blockedByMe ?? false;
        if (status.status === 'blocked' && !this.blockedByMe) {
          this.blockedByThem = true;
          return;
        }
      }

      // Load the profile first — needed for the privacy gate, and always shown.
      const profile = await firstValueFrom(this.userService.getUserProfileById(targetId));
      this.profile = profile;

      // Privacy gate: a private account is locked to anyone who isn't an
      // accepted friend (own profile is never locked). We deliberately do NOT
      // fetch the shelf/stats/posts in this case, so the private data never
      // reaches the client.
      if (!this.isOwnProfile && profile.isPrivate && this.friendshipStatus !== 'accepted') {
        this.isPrivateLocked = true;
        if (this.currentUserId) {
          const count = await this.friendshipService.getFriendCount(targetId).catch(() => ({ count: 0 }));
          this.friendCount = count.count;
        }
        return;
      }

      const [stats, genres, mostLiked, inBetween, leastLiked, currentlyReading, recentPosts] =
        await Promise.all([
          firstValueFrom(this.userService.getUserReadingStats(targetId)),
          firstValueFrom(this.userService.getUserGenres(targetId)),
          firstValueFrom(this.bookService.getUserBooksByRating(targetId, 5, 5)),
          firstValueFrom(this.bookService.getUserBooksByRating(targetId, 3, 4)),
          firstValueFrom(this.bookService.getUserBooksByRating(targetId, 1, 2)),
          firstValueFrom(this.bookService.getUserBooksByStatus(targetId, 'currently_reading', 6)),
          firstValueFrom(this.activityService.getUserPosts(targetId, this.currentUserId ?? targetId, 5)),
        ]);

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
        void this.presenceService.loadPresenceForUsers(friends.map(f => f.userId));
      } else if (this.currentUserId) {
        const count = await this.friendshipService.getFriendCount(targetId);
        this.friendCount = count.count;
        // Only friends can see each other's online status.
        if (this.friendshipStatus === 'accepted') {
          void this.presenceService.loadPresenceForUser(targetId);
        }
      }
    } catch (err) {
      this.error = this.copy.profileNotFoundMsg;
    } finally {
      this.isLoading = false;
    }
  }

  private async refreshFriendshipStatus(): Promise<void> {
    const targetId = this.route.snapshot.paramMap.get('id');
    if (!targetId || targetId === this.currentUserId) return;
    try {
      const status = await this.friendshipService.getFriendshipStatus(targetId);
      this.friendshipStatus = status.status;
      this.friendshipId = status.friendshipId;
      this.blockedByMe = status.blockedByMe ?? false;
    } catch {
      // best-effort re-sync; leave the existing button state untouched
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
    } catch (err) {
      // The backend returns a specific reason (e.g. blocked / already exists);
      // surface it so the user isn't told to "try again" on an unretryable error.
      this.friendActionError = this.copy.friendActionFailed;
      // Our local view of the relationship is stale — re-sync the button state.
      void this.refreshFriendshipStatus();
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
      this.friendActionError = this.copy.friendActionFailed;
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
      this.friendActionError = this.copy.friendActionFailed;
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
      this.friendActionError = this.copy.friendActionFailed;
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
      this.friendActionError = this.copy.friendActionFailed;
    } finally {
      this.friendActionLoading = false;
    }
  }

  async blockUser(): Promise<void> {
    const targetId = this.route.snapshot.paramMap.get('id');
    if (!targetId || this.friendActionLoading) return;
    if (!(await this.confirmDialog.confirm({ message: this.copy.blockConfirm, danger: true }))) return;

    const wasAccepted = this.friendshipStatus === 'accepted';
    this.friendActionLoading = true;
    this.friendActionError = null;
    try {
      await this.friendshipService.blockUser(targetId);
      this.friendshipStatus = 'blocked';
      this.blockedByMe = true;
      if (wasAccepted) {
        this.friendCount = Math.max(0, this.friendCount - 1);
      }
    } catch {
      this.friendActionError = this.copy.blockError;
    } finally {
      this.friendActionLoading = false;
    }
  }

  async unblockUser(): Promise<void> {
    const targetId = this.route.snapshot.paramMap.get('id');
    if (!targetId || this.friendActionLoading) return;
    this.friendActionLoading = true;
    this.friendActionError = null;
    try {
      await this.friendshipService.unblockUser(targetId);
      this.friendshipStatus = 'none';
      this.friendshipId = null;
      this.blockedByMe = false;
    } catch {
      this.friendActionError = this.copy.unblockError;
    } finally {
      this.friendActionLoading = false;
    }
  }

  openReportModal(): void {
    this.reportReason = 'spam';
    this.reportDescription = '';
    this.reportError = '';
    this.reportSuccess = '';
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
  }

  async submitReport(): Promise<void> {
    const targetId = this.route.snapshot.paramMap.get('id');
    if (!targetId || this.reportSubmitting) return;
    this.reportError = '';
    this.reportSuccess = '';
    this.reportSubmitting = true;
    try {
      await this.reportService.reportUser(
        targetId,
        this.reportReason,
        this.reportDescription,
      );
      this.reportSuccess = this.copy.reportSubmitted;
      window.setTimeout(() => this.closeReportModal(), 1800);
    } catch (err) {
      this.reportError = this.copy.reportError;
    } finally {
      this.reportSubmitting = false;
    }
  }

  reasonLabel(r: ReportReason): string {
    switch (r) {
      case 'spam': return this.copy.reasonSpam;
      case 'harassment': return this.copy.reasonHarassment;
      case 'inappropriate_content': return this.copy.reasonInappropriate;
      case 'impersonation': return this.copy.reasonImpersonation;
      case 'other': return this.copy.reasonOther;
    }
  }

  async acceptIncoming(req: FriendRequest): Promise<void> {
    try {
      await this.friendshipService.acceptRequest(req.friendshipId);
      this.incomingRequests = this.incomingRequests.filter((r) => r.friendshipId !== req.friendshipId);
      this.friends = await this.friendshipService.getFriends();
      this.friendCount = this.friends.length;
    } catch {
      this.friendActionError = this.copy.friendActionFailed;
    }
  }

  async rejectIncoming(req: FriendRequest): Promise<void> {
    try {
      await this.friendshipService.rejectRequest(req.friendshipId);
      this.incomingRequests = this.incomingRequests.filter((r) => r.friendshipId !== req.friendshipId);
    } catch {
      this.friendActionError = this.copy.friendActionFailed;
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

  get goalProgressText(): string {
    if (!this.readingStats) return '';
    return this.copy.goalProgress
      .replace('{percent}', String(this.goalPercent))
      .replace('{year}', String(this.readingStats.currentYear));
  }

  get copyrightText(): string {
    return this.copy.copyright.replace('{year}', String(new Date().getFullYear()));
  }

  get avatarInitials(): string {
    return (this.profile?.name ?? '?')
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  toggleAvatarMenu(): void {
    this.avatarMenuOpen = !this.avatarMenuOpen;
  }

  // Close the avatar menu on any click outside it (the menu container stops
  // propagation, so clicks inside don't trigger this).
  @HostListener('document:click')
  closeAvatarMenu(): void {
    this.avatarMenuOpen = false;
  }

  async onAvatarFileChange(event: Event): Promise<void> {
    if (!this.currentUserId || this.uploadingAvatar) return;
    this.avatarMenuOpen = false;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.avatarError = this.copy.avatarInvalidType;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.avatarError = this.copy.avatarTooLarge;
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
      this.userService.setCurrentUserAvatar(url);
    } catch {
      this.avatarError = this.copy.avatarUploadError;
    } finally {
      this.uploadingAvatar = false;
      input.value = '';
    }
  }

  async onRemoveAvatar(): Promise<void> {
    if (!this.currentUserId || this.uploadingAvatar || !this.profile?.avatarUrl) return;
    this.avatarMenuOpen = false;
    if (!(await this.confirmDialog.confirm({ message: this.copy.removePhotoConfirm, danger: true }))) return;
    this.uploadingAvatar = true;
    this.avatarError = null;
    try {
      await this.userService.removeAvatar(this.currentUserId);
      if (this.profile) this.profile = { ...this.profile, avatarUrl: null };
      this.userService.setCurrentUserAvatar(null);
    } catch {
      this.avatarError = this.copy.removePhotoError;
    } finally {
      this.uploadingAvatar = false;
    }
  }

  onEditProfile(): void {
    if (!this.profile) return;
    this.editName = this.profile.name;
    this.editUsername = this.profile.username ?? '';
    this.editBio = this.profile.bio ?? '';
    this.editIsPrivate = this.profile.isPrivate;
    this.selectedGenreIds = new Set(this.genres.map((g) => g.id));
    this.editProfileError = null;
    this.editingProfile = true;
    document.body.style.overflow = 'hidden';
    this.loadAllGenres();
  }

  private async loadAllGenres(): Promise<void> {
    if (this.allGenres.length > 0 || this.loadingGenres) return;
    this.loadingGenres = true;
    try {
      this.allGenres = await firstValueFrom(this.userService.getAllGenres());
    } catch {
      // leave allGenres empty — the user keeps their current genres
    } finally {
      this.loadingGenres = false;
    }
  }

  toggleEditGenre(genreId: number): void {
    if (this.selectedGenreIds.has(genreId)) {
      this.selectedGenreIds.delete(genreId);
    } else {
      this.selectedGenreIds.add(genreId);
    }
  }

  isGenreSelected(genreId: number): boolean {
    return this.selectedGenreIds.has(genreId);
  }

  cancelEditProfile(): void {
    this.editingProfile = false;
    document.body.style.overflow = '';
  }

  async deleteAccount(): Promise<void> {
    if (this.deletingAccount) return;
    if (!(await this.confirmDialog.confirm({ message: this.copy.deleteAccountConfirm, danger: true }))) return;
    this.deletingAccount = true;
    this.deleteAccountError = null;
    try {
      const session = await this.supabaseService.getCurrentSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      // Account + all data are gone server-side. Clear the local session if we
      // can, but navigate away regardless — a signOut failure must not strand
      // the user on a "delete failed" error when their account is already gone.
      try {
        const supabase = await this.supabaseService.getClient();
        // scope: 'local' clears the cached token WITHOUT a server round-trip.
        // The account is already gone, so a global sign-out would 401 and could
        // leave the stale token behind — making the deleted account look like
        // it still exists on the next guarded navigation.
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // ignore — the server-side account is already deleted
      }
      this.router.navigate(['/'], { replaceUrl: true });
    } catch {
      this.deleteAccountError = this.copy.deleteAccountError;
      this.deletingAccount = false;
    }
  }

  async saveProfile(): Promise<void> {
    if (!this.currentUserId || this.savingProfile) return;
    if (this.selectedGenreIds.size < 3) {
      this.editProfileError = this.copy.genresMinError;
      return;
    }
    this.savingProfile = true;
    this.editProfileError = null;
    try {
      const updated = await firstValueFrom(
        this.userService.updateUserProfile(this.currentUserId, {
          name: this.editName.trim() || this.profile!.name,
          username: this.editUsername.trim() || null,
          bio: this.editBio.trim() || null,
          isPrivate: this.editIsPrivate,
        }),
      );
      this.profile = updated;

      await firstValueFrom(
        this.userService.setUserGenres(this.currentUserId, Array.from(this.selectedGenreIds)),
      );
      // Recompute the displayed tags from whichever source has the names. If
      // the full genre list failed to load, allGenres is empty — fall back to
      // the currently shown genres (the selection can only be a subset of them)
      // so we never wipe valid tags the DB still has.
      const source = this.allGenres.length ? this.allGenres : this.genres;
      this.genres = source
        .filter((g) => this.selectedGenreIds.has(g.id))
        .map((g) => ({ id: g.id, name: g.name }));

      this.editingProfile = false;
      document.body.style.overflow = '';
    } catch (error) {
      // The only unique-constrained field we update is username, so a 23505
      // means the chosen username is taken. Anything else is a generic failure.
      this.editProfileError = this.isUsernameTakenError(error)
        ? this.copy.usernameTaken
        : this.copy.saveProfileError;
    } finally {
      this.savingProfile = false;
    }
  }

  private isUsernameTakenError(error: unknown): boolean {
    const e = error as { code?: string; message?: string } | null;
    return e?.code === '23505' || (e?.message ?? '').includes('users_username_key');
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
        googleBooksId: ub.book!.googleBooksId,
      }));
  }

  openBook(book: ProfileBook): void {
    if (book.googleBooksId) {
      this.router.navigate(['/books', book.googleBooksId]);
    }
  }

  // Recent activity: show a single row by default, expand to the rest on demand.
  readonly recentPostsPreviewCount = 3;
  postsExpanded = false;

  get displayedPosts(): ActivityPost[] {
    return this.postsExpanded
      ? this.recentPosts
      : this.recentPosts.slice(0, this.recentPostsPreviewCount);
  }

  togglePostsExpanded(): void {
    this.postsExpanded = !this.postsExpanded;
  }

  // No standalone post page exists — open the post inside the community feed,
  // which scrolls to it and expands its comments (see ?post= handling there).
  openPost(post: ActivityPost): void {
    this.router.navigate(['/community'], { queryParams: { post: post.id } });
  }

  modalIsFriend(userId: string): boolean {
    return this.myFriendIds.has(userId);
  }

  modalIsPending(userId: string): boolean {
    return this.modalSentRequests.has(userId);
  }

  modalIsMe(userId: string): boolean {
    return userId === this.currentUserId;
  }

  async modalUnfriend(friend: FriendUser): Promise<void> {
    if (this.modalActionLoading.has(friend.userId)) return;
    this.modalActionLoading = new Set([...this.modalActionLoading, friend.userId]);
    try {
      const fid = this.isOwnProfile ? friend.friendshipId : this.myFriendshipMap.get(friend.userId);
      if (!fid) return;
      await this.friendshipService.deleteFriendship(fid);
      this.myFriendIds = new Set([...this.myFriendIds].filter(id => id !== friend.userId));
      this.myFriendshipMap.delete(friend.userId);
      if (this.isOwnProfile) {
        this.modalFriends = this.modalFriends.filter(f => f.userId !== friend.userId);
        this.friends = this.friends.filter(f => f.userId !== friend.userId);
        this.friendCount = this.friends.length;
      }
    } catch { /* ignore */ }
    finally {
      this.modalActionLoading = new Set([...this.modalActionLoading].filter(id => id !== friend.userId));
    }
  }

  async modalAddFriend(userId: string): Promise<void> {
    if (this.modalActionLoading.has(userId)) return;
    this.modalActionLoading = new Set([...this.modalActionLoading, userId]);
    try {
      const result = await this.friendshipService.sendRequest(userId);
      this.modalSentRequests = new Set([...this.modalSentRequests, userId]);
      this.myFriendshipMap.set(userId, result.friendshipId);
    } catch { /* ignore */ }
    finally {
      this.modalActionLoading = new Set([...this.modalActionLoading].filter(id => id !== userId));
    }
  }
}
