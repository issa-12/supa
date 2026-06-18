import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService, PRIVACY_COPY, LanguageCode } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [],
  template: `
    <main class="static-page" [attr.dir]="lang === 'ar' ? 'rtl' : 'ltr'">
      <div class="static-card">
        <button type="button" class="back-link" (click)="goBack()">{{ copy.backLink }}</button>
        <h1>{{ copy.title }}</h1>
        <p class="updated">{{ copy.lastUpdated }}</p>

        @for (section of copy.sections; track section.heading) {
          <section>
            <h2>{{ section.heading }}</h2>
            <p>{{ section.body }}</p>
          </section>
        }
      </div>
    </main>
  `,
  styles: [`
    .static-page {
      min-height: 100dvh;
      background: #f4ede5;
      padding: 40px 24px;
      display: flex;
      justify-content: center;
    }
    .static-card {
      max-width: 720px;
      width: 100%;
      background: var(--surface);
      border-radius: 24px;
      padding: 48px;
      height: fit-content;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 24px;
      color: var(--primary);
      background: none;
      border: none;
      cursor: pointer;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      font-family: inherit;
      padding: 0;
      &:hover { text-decoration: underline; }
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0 0 8px;
    }
    .updated {
      font-size: 13px;
      color: var(--muted-foreground);
      margin: 0 0 32px;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: var(--foreground);
      margin: 28px 0 8px;
    }
    p {
      font-size: 15px;
      line-height: 1.7;
      color: var(--muted-foreground);
      margin: 0;
    }
    section { border-top: 1px solid var(--border); padding-top: 4px; }
  `],
})
export class PrivacyPolicyComponent {
  private readonly translationService = inject(TranslationService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return PRIVACY_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  // Return to wherever the user came from (e.g. their profile) instead of the
  // login page. Falls back to /profile if there's no in-app history.
  goBack(): void {
    if (window.history.length > 1) this.location.back();
    else void this.router.navigate(['/profile']);
  }
}
