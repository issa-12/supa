import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { genreOnboardingGuard } from './core/guards/genre-onboarding.guard';
import { AuthCallbackComponent } from './features/auth-callback/auth-callback.component';
import { AuthPageComponent } from './features/auth/auth-page.component';
import { EmailVerificationComponent } from './features/email-verification/email-verification.component';
import { HomePageComponent } from './features/home/home-page.component';
import { ProfilePageComponent } from './features/profile/profile-page.component';

export const routes: Routes = [
  // ── Public auth routes ────────────────────────────────────────
  {
    path: '',
    component: AuthPageComponent,
    data: { mode: 'login' },
  },
  {
    path: 'signup',
    component: AuthPageComponent,
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
    component: HomePageComponent,
    canActivate: [authGuard, genreOnboardingGuard],
  },
  {
    path: 'profile',
    component: ProfilePageComponent,
    canActivate: [authGuard, genreOnboardingGuard],
  },
  {
    path: 'profile/:id',
    component: ProfilePageComponent,
    canActivate: [authGuard, genreOnboardingGuard],
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
