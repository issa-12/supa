import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { TranslationService, AUTH_COPY_BY_LANGUAGE } from '../../i18n';

@Component({
  selector: 'app-auth-callback',
  template: `
    <main class="auth-callback" aria-live="polite">
      <section>
        <h1>{{ title }}</h1>
        <p>{{ message }}</p>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
      font-family: "PT Serif", Georgia, "Times New Roman", serif;
    }

    .auth-callback {
      align-items: center;
      background: #f4ede5;
      color: #2e241d;
      display: flex;
      justify-content: center;
      min-height: 100dvh;
      padding: 24px;
      text-align: center;
    }

    section {
      background: var(--surface);
      border-radius: 20px;
       max-width: 520px;
      padding: 40px;
      width: 100%;
    }

    h1 {
      font-size: 30px;
      font-weight: 600;
      margin: 0 0 12px;
    }

    p {
      color: #7d6d60;
      line-height: 1.6;
      margin: 0;
    }
  `,
})
export class AuthCallbackComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);
  private readonly translationService = inject(TranslationService);

  private readonly copy = AUTH_COPY_BY_LANGUAGE[this.translationService.getCurrentLanguage()];

  protected title = this.copy.callbackFinishing;
  protected message = this.copy.callbackConnecting;

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        const { error } = await this.supabaseService.exchangeAuthCodeForSession(code);

        if (error) {
          throw error;
        }
      } else {
        await this.supabaseService.syncCurrentUser();
      }

      this.title = this.copy.callbackConnected;
      this.message = this.copy.callbackReady;

      window.setTimeout(() => {
        void this.router.navigateByUrl('/home');
      }, 900);
    } catch {
      this.title = this.copy.callbackErrorTitle;
      this.message = this.copy.callbackErrorMsg;
    }
  }
}
