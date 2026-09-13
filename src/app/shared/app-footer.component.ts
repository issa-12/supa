import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_COPY, TranslationService } from '../i18n';

// Mounted once at the app root (app.html), after <router-outlet>, so Privacy
// Policy / Terms of Service stay reachable from every route — including the
// pre-login screen, which previously had no link to either page.
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="app-footer">
      <span class="app-footer__rights">© {{ year }} ReadTrack — {{ copy.footerRights }}</span>
      <nav class="app-footer__links" aria-label="Legal">
        <a routerLink="/privacy">{{ copy.footerPrivacy }}</a>
        <span aria-hidden="true">·</span>
        <a routerLink="/terms">{{ copy.footerTerms }}</a>
      </nav>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .app-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 6px 16px;
      padding: 14px 20px;
      font-size: 12.5px;
      color: var(--muted-foreground);
      border-top: 1px solid var(--border);
      background: var(--background);
      text-align: center;
    }

    .app-footer__links {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .app-footer a {
      color: inherit;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  `],
})
export class AppFooterComponent {
  private readonly translationService = inject(TranslationService);

  protected readonly year = new Date().getFullYear();

  protected get copy() {
    return APP_COPY[this.translationService.getCurrentLanguage()];
  }
}
