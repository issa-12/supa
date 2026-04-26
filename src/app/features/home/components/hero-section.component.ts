import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
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
            Recommended for you
          </div>
          <span class="eyebrow">Because you like Mystery</span>
        </div>

        <div class="hero-title-group">
          <h1 class="text-h1">{{ book.title }}</h1>
          <div class="hero-author">by {{ book.author }}</div>
        </div>

        <p class="text-body">
          A charmingly eccentric hotel maid discovers a guest murdered in his bed, turning her meticulously ordered world upside
          down. A Clue-like, locked-room mystery.
        </p>

        <div class="hero-actions">
          <button class="btn btn-primary" (click)="onViewBook()">
            View Book
          </button>
          <button class="btn btn-outline" (click)="onAddToReading()">
            <iconify-icon icon="lucide:bookmark-plus" style="font-size: 18px"></iconify-icon>
            Add to Reading
          </button>
        </div>
      </div>

      <div class="hero-cover-wrapper">
        <img
          class="hero-cover"
          [src]="book.coverUrl"
          [alt]="book.title + ' Cover'"
        />
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
      background: rgba(255, 250, 245, 0.65);
      border-radius: 32px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 20px 40px rgba(51, 38, 29, 0.04);
      backdrop-filter: blur(8px);
    }

    .hero-content {
      flex: 1;
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
      background: rgba(233, 120, 63, 0.12);
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
      background: linear-gradient(135deg, var(--primary) 0%, var(--warning) 100%);
      color: var(--primary-foreground);
      box-shadow: 0 12px 24px rgba(233, 120, 63, 0.22);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 32px rgba(233, 120, 63, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .btn-outline {
      background: rgba(255, 250, 245, 0.7);
      color: var(--foreground);
      border: 1px solid rgba(126, 107, 93, 0.3);

      &:hover {
        background: rgba(255, 250, 245, 0.9);
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
      box-shadow: 20px 24px 40px rgba(51, 38, 29, 0.2);
      transform: perspective(1000px) rotateY(-10deg);
      display: block;
    }

    .hero-cover-shadow {
      position: absolute;
      bottom: 20px;
      left: 10%;
      width: 80%;
      height: 16px;
      border-radius: 50%;
      background: rgba(51, 38, 29, 0.3);
      filter: blur(14px);
      z-index: -1;
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
  @Input() book!: Book;
  @Output() addToReading = new EventEmitter<Book>();

  onViewBook(): void {
    // TODO: Navigate to book detail page
    console.log('View book:', this.book.title);
  }

  onAddToReading(): void {
    this.addToReading.emit(this.book);
  }
}
