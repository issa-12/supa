import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService, HOME_COPY, LanguageCode } from '../../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Book {
  id: string;
  googleBooksId?: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  description?: string | null;
  rating?: number;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `

    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-labels">
          <div class="hero-pill">
            <iconify-icon icon="lucide:sparkles" style="font-size: 14px; margin-right: 6px"></iconify-icon>
            {{ copy.heroPill }}
          </div>
          <span class="eyebrow">{{ copy.heroEyebrow }}</span>
        </div>

        <div class="hero-title-group">
          <h1 class="text-h1">{{ book.title }}</h1>
          <div class="hero-author">by {{ book.author }}</div>
        </div>

        <p class="text-body">
          {{ book.description ? (book.description.length > 220 ? book.description.slice(0, 220) + '…' : book.description) : copy.heroFallbackDescription }}
        </p>

        <div class="hero-actions">
          <button class="btn btn-primary" (click)="onViewBook()" [disabled]="!book.googleBooksId">
            {{ copy.heroViewBook }}
          </button>
          <button class="btn btn-outline" (click)="onAddToReading()" [disabled]="addingToReading">
            <iconify-icon icon="lucide:bookmark-plus" style="font-size: 18px"></iconify-icon>
            {{ addingToReading ? copy.heroAdding : copy.heroAddToReading }}
          </button>
        </div>
      </div>

      <div class="hero-cover-wrapper">
        @if (!coverBroken && book.coverUrl) {
          <img
            class="hero-cover"
            [src]="book.coverUrl"
            [alt]="book.title + ' Cover'"
            (error)="coverBroken = true"
          />
        } @else {
          <div class="hero-cover hero-cover--placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="opacity:0.3">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
        }
        <div class="hero-cover-shadow"></div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .hero-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 48px;
      padding: 56px 64px;
      background: var(--surface);
      border-radius: 32px;
      border: 1px solid transparent;
    }

    .hero-content {
      flex: 1;
      // Without min-width:0 a flex item won't shrink below its content size,
      // so a long title/word pushes past the container instead of wrapping.
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 600px;
    }

    .hero-labels {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .hero-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      background: var(--primary-soft);
      color: var(--primary);
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .hero-title-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .text-h1 {
      font-size: 44px;
      line-height: 1.15;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: -0.6px;
      margin: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .hero-author {
      font-size: 20px;
      font-weight: 500;
      color: var(--muted-foreground);
    }

    .text-body {
      font-size: 16px;
      line-height: 1.7;
      font-weight: 500;
      color: var(--muted-foreground);
      margin: 0;
      overflow-wrap: break-word;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 8px;
    }

    .btn {
      min-height: 48px;
      padding: 0 24px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: var(--primary);
      color: var(--primary-foreground);
       &:hover {
        transform: translateY(-2px);
         }

      &:active {
        transform: translateY(0);
      }
    }

    .btn-outline {
      background: var(--surface);
      color: var(--foreground);
      border: 1px solid rgba(126, 107, 93, 0.3);

      &:hover {
        background: var(--surface);
      }

      &:active {
        transform: scale(0.98);
      }
    }

    .hero-cover-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .hero-cover {
      width: 240px;
      height: 360px;
      object-fit: cover;
      border-radius: 8px 12px 12px 8px;
       transform: perspective(1000px) rotateY(-10deg);
      display: block;

      &--placeholder {
        background: var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted-foreground);
      }
    }

    .hero-cover-shadow {
      display: none;
    }

    .eyebrow {
      font-size: 12px;
      line-height: 1.4;
      letter-spacing: 0.8px;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      white-space: nowrap;
    }

    @media (max-width: 1024px) {
      .hero-section {
        flex-direction: column;
        text-align: center;
        gap: 32px;
        padding: 40px;
      }

      .hero-cover {
        width: 200px;
        height: 300px;
      }
    }

    @media (max-width: 768px) {
      .hero-section {
        padding: 24px 20px;
        gap: 24px;
      }

      .hero-content {
        max-width: 100%;
      }

      .hero-labels {
        flex-wrap: wrap;
        justify-content: center;
      }

      .eyebrow {
        white-space: normal;
      }

      .text-h1 {
        font-size: 32px;
      }

      .hero-actions {
        flex-direction: column;
        width: 100%;
      }

      .btn {
        width: 100%;
      }

      .hero-cover {
        width: 160px;
        height: 240px;
      }
    }
  `],
})
export class HeroSectionComponent {
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  @Input() book!: Book;
  @Output() addToReading = new EventEmitter<Book>();

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return HOME_COPY[this.lang]; }

  coverBroken = false;
  addingToReading = false;

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  onViewBook(): void {
    if (this.book.googleBooksId) {
      this.router.navigate(['/books', this.book.googleBooksId]);
    }
  }

  onAddToReading(): void {
    this.addingToReading = true;
    this.addToReading.emit(this.book);
    setTimeout(() => { this.addingToReading = false; }, 1500);
  }
}
