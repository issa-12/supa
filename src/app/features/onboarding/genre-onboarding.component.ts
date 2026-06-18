import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { TranslationService, ONBOARDING_COPY, LanguageCode, GenreNamePipe } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Genre {
  genre_id: number;
  genre_name: string;
}

@Component({
  selector: 'app-genre-onboarding',
  standalone: true,
  imports: [GenreNamePipe],
  template: `
    <main class="onboarding-page">
      <div class="onboarding-card">
        <header class="onboarding-header">
          <div class="brand">
            <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 7v14"/>
              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>
            </svg>
            ReadTrack
          </div>
          <h1 class="onboarding-title">{{ copy.onboardingTitle }}</h1>
          <p class="onboarding-subtitle">
            {{ copy.onboardingSubtitle }}
          </p>
        </header>

        @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>{{ copy.loadingGenresMsg }}</p>
          </div>
        } @else if (error) {
          <div class="error-state">
            <p>{{ error }}</p>
            <button class="btn btn-outline" (click)="loadGenres()">{{ copy.tryAgainBtn }}</button>
          </div>
        } @else {
          <div class="genre-grid">
            @for (genre of genres; track genre.genre_id) {
              <button
                class="genre-chip"
                [class.genre-chip--selected]="isSelected(genre.genre_id)"
                (click)="toggleGenre(genre.genre_id)"
                [attr.aria-pressed]="isSelected(genre.genre_id)"
              >
                @if (isSelected(genre.genre_id)) {
                  <svg class="chip-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                }
                {{ genre.genre_name | genreName:lang }}
              </button>
            }
          </div>

          @if (submitError) {
            <p class="form-error" role="alert">{{ submitError }}</p>
          }

          <button
            class="btn btn-primary"
            [disabled]="isSaving || selectedGenreIds.size === 0"
            (click)="saveGenres()"
          >
            @if (isSaving) {
              {{ copy.savingMsg }}
            } @else {
              {{ copy.continueBtn }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            }
          </button>

          <p class="selection-hint">
            {{ selectedGenreIds.size }} genre{{ selectedGenreIds.size === 1 ? '' : 's' }} selected
          </p>
        }
      </div>
    </main>
  `,
  styles: [`
    .onboarding-page {
      min-height: 100dvh;
      background: #f4ede5;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .onboarding-card {
      background: var(--surface);
      border-radius: 28px;
      border: 1px solid transparent;
      padding: 48px 40px;
      width: 100%;
      max-width: 680px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 8px;
    }

    .brand-icon {
      width: 28px;
      height: 28px;
      color: var(--primary);
    }

    .onboarding-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .onboarding-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
      letter-spacing: -0.4px;
    }

    .onboarding-subtitle {
      font-size: 15px;
      color: var(--muted-foreground);
      margin: 0;
      line-height: 1.6;
    }

    .genre-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .genre-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: 999px;
      border: 1.5px solid var(--border);
      background: var(--surface);
      color: var(--foreground);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
      font-family: inherit;

      &:hover {
        border-color: var(--primary);
        background: var(--primary-soft);
        color: var(--primary);
      }

      &--selected {
        background: var(--primary);
        border-color: var(--primary);
        color: #fff;

        &:hover {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }
      }
    }

    .chip-check {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .btn {
      min-height: 52px;
      padding: 0 28px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;

      svg {
        width: 18px;
        height: 18px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
      }
    }

    .btn-primary {
      background: var(--primary);
      color: #fff;
      align-self: flex-start;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
      }
    }

    .btn-outline {
      background: transparent;
      color: var(--foreground);
      border: 1.5px solid rgba(126, 107, 93, 0.3);
    }

    .selection-hint {
      font-size: 13px;
      color: var(--muted-foreground);
      margin: -16px 0 0;
    }

    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px 0;
      color: var(--muted-foreground);
      font-size: 15px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(217, 119, 87, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .form-error {
      color: var(--destructive);
      font-size: 14px;
      margin: -16px 0 0;
    }

    @media (max-width: 600px) {
      .onboarding-card {
        padding: 32px 24px;
        border-radius: 20px;
      }

      .onboarding-title {
        font-size: 22px;
      }

      .btn-primary {
        width: 100%;
      }
    }
  `],
})
export class GenreOnboardingComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return ONBOARDING_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  genres: Genre[] = [];
  selectedGenreIds = new Set<number>();
  isLoading = true;
  isSaving = false;
  error = '';
  submitError = '';

  async ngOnInit(): Promise<void> {
    await this.loadGenres();
  }

  async loadGenres(): Promise<void> {
    this.isLoading = true;
    this.error = '';

    try {
      const supabase = await this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('genres')
        .select('genre_id, genre_name')
        .order('genre_name');

      if (error) throw error;
      this.genres = data ?? [];
    } catch (err) {
      this.error = this.copy.couldNotLoadGenresMsg;
    } finally {
      this.isLoading = false;
    }
  }

  toggleGenre(genreId: number): void {
    if (this.selectedGenreIds.has(genreId)) {
      this.selectedGenreIds.delete(genreId);
    } else {
      this.selectedGenreIds.add(genreId);
    }
  }

  isSelected(genreId: number): boolean {
    return this.selectedGenreIds.has(genreId);
  }

  async saveGenres(): Promise<void> {
    if (this.isSaving) return;
    if (this.selectedGenreIds.size === 0) {
      this.submitError = this.copy.selectAtLeastOne;
      return;
    }

    this.isSaving = true;
    this.submitError = '';

    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const desired = Array.from(this.selectedGenreIds);

      // Idempotent: ensure every selected pair exists (insert ignoring
      // duplicates), then delete any pairs that weren't selected. Either
      // ordering is safe to retry, unlike the previous delete-then-insert
      // pattern which could leave the user with zero genres on partial
      // failure.
      const rows = desired.map((genre_id) => ({ user_id: user.id, genre_id }));
      const { error: upsertErr } = await supabase
        .from('user_genres')
        .upsert(rows, { onConflict: 'user_id,genre_id', ignoreDuplicates: true });
      if (upsertErr) throw upsertErr;

      const { error: deleteErr } = await supabase
        .from('user_genres')
        .delete()
        .eq('user_id', user.id)
        .not('genre_id', 'in', `(${desired.join(',')})`);
      if (deleteErr) throw deleteErr;

      // replaceUrl so the onboarding page leaves history — back from /home
      // must not return to the genre picker.
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (err) {
      this.submitError = this.copy.saveGenresFailed;
    } finally {
      this.isSaving = false;
    }
  }
}
