import { Component, HostListener, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';
import { TranslationService, DIALOG_COPY } from '../i18n';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (svc.state(); as s) {
      <div class="cd-overlay" (click)="cancel()">
        <div
          class="cd-dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="s.title || s.message"
          (click)="$event.stopPropagation()"
        >
          @if (s.title) {
            <h3 class="cd-title">{{ s.title }}</h3>
          }
          <p class="cd-message">{{ s.message }}</p>
          <div class="cd-actions">
            <button type="button" class="cd-btn cd-btn--cancel" (click)="cancel()">
              {{ s.cancelText || copy.cancel }}
            </button>
            <button
              type="button"
              class="cd-btn"
              [class.cd-btn--danger]="s.danger"
              [class.cd-btn--primary]="!s.danger"
              (click)="confirm()"
              autofocus
            >
              {{ s.confirmText || copy.confirm }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cd-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: cd-fade 0.15s ease;
    }

    .cd-dialog {
      width: 100%;
      max-width: 380px;
      background: var(--surface);
      color: var(--foreground);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
      animation: cd-pop 0.16s ease;
    }

    .cd-title {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 700;
    }

    .cd-message {
      margin: 0 0 22px;
      font-size: 15px;
      line-height: 1.5;
      color: var(--foreground);
      overflow-wrap: break-word;
    }

    .cd-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .cd-btn {
      min-height: 40px;
      padding: 0 18px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 999px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: opacity 0.15s, background 0.15s;

      &:hover { opacity: 0.9; }
    }

    .cd-btn--cancel {
      background: transparent;
      color: var(--foreground);
      border-color: var(--border);

      &:hover { background: var(--border); opacity: 1; }
    }

    .cd-btn--primary {
      background: var(--primary);
      color: var(--primary-foreground, #fff);
    }

    .cd-btn--danger {
      background: var(--destructive);
      color: #fff;
    }

    @keyframes cd-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cd-pop {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (max-width: 480px) {
      .cd-overlay { padding: 16px; align-items: flex-end; }
      .cd-dialog { max-width: 100%; border-radius: 20px 20px 16px 16px; padding: 22px 20px; }
      .cd-actions { flex-direction: column-reverse; }
      .cd-btn { width: 100%; min-height: 46px; }
    }
  `],
})
export class ConfirmDialogComponent {
  protected readonly svc = inject(ConfirmDialogService);
  private readonly translationService = inject(TranslationService);

  protected get copy() {
    return DIALOG_COPY[this.translationService.getCurrentLanguage()];
  }

  confirm(): void { this.svc.respond(true); }
  cancel(): void { this.svc.respond(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.svc.state()) this.svc.respond(false);
  }
}
