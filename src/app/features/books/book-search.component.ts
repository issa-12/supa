import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { BookService, GoogleBook } from '../../core/services/book.service';

interface ShelfStatus {
  id: number;
  label: string;
  icon: string;
}

const SHELF_STATUSES: ShelfStatus[] = [
  { id: 2, label: 'Want to Read', icon: '📚' },
  { id: 3, label: 'Currently Reading', icon: '📖' },
  { id: 1, label: 'Already Read', icon: '✓' },
];

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [RouterLink, FormsModule, SlicePipe],
  templateUrl: './book-search.component.html',
  styleUrl: './book-search.component.scss',
})
export class BookSearchComponent implements OnDestroy {
  private readonly bookService = inject(BookService);
  private readonly supabaseService = inject(SupabaseService);

  readonly statuses = SHELF_STATUSES;

  query = '';
  results: GoogleBook[] = [];
  isSearching = false;
  hasSearched = false;
  searchError: string | null = null;

  openDropdownId: string | null = null;
  addingBookId: string | null = null;
  addedBooks = new Map<string, string>(); // googleId → status label
  addError: string | null = null;

  private searchTimer?: ReturnType<typeof setTimeout>;

  onQueryChange(): void {
    clearTimeout(this.searchTimer);
    this.searchError = null;

    if (!this.query.trim() || this.query.trim().length < 2) {
      this.results = [];
      this.hasSearched = false;
      return;
    }

    this.searchTimer = setTimeout(() => void this.runSearch(), 500);
  }

  async onSubmit(): Promise<void> {
    clearTimeout(this.searchTimer);
    await this.runSearch();
  }

  private async runSearch(): Promise<void> {
    const q = this.query.trim();
    if (q.length < 2) return;

    this.isSearching = true;
    this.searchError = null;
    this.hasSearched = true;
    this.openDropdownId = null;

    try {
      this.results = await this.bookService.searchBooks(q);
    } catch (err) {
      this.searchError = err instanceof Error ? err.message : 'Search failed. Please try again.';
      this.results = [];
    } finally {
      this.isSearching = false;
    }
  }

  toggleDropdown(googleId: string): void {
    this.openDropdownId = this.openDropdownId === googleId ? null : googleId;
    this.addError = null;
  }

  async addToShelf(book: GoogleBook, status: ShelfStatus): Promise<void> {
    this.openDropdownId = null;
    this.addingBookId = book.googleId;
    this.addError = null;

    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not signed in.');

      await this.bookService.addGoogleBookToShelf(book, user.id, status.id);
      this.addedBooks.set(book.googleId, status.label);
    } catch (err) {
      this.addError = err instanceof Error ? err.message : 'Could not add book. Try again.';
    } finally {
      this.addingBookId = null;
    }
  }

  getAddedLabel(googleId: string): string | null {
    return this.addedBooks.get(googleId) ?? null;
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }
}
