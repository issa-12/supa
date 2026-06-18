import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { BookService, UserBook } from '../../core/services/book.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { TranslationService, SHELF_COPY, LanguageCode } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ShelfSection {
  statusName: string;
  books: UserBook[];
}

const STATUS_ORDER: Record<string, number> = {
  // Friend recommendations are a pending inbox — surface them first.
  recommended_by_friend: -1,
  currently_reading: 0,
  want_to_read: 1,
  read: 2,
};

@Component({
  selector: 'app-shelf',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './shelf.component.html',
  styleUrl: './shelf.component.scss',
})
export class ShelfComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly bookService = inject(BookService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return SHELF_COPY[this.lang]; }

  sections: ShelfSection[] = [];
  isLoading = true;
  error: string | null = null;

  openMenuId: number | null = null;
  savingId: number | null = null;

  progressEditId: number | null = null;
  progressCurrent = '';
  progressTotal = '';
  savingProgressId: number | null = null;

  activeFilter = 'all';
  sortBy: 'date' | 'title' | 'rating' = 'date';

  readonly SHELF_STATUSES = [
    { name: 'currently_reading', label: this.copy.currentlyReadingLabel },
    { name: 'want_to_read', label: this.copy.wantToReadLabel },
    { name: 'read', label: this.copy.alreadyReadLabel },
  ];

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => {
      this.lang = l;
      this.SHELF_STATUSES[0].label = this.copy.currentlyReadingLabel;
      this.SHELF_STATUSES[1].label = this.copy.wantToReadLabel;
      this.SHELF_STATUSES[2].label = this.copy.alreadyReadLabel;
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { this.router.navigate(['/']); return; }

      const allBooks = await firstValueFrom(this.bookService.getUserShelf(user.id));
      this.buildSections(allBooks);
    } catch {
      // Always localized — a raw Supabase/network err.message is English/technical.
      this.error = this.copy.failedToLoadShelfMsg;
    } finally {
      this.isLoading = false;
    }
  }

  private buildSections(books: UserBook[]): void {
    const map = new Map<string, UserBook[]>();

    for (const ub of books) {
      const key = ub.status?.name ?? 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ub);
    }

    this.sections = [...map.entries()]
      .map(([statusName, books]) => ({ statusName, books }))
      .sort((a, b) => (STATUS_ORDER[a.statusName] ?? 99) - (STATUS_ORDER[b.statusName] ?? 99));
  }

  // Resolved from the active language so headings translate (and re-render
  // live on language switch) rather than being baked in at build time.
  sectionLabel(statusName: string): string {
    switch (statusName) {
      case 'recommended_by_friend': return this.copy.friendRecommendationsLabel;
      case 'currently_reading': return this.copy.currentlyReadingLabel;
      case 'want_to_read': return this.copy.wantToReadLabel;
      case 'read': return this.copy.alreadyReadLabel;
      default: return statusName;
    }
  }

  get totalBooks(): number {
    return this.sections.reduce((n, s) => n + s.books.length, 0);
  }

  get hasRecommendations(): boolean {
    return this.sections.some((s) => s.statusName === 'recommended_by_friend');
  }

  get displayedSections(): ShelfSection[] {
    let sections = this.activeFilter === 'all'
      ? this.sections
      : this.sections.filter((s) => s.statusName === this.activeFilter);

    return sections.map((section) => ({
      ...section,
      books: this.sortBooks(section.books),
    }));
  }

  private sortBooks(books: UserBook[]): UserBook[] {
    const sorted = [...books];
    if (this.sortBy === 'title') {
      return sorted.sort((a, b) => (a.book?.title ?? '').localeCompare(b.book?.title ?? ''));
    }
    if (this.sortBy === 'rating') {
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    // 'date' — DB returns them sorted by added_at DESC, but resort
    // defensively in case bucketing changes order.
    return sorted.sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''));
  }

  toggleMenu(userBookId: number): void {
    this.openMenuId = this.openMenuId === userBookId ? null : userBookId;
  }

  closeMenu(): void {
    this.openMenuId = null;
  }

  navigateToDetail(book: UserBook): void {
    if (book.book?.googleBooksId) {
      this.router.navigate(['/books', book.book.googleBooksId]);
    }
  }

  async changeStatus(book: UserBook, statusName: string): Promise<void> {
    this.openMenuId = null;
    this.savingId = book.id;

    try {
      const supabase = await this.supabaseService.getClient();
      const { data: statusRow } = await supabase
        .from('reading_statuses')
        .select('status_id')
        .eq('status_name', statusName)
        .maybeSingle();

      if (!statusRow) return;

      await firstValueFrom(this.bookService.changeShelfStatus(book.id, statusRow['status_id']));

      // Rebuild sections
      const { data: { user } } = await supabase.auth.getUser();
      const allBooks = await firstValueFrom(this.bookService.getUserShelf(user!.id));
      this.buildSections(allBooks);
    } catch (err) {
      console.error(err);
    } finally {
      this.savingId = null;
    }
  }

  async removeBook(book: UserBook): Promise<void> {
    const title = book.book?.title ?? 'this book';
    const ok = await this.confirmDialog.confirm({
      message: this.copy.confirmRemove.replace('{{ title }}', title),
      danger: true,
    });
    if (!ok) return;
    this.openMenuId = null;
    this.savingId = book.id;

    try {
      await firstValueFrom(this.bookService.removeFromShelf(book.id));
      for (const section of this.sections) {
        section.books = section.books.filter((b) => b.id !== book.id);
      }
      this.sections = this.sections.filter((s) => s.books.length > 0);
    } catch (err) {
      console.error(err);
    } finally {
      this.savingId = null;
    }
  }

  // Accept a friend recommendation → moves to "Want to Read", so it leaves the
  // recommendations inbox and rebuilds into the normal flow.
  async acceptRecommendation(book: UserBook, event: Event): Promise<void> {
    event.stopPropagation();
    this.savingId = book.id;
    try {
      await firstValueFrom(this.bookService.acceptFriendRecommendation(book.id));
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      const allBooks = await firstValueFrom(this.bookService.getUserShelf(user!.id));
      this.buildSections(allBooks);
      this.resetFilterIfNoRecs();
    } catch (err) {
      console.error(err);
    } finally {
      this.savingId = null;
    }
  }

  // Decline → remove the recommendation from the shelf entirely.
  async declineRecommendation(book: UserBook, event: Event): Promise<void> {
    event.stopPropagation();
    this.savingId = book.id;
    try {
      await firstValueFrom(this.bookService.declineFriendRecommendation(book.id));
      for (const section of this.sections) {
        section.books = section.books.filter((b) => b.id !== book.id);
      }
      this.sections = this.sections.filter((s) => s.books.length > 0);
      this.resetFilterIfNoRecs();
    } catch (err) {
      console.error(err);
    } finally {
      this.savingId = null;
    }
  }

  // After acting on the last recommendation the "Recommendations" pill is gone;
  // fall back to "All" so the view doesn't get stuck on an empty filter.
  private resetFilterIfNoRecs(): void {
    if (this.activeFilter === 'recommended_by_friend' && !this.hasRecommendations) {
      this.activeFilter = 'all';
    }
  }

  starsArray(rating: number | null): boolean[] {
    return [1, 2, 3, 4, 5].map((n) => n <= (rating ?? 0));
  }

  openProgressEdit(book: UserBook, event: Event): void {
    event.stopPropagation();
    this.progressEditId = book.id;
    this.progressCurrent = book.currentPage?.toString() ?? '';
    this.progressTotal = book.totalPages?.toString() ?? '';
  }

  cancelProgressEdit(event: Event): void {
    event.stopPropagation();
    this.progressEditId = null;
  }

  async saveProgress(book: UserBook, event: Event): Promise<void> {
    event.stopPropagation();
    const currentPage = parseInt(this.progressCurrent, 10);
    if (!currentPage || currentPage < 1) return;

    const totalPages = this.progressTotal ? parseInt(this.progressTotal, 10) : null;
    if (totalPages !== null && (isNaN(totalPages) || totalPages < 1 || currentPage > totalPages)) return;

    this.savingProgressId = book.id;
    try {
      const updated = await firstValueFrom(
        this.bookService.updateProgress(book.id, currentPage, totalPages),
      );
      for (const section of this.sections) {
        const idx = section.books.findIndex((b) => b.id === book.id);
        if (idx >= 0) section.books[idx] = updated;
      }
      this.progressEditId = null;
    } catch (err) {
      console.error(err);
    } finally {
      this.savingProgressId = null;
    }
  }

  getProgressPercent(book: UserBook): number {
    if (!book.currentPage || !book.totalPages || book.totalPages <= 0) return 0;
    return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
  }
}
