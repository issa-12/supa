import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  joinDate: string;
  username: string | null;
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

        const { data: readBooks, error: readError } = await supabase
          .from('user_books')
          .select('user_book_id')
          .eq('user_id', userId)
          .eq('status_id', 2)
          .gte('read_at', `${currentYear}-01-01`)
          .lte('read_at', `${currentYear}-12-31`);

        if (readError) throw readError;

        const { data: goal, error: goalError } = await supabase
          .from('reading_goals')
          .select('target_books')
          .eq('user_id', userId)
          .eq('year', currentYear)
          .maybeSingle();

        if (goalError) throw goalError;

        return {
          booksReadThisYear: readBooks?.length || 0,
          booksGoal: goal?.target_books || 50,
          currentYear,
        };
      })
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
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('users')
          .select('*')
          .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
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
      name: raw.name || 'Unknown User',
      bio: raw.about_me || null,
      avatarUrl: raw.profile_picture_url || null,
      joinDate: raw.created_at
        ? new Date(raw.created_at).getFullYear().toString()
        : new Date().getFullYear().toString(),
      username: raw.username || null,
    };
  }
}
