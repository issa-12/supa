import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  try {
    const session = await supabaseService.getCurrentSession();
    if (session) return true;
  } catch {
    // session check failed — treat as unauthenticated
  }

  return router.createUrlTree(['/']);
};
