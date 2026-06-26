import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService, HOME_COPY, LanguageCode, translateGenre } from '../../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { BookService } from '../../../core/services/book.service';

interface Book {
  id: string;
  googleBooksId?: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  description?: string | null;
  rating?: number;
  genre?: string | null;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `

    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-eyebrow">
          <span class="hero-eyebrow-dot"></span>
          {{ copy.heroPill }}
          @if (book.genre || genre) {
            <span class="hero-eyebrow-sep">·</span>
            <span class="hero-eyebrow-genre">{{ eyebrowText }}</span>
          }
        </div>

        <h1 class="hero-title">{{ book.title }}</h1>
        <div class="hero-author">{{ copy.byAuthor.replace('{{ author }}', book.author) }}</div>

        <p class="hero-desc">
          {{ descriptionPreview || copy.heroFallbackDescription }}
        </p>

        <div class="hero-actions">
          <button
            class="btn btn-primary"
            [class.btn-added]="addedToReading"
            (click)="onAddToReading()"
            [disabled]="addingToReading || addedToReading"
          >
            {{ addedToReading ? copy.heroAdded : (addingToReading ? copy.heroAdding : copy.heroAddToReading) }}
          </button>
          <button class="btn btn-ghost" (click)="onViewBook()" [disabled]="!book.googleBooksId">
            {{ copy.heroViewBook }}
          </button>
        </div>

        @if (addError) {
          <p class="hero-add-error">{{ copy.heroAddError }}</p>
        }
      </div>

      @if (!coverBroken && book.coverUrl) {
        <img
          class="hero-cover"
          [src]="book.coverUrl"
          [alt]="copy.coverAlt.replace('{{ title }}', book.title)"
          (error)="coverBroken = true"
        />
      } @else {
        <div class="hero-cover hero-cover--placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="opacity:0.35">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
      }
    </section>
  `,
  styles: [`
    :host {
      display: contents;
      --ui-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      // Lora first per the design spec; PT Serif (self-hosted) is the loaded
      // fallback that renders the intended serif look, then Georgia.
      --display-serif: 'Lora', 'PT Serif', Georgia, serif;
    }

    .hero-section {
      position: relative;
      // height grows to fit content — no fixed height, no max-height, no clipping.
      height: auto;
      min-height: 240px;
      // .main-col is a fixed-height flex column; without this the explicit
      // min-height above lets flexbox shrink the box below its content (the
      // buttons then spill out over the next section). Never shrink.
      flex-shrink: 0;
      padding: 40px 48px 36px;
      background: #EDE5D8;
      border: 0.5px solid #D9CFC0;
      border-radius: 18px;
      overflow: visible;
      font-family: var(--ui-sans);
    }

    // Left column: text + buttons. Capped at 55% so it never reaches the cover,
    // leaving generous breathing room in the middle of the card.
    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 55%;
    }

    .hero-eyebrow {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #C1553A;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .hero-eyebrow-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #C1553A;
    }

    .hero-eyebrow-sep { opacity: 0.55; }
    .hero-eyebrow-genre { color: inherit; }

    .hero-title {
      font-family: var(--display-serif);
      font-size: 36px;
      font-weight: 700;
      line-height: 1.2;
      color: #1C1410;
      margin: 0 0 8px;
      overflow-wrap: break-word;
      // Keep the title to at most two lines.
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .hero-author {
      font-size: 14px;
      font-style: italic;
      color: #6B5A4E;
      margin-bottom: 16px;
    }

    .hero-desc {
      font-size: 15px;
      line-height: 1.65;
      color: #3D2A1E;
      max-width: 460px;
      margin: 0 0 28px;
      overflow-wrap: break-word;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 28px;
      border-radius: 10px;
      font-size: 15px;
      white-space: nowrap;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s ease, opacity 0.2s ease;
    }

    .btn-primary {
      background: #C1553A;
      color: #fff;
      font-weight: 500;
      border: none;

      &:hover:not(:disabled) { background: #A8432A; }
      &:disabled { cursor: default; }
    }

    .btn-ghost {
      background: #fff;
      color: #C1553A;
      font-weight: 400;
      border: 1.5px solid rgba(193, 85, 58, 0.4);

      &:hover:not(:disabled) { background: #FAF0ED; }
      &:disabled { opacity: 0.55; cursor: default; }
    }

    .btn-added {
      background: #6E9764;
      border-color: #6E9764;
      &:hover:not(:disabled) { background: #6E9764; }
    }

    .hero-add-error {
      font-size: 13px;
      color: var(--destructive);
      margin: 12px 0 0;
    }

    // Straight cover pinned to the inline end edge, vertically centred.
    .hero-cover {
      position: absolute;
      inset-inline-end: 40px;
      top: 50%;
      transform: translateY(-50%);
      width: 140px;
      height: auto;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      display: block;
    }

    .hero-cover--placeholder {
      width: 140px;
      height: 204px;
      background: var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted-foreground);
    }

    @media (max-width: 768px) {
      .hero-section { padding: 28px 24px; }
      .hero-content { max-width: 100%; }
      .hero-title { font-size: 30px; }

      // On phones the absolute cover would overlap the text — drop it into flow
      // beneath the content instead.
      .hero-cover {
        position: static;
        transform: none;
        margin-top: 24px;
      }
    }
  `],
})
export class HeroSectionComponent implements OnChanges {
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);
  private readonly bookService = inject(BookService);

  @Input() book!: Book;
  @Input() genre: string | null = null;
  @Input() currentUserId: string | null = null;
  @Output() addToReading = new EventEmitter<Book>();

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return HOME_COPY[this.lang]; }

  // "Because you like <genre>" using the hero book's own genre when available,
  // falling back to the user's top genre, then a generic label.
  protected get eyebrowText(): string {
    const g = this.book?.genre || this.genre;
    return g ? `${this.copy.heroEyebrowPrefix} ${translateGenre(g, this.lang)}` : this.copy.heroEyebrow;
  }

  // Display-only: the translated genre name shown in the cover tag pill.
  protected get heroGenreLabel(): string {
    const g = this.book?.genre || this.genre;
    return g ? translateGenre(g, this.lang) : '';
  }

  coverBroken = false;
  addingToReading = false;
  addedToReading = false;
  addError = false;

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When the hero book or user changes, check if it's already on the shelf.
    if ((changes['book'] || changes['currentUserId']) && this.book?.googleBooksId && this.currentUserId) {
      this.addedToReading = false;
      void this.checkAlreadyAdded();
    }
  }

  private async checkAlreadyAdded(): Promise<void> {
    try {
      const userBook = await firstValueFrom(
        this.bookService.getUserBookByGoogleId(this.currentUserId!, this.book.googleBooksId!)
      );
      this.addedToReading = !!userBook;
    } catch { /* non-critical */ }
  }

  // Google Books descriptions contain HTML markup; strip tags + decode common
  // entities so the hero shows clean text (not raw <p>/&quot;), then truncate.
  protected get descriptionPreview(): string {
    const raw = this.book?.description;
    if (!raw) return '';
    const text = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 220 ? text.slice(0, 220) + '…' : text;
  }

  onViewBook(): void {
    if (this.book.googleBooksId) {
      this.router.navigate(['/books', this.book.googleBooksId]);
    }
  }

  async onAddToReading(): Promise<void> {
    if (this.addingToReading || this.addedToReading) return;
    if (!this.currentUserId) return;

    this.addingToReading = true;
    this.addError = false;
    try {
      await this.bookService.addToCurrentlyReading(this.currentUserId, this.book, 'want_to_read');
      this.addedToReading = true;
      this.addToReading.emit(this.book);
    } catch {
      this.addError = true;
    } finally {
      this.addingToReading = false;
    }
  }
}
