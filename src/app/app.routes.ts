import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { genreOnboardingGuard } from './core/guards/genre-onboarding.guard';
import { AuthCallbackComponent } from './features/auth-callback/auth-callback.component';
import { AuthPageComponent } from './features/auth/auth-page.component';
import { EmailVerificationComponent } from './features/email-verification/email-verification.component';

export const routes: Routes = [
  // ── Public auth routes ────────────────────────────────────────
  {
    path: '',
    component: AuthPageComponent,
    canActivate: [guestGuard],
    data: { mode: 'login' },
  },
  {
    path: 'signup',
    component: AuthPageComponent,
    canActivate: [guestGuard],
    data: { mode: 'signup' },
  },
  {
    path: 'auth/callback',
    component: AuthCallbackComponent,
  },
  {
    path: 'verify-email',
    component: EmailVerificationComponent,
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },

  // ── Onboarding (auth required, not guarded by genre check) ────
  {
    path: 'onboarding/genres',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/genre-onboarding.component').then(
        (m) => m.GenreOnboardingComponent,
      ),
  },

  // ── Protected app routes (auth + onboarding required) ─────────
  {
    path: 'home',
    canActivate: [authGuard, genreOnboardingGuard],
    loadComponent: () =>
      import('./features/home/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard, genreOnboardingGuard],
    loadComponent: () =>
      import('./features/profile/profile-page.component').then(
        (m) => m.ProfilePageComponent,
      ),
  },
  {
    path: 'profile/:id',
    canActivate: [authGuard, genreOnboardingGuard],
    loadComponent: () =>
      import('./features/profile/profile-page.component').then(
        (m) => m.ProfilePageComponent,
      ),
  },

  // ── Book features (auth + onboarding required) ────────────────
  {
    path: 'books/search',
    canActivate: [authGuard, genreOnboardingGuard],
    loadComponent: () =>
      import('./features/books/book-search.component').then(
        (m) => m.BookSearchComponent,
      ),
  },
  {
    path: 'books/:googleId',
    canActivate: [authGuard, genreOnboardingGuard],
    loadComponent: () =>
      import('./features/books/book-detail.component').then(
        (m) => m.BookDetailComponent,
      ),
  },
  {
    path: 'shelf',
    canActivate: [authGuard, genreOnboardingGuard],
    loadComponent: () =>
      import('./features/shelf/shelf.component').then(
        (m) => m.ShelfComponent,
      ),
  },
  {
    path: 'stats',
    canActivate: [authGuard, genreOnboardingGuard],
    loadComponent: () =>
      import('./features/stats/stats-page.component').then(
        (m) => m.StatsPageComponent,
      ),
  },
  {
    path: 'community',
    canActivate: [authGuard, genreOnboardingGuard],
    loadComponent: () =>
      import('./features/community/community-page.component').then(
        (m) => m.CommunityPageComponent,
      ),
  },

  // ── Static pages (no auth required) ──────────────────────────
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/static/privacy-policy.component').then(
        (m) => m.PrivacyPolicyComponent,
      ),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/static/terms-of-service.component').then(
        (m) => m.TermsOfServiceComponent,
      ),
  },

  // ── Fallback ──────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '',
  },
];
