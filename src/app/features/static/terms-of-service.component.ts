import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="static-page">
      <div class="static-card">
        <a routerLink="/" class="back-link">← Back to ReadTrack</a>
        <h1>Terms of Service</h1>
        <p class="updated">Last updated: May 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By creating a ReadTrack account you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
        </section>

        <section>
          <h2>2. User Conduct</h2>
          <p>You agree not to post content that is hateful, abusive, or violates the rights of others. Community posts are subject to AI moderation. Repeated violations may result in account suspension.</p>
        </section>

        <section>
          <h2>3. Content Ownership</h2>
          <p>You retain ownership of content you post. By posting, you grant ReadTrack a non-exclusive licence to display that content on the platform.</p>
        </section>

        <section>
          <h2>4. Book Data</h2>
          <p>Book metadata (titles, authors, descriptions, covers) is sourced from the Google Books API and is subject to Google's terms. ReadTrack does not claim ownership of this data.</p>
        </section>

        <section>
          <h2>5. Account Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from your profile settings.</p>
        </section>

        <section>
          <h2>6. Disclaimer</h2>
          <p>ReadTrack is provided "as is" without warranty. We are not liable for any damages arising from use of the platform.</p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>For terms-related questions, contact us at legal&#64;readtrack.app.</p>
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
export class TermsOfServiceComponent {}
