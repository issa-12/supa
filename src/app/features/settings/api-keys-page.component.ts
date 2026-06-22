import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { ApiKeyService, ApiKey, CreatedApiKey } from '../../core/services/api-key.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { TranslationService, API_KEYS_COPY, LanguageCode } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeAgo } from '../../core/util/time-ago';
import { TopNavComponent } from '../home/components/top-nav.component';

@Component({
  selector: 'app-api-keys-page',
  standalone: true,
  imports: [FormsModule, TopNavComponent],
  template: `
    <app-top-nav />

    <main class="page">
      <header class="page-head">
        <button class="back-btn" (click)="goBack()" [attr.aria-label]="copy.back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div>
          <h1>{{ copy.title }}</h1>
          <p class="subtitle">{{ copy.subtitle }}</p>
        </div>
      </header>

      <!-- Create -->
      <section class="card">
        <h2>{{ copy.createTitle }}</h2>
        <div class="create-row">
          <input
            class="text-input"
            type="text"
            [(ngModel)]="newName"
            [placeholder]="copy.namePlaceholder"
            maxlength="60"
            (keydown.enter)="create()"
          />
          <button class="btn-primary" [disabled]="!newName.trim() || creating" (click)="create()">
            {{ creating ? copy.creating : copy.createBtn }}
          </button>
        </div>
        @if (createError) { <p class="error">{{ createError }}</p> }

        <!-- One-time reveal of the new secret -->
        @if (newKey) {
          <div class="reveal">
            <div class="reveal-head">
              <strong>{{ copy.newKeyTitle }}</strong>
              <button class="btn-ghost" (click)="dismissNewKey()">{{ copy.doneBtn }}</button>
            </div>
            <div class="secret-row">
              <code class="secret">{{ newKey.key }}</code>
              <button class="btn-copy" (click)="copyKey()">{{ copied ? copy.copied : copy.copyBtn }}</button>
            </div>
            <p class="warn">{{ copy.newKeyWarning }}</p>
          </div>
        }
      </section>

      <!-- List -->
      <section class="card">
        <h2>{{ copy.listTitle }}</h2>

        @if (loading) {
          <p class="muted">{{ copy.loading }}</p>
        } @else if (loadError) {
          <p class="error">{{ loadError }}</p>
        } @else if (keys.length === 0) {
          <p class="muted">{{ copy.empty }}</p>
        } @else {
          <ul class="key-list">
            @for (k of keys; track k.id) {
              <li class="key-item" [class.key-item--revoked]="!!k.revokedAt">
                <div class="key-main">
                  <div class="key-name-row">
                    <span class="key-name">{{ k.name }}</span>
                    <span class="badge" [class.badge--revoked]="!!k.revokedAt">
                      {{ k.revokedAt ? copy.statusRevoked : copy.statusActive }}
                    </span>
                    @for (s of k.scopes; track s) { <span class="scope">{{ s }}</span> }
                  </div>
                  <code class="key-prefix">{{ k.keyPrefix }}…</code>
                  <div class="key-meta">
                    <span>{{ copy.colCreated }}: {{ timeAgo(k.createdAt, lang) }}</span>
                    <span>{{ copy.colLastUsed }}: {{ k.lastUsedAt ? timeAgo(k.lastUsedAt, lang) : copy.never }}</span>
                  </div>
                </div>
                @if (!k.revokedAt) {
                  <button class="btn-danger" [disabled]="revokingId === k.id" (click)="revoke(k)">
                    {{ copy.revokeBtn }}
                  </button>
                }
              </li>
            }
          </ul>
          @if (revokeError) { <p class="error">{{ revokeError }}</p> }
        }
      </section>

      <!-- Help -->
      <section class="card help">
        <h2>{{ copy.usageTitle }}</h2>
        <p class="muted">{{ copy.usageIntro }}</p>
        <code class="usage-example">X-API-Key: rt_live_…</code>
        <a class="btn-ghost docs-link" href="/api/docs" target="_blank" rel="noopener">
          {{ copy.docsLink }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      --ui-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    }
    .page {
      max-width: 760px;
      margin: 0 auto;
      padding: 24px 16px 60px;
      font-family: var(--ui-sans);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .page-head { display: flex; align-items: flex-start; gap: 12px; }
    .back-btn {
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      width: 38px; height: 38px;
      border: 1px solid var(--border); border-radius: 10px;
      background: var(--surface); color: var(--foreground); cursor: pointer;
      &:hover { background: var(--surface-alt); }
    }
    h1 { font-size: 22px; font-weight: 700; color: var(--foreground); margin: 2px 0 4px; }
    .subtitle { font-size: 13px; color: var(--muted-foreground); margin: 0; }
    h2 { font-size: 15px; font-weight: 600; color: var(--foreground); margin: 0 0 12px; }

    .card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
    }

    .create-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .text-input {
      flex: 1; min-width: 200px;
      padding: 10px 14px;
      border: 1px solid var(--border); border-radius: 10px;
      font-size: 14px; color: var(--foreground); background: var(--surface);
      outline: none;
      &:focus { border-color: var(--primary); }
    }

    .btn-primary {
      padding: 10px 18px; border: none; border-radius: 10px;
      background: var(--primary); color: #fff; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      &:disabled { opacity: 0.45; cursor: not-allowed; }
      &:not(:disabled):hover { background: var(--accent); }
    }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 12px; border: 1px solid var(--border); border-radius: 10px;
      background: transparent; color: var(--foreground); font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; text-decoration: none;
      &:hover { background: var(--surface-alt); }
    }
    .btn-danger {
      flex-shrink: 0;
      padding: 8px 14px; border: 1px solid rgba(220,38,38,0.3); border-radius: 9px;
      background: rgba(220,38,38,0.06); color: #dc2626; font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      &:not(:disabled):hover { background: rgba(220,38,38,0.12); }
    }

    .reveal {
      margin-top: 14px;
      border: 1px solid rgba(217,119,87,0.35);
      background: var(--primary-soft);
      border-radius: 12px; padding: 14px;
    }
    .reveal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .secret-row { display: flex; gap: 8px; align-items: stretch; }
    .secret {
      flex: 1; min-width: 0;
      font-family: 'SFMono-Regular', Consolas, monospace; font-size: 13px;
      background: #fff; border: 1px solid var(--border); border-radius: 8px;
      padding: 10px 12px; color: var(--foreground);
      overflow-x: auto; white-space: nowrap;
    }
    .btn-copy {
      flex-shrink: 0;
      padding: 0 14px; border: none; border-radius: 8px;
      background: var(--primary); color: #fff; font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      &:hover { background: var(--accent); }
    }
    .warn { font-size: 12px; color: #9a3412; margin: 10px 0 0; }

    .key-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .key-item {
      display: flex; align-items: center; gap: 12px;
      border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px;
      &--revoked { opacity: 0.6; }
    }
    .key-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
    .key-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .key-name { font-size: 14px; font-weight: 600; color: var(--foreground); }
    .badge {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
      padding: 2px 8px; border-radius: 999px;
      background: rgba(22,163,74,0.12); color: #15803d;
      &--revoked { background: rgba(220,38,38,0.1); color: #b91c1c; }
    }
    .scope {
      font-size: 10px; font-weight: 600;
      padding: 2px 7px; border-radius: 999px;
      background: var(--surface-alt); color: var(--muted-foreground);
    }
    .key-prefix { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; color: var(--muted-foreground); }
    .key-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 11px; color: var(--muted-foreground); }

    .usage-example {
      display: block; margin: 4px 0 12px;
      font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px;
      background: var(--surface-alt); border-radius: 8px; padding: 8px 12px; color: var(--foreground);
    }
    .docs-link { width: fit-content; }

    .muted { font-size: 13px; color: var(--muted-foreground); margin: 0; }
    .error {
      font-size: 13px; color: var(--destructive);
      background: rgba(220,38,38,0.07); border-radius: 8px; padding: 8px 12px; margin: 10px 0 0;
    }

    @media (max-width: 480px) {
      .key-item { flex-direction: column; align-items: stretch; }
      .btn-danger { align-self: flex-end; }
    }
  `],
})
export class ApiKeysPageComponent implements OnInit {
  private readonly apiKeyService = inject(ApiKeyService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly location = inject(Location);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return API_KEYS_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe((l) => (this.lang = l));
  }

  keys: ApiKey[] = [];
  loading = true;
  loadError: string | null = null;

  newName = '';
  creating = false;
  createError: string | null = null;
  newKey: CreatedApiKey | null = null;
  copied = false;

  revokingId: string | null = null;
  revokeError: string | null = null;

  readonly timeAgo = timeAgo;

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.loadError = null;
    try {
      this.keys = await this.apiKeyService.list();
    } catch {
      this.loadError = this.copy.loadError;
    } finally {
      this.loading = false;
    }
  }

  async create(): Promise<void> {
    const name = this.newName.trim();
    if (!name || this.creating) return;
    this.creating = true;
    this.createError = null;
    this.copied = false;
    try {
      const created = await this.apiKeyService.create(name);
      this.newKey = created;
      this.newName = '';
      // Prepend to the list (CreatedApiKey is a superset of ApiKey).
      this.keys = [created, ...this.keys];
    } catch {
      this.createError = this.copy.createError;
    } finally {
      this.creating = false;
    }
  }

  async copyKey(): Promise<void> {
    if (!this.newKey) return;
    try {
      await navigator.clipboard.writeText(this.newKey.key);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      // Clipboard blocked — the user can still select the text manually.
    }
  }

  dismissNewKey(): void {
    this.newKey = null;
    this.copied = false;
  }

  async revoke(key: ApiKey): Promise<void> {
    if (this.revokingId) return;
    if (!(await this.confirmDialog.confirm({ message: this.copy.revokeConfirm, danger: true }))) return;
    this.revokingId = key.id;
    this.revokeError = null;
    const revokedAt = new Date().toISOString();
    const prev = this.keys;
    // Optimistic: flip to revoked, roll back on failure.
    this.keys = this.keys.map((k) => (k.id === key.id ? { ...k, revokedAt } : k));
    try {
      await this.apiKeyService.revoke(key.id);
    } catch {
      this.keys = prev;
      this.revokeError = this.copy.revokeError;
    } finally {
      this.revokingId = null;
    }
  }

  goBack(): void {
    this.location.back();
  }
}
