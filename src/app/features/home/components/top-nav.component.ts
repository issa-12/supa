import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationsService, AppNotification } from '../../../core/services/notifications.service';
import { NotificationsPanelComponent } from './notifications-panel.component';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, AsyncPipe, NotificationsPanelComponent],
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

        <div class="bell-wrapper">
          <button class="nav-icon-btn" aria-label="Notifications" (click)="togglePanel()">
            <iconify-icon icon="lucide:bell" style="font-size: 20px"></iconify-icon>
            @if (unreadCount$ | async; as count) {
              @if (count > 0) {
                <div class="notification-badge">{{ count > 9 ? '9+' : count }}</div>
              }
            }
          </button>

          @if (panelOpen) {
            <app-notifications-panel
              [notifications]="notifications"
              [isLoading]="panelLoading"
              (close)="closePanel()"
            />
          }
        </div>

        <img
          [src]="avatarUrl || 'https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F25-35%2FEuropean%2F2'"
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

      &:hover { opacity: 0.8; }
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

      &:hover { background: rgba(255, 250, 245, 0.8); }
      &:active { transform: scale(0.95); }
    }

    .bell-wrapper {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      background: var(--destructive);
      border-radius: 999px;
      border: 2px solid rgba(246, 239, 230, 0.95);
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
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

      &:hover { transform: scale(1.1); box-shadow: 0 6px 16px rgba(51, 38, 29, 0.15); }
      &:active { transform: scale(0.95); }
    }

    @media (max-width: 768px) {
      .top-nav { padding: 12px 20px; gap: 16px; }
      .search-bar-container { max-width: 250px; margin: 0 20px; }
      .brand-text { font-size: 24px; }
    }
  `],
})
export class TopNavComponent implements OnInit, OnDestroy {
  private readonly notificationsService = inject(NotificationsService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly unreadCount$ = this.notificationsService.unreadCount$;
  notifications: AppNotification[] = [];
  panelOpen = false;
  panelLoading = false;
  avatarUrl: string | null = null;

  private sub?: Subscription;

  async ngOnInit(): Promise<void> {
    this.sub = this.notificationsService.notifications$.subscribe((n) => {
      this.notifications = n;
    });

    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('profile_picture_url')
        .eq('id', user.id)
        .maybeSingle();

      this.avatarUrl = profile?.['profile_picture_url'] ?? null;

      await Promise.all([
        this.notificationsService.loadUnreadCount(),
        this.notificationsService.subscribeToRealtime(user.id),
      ]);
    } catch {
      // non-critical — nav still works
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.notificationsService.unsubscribe();
  }

  async togglePanel(): Promise<void> {
    if (this.panelOpen) { this.closePanel(); return; }
    this.panelOpen = true;
    this.panelLoading = true;
    await this.notificationsService.loadNotifications();
    this.panelLoading = false;
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
