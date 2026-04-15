import { Routes } from '@angular/router';
import { AuthCallbackComponent } from './features/auth-callback/auth-callback.component';
import { AuthPageComponent } from './features/auth/auth-page.component';
import { EmailVerificationComponent } from './features/email-verification/email-verification.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthPageComponent,
    data: {
      mode: 'login',
    },
  },
  {
    path: 'signup',
    component: AuthPageComponent,
    data: {
      mode: 'signup',
    },
  },
  {
    path: 'auth/callback',
    component: AuthCallbackComponent,
  },
  {
    path: 'verify-email',
    component: EmailVerificationComponent,
  },
];
