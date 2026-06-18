import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

// Guards the onboarding page itself: a user who has already picked genres should
// never land back on /onboarding/genres (e.g. via the browser back button) — send
// them to /home instead. Unauthenticated users go to login.
export const onboardingRedirectGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  try {
    const supabase = await supabaseService.getClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.createUrlTree(['/']);

    const { data: genres } = await supabase
      .from('user_genres')
      .select('genre_id')
      .eq('user_id', user.id)
      .limit(1);

    if (genres && genres.length > 0) return router.createUrlTree(['/home']);
  } catch {
    // On error, let them proceed to onboarding rather than trap them.
    return true;
  }

  return true;
};
