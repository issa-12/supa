import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

interface Genre {
  genre_id: number;
  genre_name: string;
}

@Component({
  selector: 'app-genre-onboarding',
  standalone: true,
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
          <h1 class="onboarding-title">What do you love to read?</h1>
          <p class="onboarding-subtitle">
            Pick at least one genre so we can personalise your recommendations.
          </p>
        </header>

        @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading genres…</p>
          </div>
        } @else if (error) {
          <div class="error-state">
            <p>{{ error }}</p>
            <button class="btn btn-outline" (click)="loadGenres()">Try again</button>
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
                {{ genre.genre_name }}
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
              Saving…
            } @else {
              Continue
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
      background: rgba(255, 250, 245, 0.9);
      border-radius: 28px;
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 28px 60px rgba(51, 38, 29, 0.12);
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
      border: 1.5px solid rgba(126, 107, 93, 0.25);
      background: rgba(255, 250, 245, 0.7);
      color: var(--foreground);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
      font-family: inherit;

      &:hover {
        border-color: var(--primary);
        background: rgba(233, 120, 63, 0.06);
        color: var(--primary);
      }

      &--selected {
        background: var(--primary);
        border-color: var(--primary);
        color: #fff;
        box-shadow: 0 4px 12px rgba(233, 120, 63, 0.28);

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
      background: linear-gradient(135deg, var(--primary) 0%, var(--warning) 100%);
      color: #fff;
      box-shadow: 0 12px 24px rgba(233, 120, 63, 0.22);
      align-self: flex-start;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 16px 32px rgba(233, 120, 63, 0.3);
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
      border: 3px solid rgba(233, 120, 63, 0.2);
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
      this.error = 'Could not load genres. Please refresh.';
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
    if (this.selectedGenreIds.size === 0) {
      this.submitError = 'Please select at least one genre.';
      return;
    }

    this.isSaving = true;
    this.submitError = '';

    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Delete existing selections, then re-insert (handles re-onboarding)
      await supabase.from('user_genres').delete().eq('user_id', user.id);

      const rows = Array.from(this.selectedGenreIds).map(genre_id => ({
        user_id: user.id,
        genre_id,
      }));

      const { error } = await supabase.from('user_genres').insert(rows);
      if (error) throw error;

      await this.router.navigateByUrl('/home');
    } catch (err) {
      this.submitError = err instanceof Error ? err.message : 'Failed to save genres. Please try again.';
    } finally {
      this.isSaving = false;
    }
  }
}
