import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

// Guards the login / signup pages: an already-authenticated user who hits '/'
// or '/signup' (e.g. via the browser back button) is sent to /home instead of
// seeing the login form again.
export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  // Don't intercept an OAuth/recovery hash that can legitimately land on '/'
  // (the AuthPageComponent forwards recovery links to /reset-password).
  if (typeof window !== 'undefined') {
    const hash = window.location.hash ?? '';
    if (hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('error')) {
      return true;
    }
  }

  try {
    const session = await supabaseService.getCurrentSession();
    if (session) return router.createUrlTree(['/home']);
  } catch {
    // session check failed — fall through and show the auth page
  }

  return true;
};
