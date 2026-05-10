import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="top-nav">
      <div class="brand" routerLink="/">
        <div class="brand-icon">
          <iconify-icon icon="lucide:book-open" style="font-size: 22px"></iconify-icon>
        </div>
        <div class="brand-text">ReadTrack</div>
      </div>

      <a class="search-bar-container" routerLink="/books/search" aria-label="Search books">
        <iconify-icon icon="lucide:search" class="search-icon"></iconify-icon>
        <div class="search-input">Search books or users...</div>
      </a>

      <div class="nav-actions">
        <a routerLink="/shelf" class="nav-icon-btn" aria-label="My Shelf">
          <iconify-icon icon="lucide:library" style="font-size: 20px"></iconify-icon>
        </a>
        <button class="nav-icon-btn" aria-label="Notifications">
          <iconify-icon icon="lucide:bell" style="font-size: 20px"></iconify-icon>
          <div class="notification-badge"></div>
        </button>
        <img
          src="https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F25-35%2FEuropean%2F2"
          alt="Profile"
          class="nav-avatar"
          (click)="navigateToProfile()"
        />
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 40px;
      background: rgba(246, 239, 230, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(126, 107, 93, 0.12);
      position: relative;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      white-space: nowrap;
      cursor: pointer;
      text-decoration: none;
      color: inherit;

      &:hover {
        opacity: 0.8;
      }
    }

    .brand-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(233, 120, 63, 0.2);
    }

    .brand-text {
      font-size: 28px;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: -0.5px;
    }

    .search-bar-container {
      flex: 1;
      max-width: 500px;
      margin: 0 40px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 250, 245, 0.7);
      border: 1px solid rgba(126, 107, 93, 0.2);
      border-radius: 999px;
      padding: 10px 20px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
      cursor: pointer;
      text-decoration: none;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:hover {
        border-color: rgba(233, 120, 63, 0.4);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02), 0 0 0 3px rgba(233, 120, 63, 0.08);
      }
    }

    .search-icon {
      width: 18px;
      height: 18px;
      color: var(--muted-foreground);
      flex-shrink: 0;
    }

    .search-input {
      font-size: 15px;
      color: var(--muted-foreground);
      font-weight: 500;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .nav-icon-btn {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 250, 245, 0.6);
      border: 1px solid rgba(126, 107, 93, 0.15);
      color: var(--foreground);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 250, 245, 0.8);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .notification-badge {
      position: absolute;
      top: 10px;
      right: 12px;
      width: 8px;
      height: 8px;
      background: var(--destructive);
      border-radius: 50%;
      border: 2px solid rgba(255, 250, 245, 0.9);
    }

    .nav-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 250, 245, 0.9);
      box-shadow: 0 4px 12px rgba(51, 38, 29, 0.1);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(51, 38, 29, 0.15);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    @media (max-width: 768px) {
      .top-nav {
        padding: 12px 20px;
        gap: 16px;
      }

      .search-bar-container {
        max-width: 250px;
        margin: 0 20px;
      }

      .brand-text {
        font-size: 24px;
      }
    }
  `],
})
export class TopNavComponent {
  constructor(private router: Router) {}

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
