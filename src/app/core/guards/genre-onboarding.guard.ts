import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const genreOnboardingGuard: CanActivateFn = async () => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

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

    if (genres && genres.length > 0) return true;
  } catch {
    // If the check fails, don't block the user
    return true;
  }

  return router.createUrlTree(['/onboarding/genres']);
};
