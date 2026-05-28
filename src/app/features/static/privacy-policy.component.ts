import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="static-page">
      <div class="static-card">
        <a routerLink="/" class="back-link">← Back to ReadTrack</a>
        <h1>Privacy Policy</h1>
        <p class="updated">Last updated: May 2026</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide when creating an account (name, email address), content you post (book reviews, community posts), and usage data to improve the platform.</p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to operate ReadTrack, personalise your reading recommendations, and send you notifications about activity on your account.</p>
        </section>

        <section>
          <h2>3. Data Storage</h2>
          <p>Your data is stored securely on Supabase infrastructure. Profile pictures are stored in Supabase Storage. We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2>4. Cookies</h2>
          <p>We use session cookies to keep you logged in. No third-party advertising cookies are used.</p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>You may request deletion of your account and associated data at any time by contacting us. You can update your profile information from your profile settings page.</p>
        </section>

        <section>
          <h2>6. Contact</h2>
          <p>For privacy-related questions, contact us at privacy&#64;readtrack.app.</p>
        </section>
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
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
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
export class PrivacyPolicyComponent {}
