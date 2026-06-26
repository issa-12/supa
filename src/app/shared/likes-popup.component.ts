import { Component, Input, Output, EventEmitter, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LikesService, LikerUser } from '../core/services/likes.service';
import { FriendshipService } from '../core/services/friendship.service';
import { TranslationService } from '../i18n';

const LIKES_COPY = {
  en: { likes: 'likes', friend: 'Friend', add: 'Add', pending: 'Pending', empty: 'No likes yet.' },
  ar: { likes: 'إعجابات', friend: 'صديق', add: 'إضافة', pending: 'بانتظار', empty: 'لا إعجابات بعد.' },
  fr: { likes: "j'aime", friend: 'Ami', add: 'Ajouter', pending: 'En attente', empty: 'Aucun j\'aime.' },
};

@Component({
  selector: 'app-likes-popup',
  standalone: true,
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="lp-backdrop" (click)="closed.emit()"></div>
    <div class="lp-card" (click)="$event.stopPropagation()">
      <div class="lp-header">
        <iconify-icon icon="lucide:heart" style="font-size:14px;color:#C1553A;flex-shrink:0"></iconify-icon>
        <span class="lp-title">{{ count }}&nbsp;{{ copy.likes }}</span>
        <button class="lp-close" (click)="closed.emit()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="lp-body">
        @if (loading) {
          <div class="lp-spinner-wrap"><div class="lp-spinner"></div></div>
        } @else if (likers.length === 0) {
          <p class="lp-empty">{{ copy.empty }}</p>
        } @else {
          @for (user of likers; track user.userId) {
            <div class="lp-row">
              @if (user.userId !== currentUserId) {
                @if (pendingIds.has(user.userId) || user.isPending) {
                  <span class="lp-icon-btn lp-icon-btn--pending" [title]="copy.pending">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                } @else if (user.isFriend) {
                  <span class="lp-icon-btn lp-icon-btn--friend" [title]="copy.friend">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                  </span>
                } @else {
                  <button class="lp-icon-btn lp-icon-btn--add" [title]="copy.add" (click)="addFriend(user.userId)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  </button>
                }
              } @else {
                <span class="lp-icon-placeholder"></span>
              }
              <a class="lp-row-link" [routerLink]="['/profile', user.userId]" (click)="closed.emit()">
                <span class="lp-av">
                  @if (user.avatarUrl) {
                    <img [src]="user.avatarUrl" [alt]="user.name" loading="lazy" (error)="user.avatarUrl = null" />
                  } @else {
                    {{ user.name[0].toUpperCase() }}
                  }
                </span>
                <span class="lp-info">
                  <span class="lp-name">{{ user.name }}</span>
                  @if (user.username) { <span class="lp-handle">&#64;{{ user.username }}</span> }
                </span>
              </a>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .lp-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
    }

    .lp-card {
      position: fixed;
      z-index: 1001;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(300px, 90vw);
      max-height: min(380px, 80vh);
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e5e0d8);
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.14);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: lp-in 0.15s ease;
    }

    @keyframes lp-in {
      from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
      to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    .lp-header {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 12px 14px 10px;
      border-bottom: 1px solid var(--border, #e5e0d8);
      flex-shrink: 0;
    }

    .lp-title {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
    }

    .lp-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted-foreground);
      padding: 2px;
      display: flex;
      &:hover { color: var(--foreground); }
    }

    .lp-body {
      overflow-y: auto;
      flex: 1;
      padding: 6px 8px 10px;
    }

    .lp-spinner-wrap {
      display: flex;
      justify-content: center;
      padding: 24px;
    }

    .lp-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border);
      border-top-color: var(--primary, #C1553A);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .lp-empty {
      text-align: center;
      font-size: 13px;
      color: var(--muted-foreground);
      padding: 20px;
    }

    .lp-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 4px;
      direction: ltr;
    }

    .lp-row-link {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
      text-decoration: none;
      border-radius: 10px;
      padding: 4px 6px;
      transition: background 0.13s;
      &:hover { background: var(--surface-alt, #f5f0e8); }
    }

    .lp-av {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--primary, #C1553A);
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .lp-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .lp-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lp-handle {
      font-size: 11px;
      color: var(--muted-foreground);
    }

    .lp-icon-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: none;
      cursor: default;

      &--add {
        background: rgba(193,85,58,0.12);
        color: var(--primary, #C1553A);
        cursor: pointer;
        transition: background 0.15s;
        &:hover { background: rgba(193,85,58,0.22); }
      }

      &--friend {
        background: rgba(193,85,58,0.1);
        color: var(--primary, #C1553A);
      }

      &--pending {
        background: rgba(122,106,90,0.1);
        color: #7A6A5A;
      }
    }

    .lp-icon-placeholder {
      width: 28px;
      flex-shrink: 0;
    }
  `],
})
export class LikesPopupComponent implements OnInit {
  @Input() type: 'post' | 'comment' = 'post';
  @Input() entityId!: number;
  @Input() currentUserId!: string;
  @Input() count = 0;
  @Output() closed = new EventEmitter<void>();

  private readonly likesService = inject(LikesService);
  private readonly friendshipService = inject(FriendshipService);
  private readonly translationService = inject(TranslationService);

  likers: LikerUser[] = [];
  loading = true;
  pendingIds = new Set<string>();

  get copy() {
    const lang = this.translationService.getCurrentLanguage();
    return LIKES_COPY[lang] ?? LIKES_COPY['en'];
  }

  async ngOnInit(): Promise<void> {
    try {
      this.likers = this.type === 'post'
        ? await this.likesService.getPostLikers(this.entityId, this.currentUserId)
        : await this.likesService.getCommentLikers(this.entityId, this.currentUserId);
    } catch { /* ignore */ }
    finally { this.loading = false; }
  }

  async addFriend(userId: string): Promise<void> {
    if (this.pendingIds.has(userId)) return;
    try {
      await this.friendshipService.sendRequest(userId);
      this.pendingIds = new Set([...this.pendingIds, userId]);
    } catch { /* ignore */ }
  }
}
