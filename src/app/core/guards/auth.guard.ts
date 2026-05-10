import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  // During SSR there is no browser storage — let it pass and
  // the browser-side re-render will perform the real check.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const supabaseService = inject(SupabaseService);

  try {
    const session = await supabaseService.getCurrentSession();
    if (session) return true;
  } catch {
    // session check failed — treat as unauthenticated
  }

  return router.createUrlTree(['/']);
};
