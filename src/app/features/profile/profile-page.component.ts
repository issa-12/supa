import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { UserService, UserProfile, ReadingStats, UserGenre } from '../../core/services/user.service';
import { BookService, UserBook } from '../../core/services/book.service';

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
  imports: [RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly userService = inject(UserService);
  private readonly bookService = inject(BookService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  profile: UserProfile | null = null;
  readingStats: ReadingStats | null = null;
  genres: UserGenre[] = [];
  mostLikedBooks: ProfileBook[] = [];
  inBetweenBooks: ProfileBook[] = [];
  leastLikedBooks: ProfileBook[] = [];

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

      const [profile, stats, genres, mostLiked, inBetween, leastLiked] = await Promise.all([
        firstValueFrom(this.userService.getUserProfileById(targetId)),
        firstValueFrom(this.userService.getUserReadingStats(targetId)),
        firstValueFrom(this.userService.getUserGenres(targetId)),
        firstValueFrom(this.bookService.getUserBooksByRating(targetId, 5, 5)),
        firstValueFrom(this.bookService.getUserBooksByRating(targetId, 3, 4)),
        firstValueFrom(this.bookService.getUserBooksByRating(targetId, 1, 2)),
      ]);

      this.profile = profile;
      this.readingStats = stats;
      this.genres = genres;
      this.mostLikedBooks = this.toProfileBooks(mostLiked);
      this.inBetweenBooks = this.toProfileBooks(inBetween);
      this.leastLikedBooks = this.toProfileBooks(leastLiked);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load profile.';
    } finally {
      this.isLoading = false;
    }
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
