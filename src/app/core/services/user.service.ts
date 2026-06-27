import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { APP_COPY, TranslationService } from '../../i18n';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  joinDate: string;
  username: string | null;
  isPrivate: boolean;
}

export interface ReadingStats {
  booksReadThisYear: number;
  booksGoal: number;
  currentYear: number;
}

export interface UserGenre {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly translationService = inject(TranslationService);

  readonly currentUserAvatar$ = new BehaviorSubject<string | null>(null);

  setCurrentUserAvatar(url: string | null): void {
    this.currentUserAvatar$.next(url);
  }

  getCurrentUserProfile(): Observable<UserProfile> {
    return from(this.supabaseService.syncCurrentUser()).pipe(
      map((user) => {
        if (!user) {
          throw new Error('User not authenticated');
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          bio: null,
          avatarUrl: null,
          joinDate: new Date().getFullYear().toString(),
          username: null,
          isPrivate: false,
        };
      }),
      catchError((error) => throwError(() => error))
    );
  }

  getUserProfileById(userId: string): Observable<UserProfile> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data) throw new Error('User not found');
            return this.mapUserProfile(data);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getUserReadingStats(userId: string): Observable<ReadingStats> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        const currentYear = new Date().getFullYear();

        const { data: statusRow } = await supabase
          .from('reading_statuses')
          .select('status_id')
          .eq('status_name', 'read')
          .single();

        const readStatusId = statusRow?.['status_id'] as number | undefined;

        const [readRes, goalRes] = await Promise.all([
          readStatusId
            ? supabase
                .from('user_books')
                .select('user_book_id')
                .eq('user_id', userId)
                .eq('status_id', readStatusId)
                .gte('updated_at', `${currentYear}-01-01`)
            : Promise.resolve({ data: [], error: null }),
          supabase
            .from('reading_goals')
            .select('target_books')
            .eq('user_id', userId)
            .eq('year', currentYear)
            .maybeSingle(),
        ]);

        if (readRes.error) throw readRes.error;
        if (goalRes.error) throw goalRes.error;

        return {
          booksReadThisYear: readRes.data?.length ?? 0,
          booksGoal: (goalRes.data as { target_books?: number } | null)?.target_books ?? 20,
          currentYear,
        };
      })
    ).pipe(catchError((error) => throwError(() => error)));
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const supabase = await this.supabaseService.getClient();
    // Pick the extension from MIME type rather than filename so users
    // can't upload `evil.html` as `evil.html` into the public bucket.
    const allowed: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = allowed[file.type];
    if (!ext) throw new Error('Avatar must be PNG, JPG, WEBP, or GIF.');

    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  // Remove the user's custom avatar: best-effort delete the stored file(s),
  // then null the DB pointer so the UI falls back to the default (initials).
  async removeAvatar(userId: string): Promise<void> {
    const supabase = await this.supabaseService.getClient();
    // We don't track the stored extension, so target every candidate.
    const candidates = ['png', 'jpg', 'jpeg', 'webp', 'gif'].map((e) => `${userId}/avatar.${e}`);
    try {
      await supabase.storage.from('avatars').remove(candidates);
    } catch {
      // best-effort — clearing the DB pointer below is what matters
    }
    const { error } = await supabase
      .from('users')
      .update({ profile_picture_url: null, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  }

  setReadingGoal(userId: string, year: number, targetBooks: number): Observable<void> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('reading_goals')
          .upsert({ user_id: userId, year, target_books: targetBooks }, { onConflict: 'user_id,year' })
          .then(({ error }) => { if (error) throw error; }),
      ),
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getUserGenres(userId: string): Observable<UserGenre[]> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_genres')
          .select('*, genre:genres(genre_id, genre_name)')
          .eq('user_id', userId)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => ({
              id: item.genre?.genre_id || item.genre_id,
              name: item.genre?.genre_name || '',
            }));
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getAllGenres(): Observable<UserGenre[]> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('genres')
          .select('genre_id, genre_name')
          .order('genre_name')
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => ({
              id: item.genre_id,
              name: item.genre_name,
            }));
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  // Idempotent: upsert the desired pairs (ignoring duplicates) then delete any
  // pair not in the selection. Safe to retry, unlike delete-then-insert which
  // could leave a user with zero genres on partial failure.
  setUserGenres(userId: string, genreIds: number[]): Observable<void> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        const rows = genreIds.map((genre_id) => ({ user_id: userId, genre_id }));
        if (rows.length > 0) {
          const { error: upsertErr } = await supabase
            .from('user_genres')
            .upsert(rows, { onConflict: 'user_id,genre_id', ignoreDuplicates: true });
          if (upsertErr) throw upsertErr;
        }

        let deleteQuery = supabase.from('user_genres').delete().eq('user_id', userId);
        if (genreIds.length > 0) {
          deleteQuery = deleteQuery.not('genre_id', 'in', `(${genreIds.join(',')})`);
        }
        const { error: deleteErr } = await deleteQuery;
        if (deleteErr) throw deleteErr;
      })
    ).pipe(catchError((error) => throwError(() => error)));
  }

  updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Observable<UserProfile> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('users')
          .update({
            name: updates.name,
            about_me: updates.bio,
            profile_picture_url: updates.avatarUrl,
            username: updates.username,
            is_private: updates.isPrivate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select('*')
          .single()
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data) throw new Error('Failed to update profile');
            return this.mapUserProfile(data);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  searchUsers(query: string, limit: number = 10): Observable<UserProfile[]> {
    // PostgREST .or() parses commas/parens/dots in the filter string,
    // so we strip anything that could break the syntax before
    // interpolating user input. Wildcards % and _ are also stripped to
    // keep the pattern literal.
    const sanitized = query.replace(/[%_,().*]/g, '').trim();
    if (!sanitized) return from(Promise.resolve<UserProfile[]>([]));

    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('users')
          .select('*')
          // Only surface fully-onboarded accounts — hides abandoned/unverified
          // signups (the public.users row is created at signup-request time).
          .eq('verified', true)
          .or(`name.ilike.%${sanitized}%,username.ilike.%${sanitized}%`)
          .limit(limit)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => this.mapUserProfile(item));
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  private mapUserProfile(raw: any): UserProfile {
    return {
      id: raw.id,
      email: raw.email,
      name:
        raw.name ||
        APP_COPY[this.translationService.getCurrentLanguage()].unknownUser,
      bio: raw.about_me || null,
      avatarUrl: raw.profile_picture_url || null,
      joinDate: raw.created_at
        ? new Date(raw.created_at).getFullYear().toString()
        : new Date().getFullYear().toString(),
      username: raw.username || null,
      isPrivate: raw.is_private ?? false,
    };
  }
}
