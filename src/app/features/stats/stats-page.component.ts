import { Component, OnInit, OnDestroy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { TopNavComponent } from '../home/components/top-nav.component';

interface TopBook {
  rank: number;
  title: string;
  author: string;
  coverUrl: string | null;
  addCount: number;
}

interface TrendingGenre {
  name: string;
  count: number;
  percentage: number;
}

interface TopReader {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  booksRead: number;
}

interface MonthlyPace {
  month: string;
  count: number;
}

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNavComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './stats-page.component.html',
  styleUrl: './stats-page.component.scss',
})
export class StatsPageComponent implements OnInit, OnDestroy {
  private readonly supabaseService = inject(SupabaseService);
  private readonly destroy$ = new Subject<void>();

  period: 'week' | 'month' = 'week';
  isLoadingGlobal = true;
  isLoadingPace = true;
  currentYear = new Date().getFullYear();

  topBooks: TopBook[] = [];
  trendingGenres: TrendingGenre[] = [];
  topReaders: TopReader[] = [];
  readingPace: MonthlyPace[] = [];

  readonly skeletonRows = [1, 2, 3, 4, 5];

  get totalBooksRead(): number {
    return this.readingPace.reduce((sum, m) => sum + m.count, 0);
  }

  ngOnInit(): void {
    void Promise.all([this.loadGlobalStats(), this.loadPace()]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setPeriod(p: 'week' | 'month'): void {
    if (this.period === p) return;
    this.period = p;
    void this.loadGlobalStats();
  }

  getBarHeight(count: number): number {
    const max = Math.max(...this.readingPace.map((m) => m.count), 1);
    return Math.round((count / max) * 100);
  }

  avatarFallback(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E9783F&color=fff&size=44`;
  }

  private async getToken(): Promise<string | null> {
    const session = await this.supabaseService.getCurrentSession();
    return session?.access_token ?? null;
  }

  private async loadGlobalStats(): Promise<void> {
    this.isLoadingGlobal = true;
    try {
      const token = await this.getToken();
      if (!token) return;
      const res = await fetch(`/api/stats/global?period=${this.period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        topBooks: TopBook[];
        trendingGenres: TrendingGenre[];
        topReaders: TopReader[];
      };
      this.topBooks = data.topBooks;
      this.trendingGenres = data.trendingGenres;
      this.topReaders = data.topReaders;
    } catch {
      // leave empty — user sees empty states
    } finally {
      this.isLoadingGlobal = false;
    }
  }

  private async loadPace(): Promise<void> {
    this.isLoadingPace = true;
    try {
      const token = await this.getToken();
      if (!token) return;
      const res = await fetch('/api/stats/pace', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { pace: MonthlyPace[] };
      this.readingPace = data.pace;
    } catch {
      // leave empty
    } finally {
      this.isLoadingPace = false;
    }
  }
}
