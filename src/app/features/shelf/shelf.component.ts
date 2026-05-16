import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { BookService, UserBook } from '../../core/services/book.service';

interface ShelfSection {
  statusName: string;
  label: string;
  books: UserBook[];
}

const STATUS_ORDER: Record<string, number> = {
  currently_reading: 0,
  want_to_read: 1,
  read: 2,
};

const STATUS_LABELS: Record<string, string> = {
  currently_reading: 'Currently Reading',
  want_to_read: 'Want to Read',
  read: 'Already Read',
  recommended_by_friend: 'Recommended',
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
  private readonly router = inject(Router);

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
    { name: 'currently_reading', label: 'Currently Reading' },
    { name: 'want_to_read', label: 'Want to Read' },
    { name: 'read', label: 'Already Read' },
  ];

  async ngOnInit(): Promise<void> {
    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { this.router.navigate(['/']); return; }

      const allBooks = await firstValueFrom(this.bookService.getUserShelf(user.id));
      this.buildSections(allBooks);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load shelf.';
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
      .map(([statusName, books]) => ({
        statusName,
        label: STATUS_LABELS[statusName] ?? statusName,
        books,
      }))
      .sort((a, b) => (STATUS_ORDER[a.statusName] ?? 99) - (STATUS_ORDER[b.statusName] ?? 99));
  }

  get totalBooks(): number {
    return this.sections.reduce((n, s) => n + s.books.length, 0);
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
    return sorted; // 'date' — already ordered by added_at DESC from DB
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
