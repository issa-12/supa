import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

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
      background: rgb(255 250 245 / 90%);
      border-radius: 20px;
      box-shadow: 0 28px 60px rgb(46 36 29 / 18%);
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

  protected title = 'Finishing sign in';
  protected message = 'Connecting your ReadTrack profile...';

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

      this.title = 'Account connected';
      this.message = 'Your ReadTrack profile is ready.';

      window.setTimeout(() => {
        void this.router.navigateByUrl('/');
      }, 900);
    } catch (error) {
      this.title = 'Sign in needs attention';
      this.message = error instanceof Error
        ? error.message
        : 'We could not finish connecting your account.';
    }
  }
}
