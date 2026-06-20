import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { SupabaseService } from '../../core/services/supabase.service';
import { TopNavComponent } from '../home/components/top-nav.component';
import { TranslationService } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type StatsScope = 'personal' | 'friends' | 'community';
type StatsStatus = 'all' | 'read' | 'currently_reading' | 'want_to_read';
type DateRange = 'lifetime' | '7d' | '30d' | '1y' | 'custom';

interface AnalyticsBucket {
  key: string;
  label: string;
  count: number;
}

interface AnalyticsTopBook {
  rank: number;
  title: string;
  author: string;
  coverUrl: string | null;
  googleBooksId: string | null;
  count: number;
}

interface AnalyticsTopReader {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  booksRead: number;
}

interface AnalyticsTrendingGenre {
  name: string;
  count: number;
  percentage: number;
}

interface CommunitySummary {
  posts: number;
  comments: number;
  reactions: number;
  reviews: number;
}

interface RankedBookMetric {
  rank: number;
  title: string;
  author: string;
  googleBooksId: string | null;
  value: number;
  secondaryValue?: number;
}

interface CommunityContributor {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  contributions: number;
}

interface AnalyticsCsvRow {
  reader: string;
  title: string;
  author: string;
  status: string;
  rating: number | null;
  hasReview: boolean;
  addedAt: string;
  completedAt: string | null;
  activityAt: string;
}

interface AnalyticsDashboard {
  filters: {
    from: string | null;
    to: string | null;
    scope: StatsScope;
    status: StatsStatus;
  };
  generatedAt: string;
  refreshAfterSeconds: number;
  summary: {
    booksTracked: number;
    booksCompleted: number;
    averageRating: number | null;
    reviewsWritten: number;
  };
  completionTimeline: AnalyticsBucket[];
  statusDistribution: AnalyticsBucket[];
  ratingDistribution: AnalyticsBucket[];
  topBooks: AnalyticsTopBook[];
  topReaders: AnalyticsTopReader[];
  trendingGenres: AnalyticsTrendingGenre[];
  communitySummary: CommunitySummary;
  mostDiscussedBooks: RankedBookMetric[];
  mostReviewedBooks: RankedBookMetric[];
  highestRatedBooks: RankedBookMetric[];
  sentimentDistribution: AnalyticsBucket[];
  topContributors: CommunityContributor[];
  rows: AnalyticsCsvRow[];
}

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TopNavComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './stats-page.component.html',
  styleUrl: './stats-page.component.scss',
})
export class StatsPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly supabaseService = inject(SupabaseService);
  private readonly translationService = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('dashboardBoard') dashboardBoard?: ElementRef<HTMLElement>;
  @ViewChild('timelineCanvas') timelineCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusCanvas') statusCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ratingCanvas') ratingCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('topBooksCanvas') topBooksCanvas?: ElementRef<HTMLCanvasElement>;

  readonly scopeOptions: Array<{ value: StatsScope; label: string }> = [
    { value: 'personal', label: 'My data' },
    { value: 'friends', label: 'Friends' },
    { value: 'community', label: 'All data' },
  ];
  readonly statusOptions: Array<{ value: StatsStatus; label: string }> = [
    { value: 'all', label: 'All statuses' },
    { value: 'read', label: 'Read' },
    { value: 'currently_reading', label: 'Currently reading' },
    { value: 'want_to_read', label: 'Want to read' },
  ];

  from = '';
  to = '';
  dateRange: DateRange = 'lifetime';
  scope: StatsScope = 'personal';
  status: StatsStatus = 'all';
  dashboard: AnalyticsDashboard | null = null;
  isLoading = true;
  isExportingPdf = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  private viewReady = false;
  private refreshTimer?: ReturnType<typeof setInterval>;
  private filterTimer?: ReturnType<typeof setTimeout>;
  private charts: Chart[] = [];

  get currentScopeLabel(): string {
    return this.scopeOptions.find((option) => option.value === this.scope)?.label ?? 'My data';
  }

  get currentDateLabel(): string {
    if (this.dateRange === 'lifetime') return 'All time';
    if (this.dateRange === '7d') return 'Last 7 days';
    if (this.dateRange === '30d') return 'Last 30 days';
    if (this.dateRange === '1y') return 'Last year';
    return this.from && this.to ? `${this.from} → ${this.to}` : 'Custom dates';
  }

  constructor() {
    this.translationService
      .getCurrentLanguage$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.renderChartsSoon());
  }

  ngOnInit(): void {
    void this.loadDashboard();
    this.refreshTimer = setInterval(() => void this.loadDashboard(true), 60_000);
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChartsSoon();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.filterTimer) clearTimeout(this.filterTimer);
    this.destroyCharts();
  }

  onDateRangeChange(range: DateRange): void {
    this.dateRange = range;
    if (range === 'custom') {
      if (!this.from || !this.to) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        this.from = formatDateInput(start);
        this.to = formatDateInput(end);
      }
      this.scheduleFilterRefresh();
      return;
    }
    if (range === 'lifetime') {
      this.from = '';
      this.to = '';
      this.scheduleFilterRefresh();
      return;
    }
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 365;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    this.from = formatDateInput(start);
    this.to = formatDateInput(end);
    this.scheduleFilterRefresh();
  }

  onFilterChange(): void {
    this.scheduleFilterRefresh();
  }

  onCustomDateChange(): void {
    if (this.dateRange === 'custom' && this.from && this.to) {
      this.scheduleFilterRefresh();
    }
  }

  resetFilters(): void {
    this.dateRange = 'lifetime';
    this.from = '';
    this.to = '';
    this.scope = 'personal';
    this.status = 'all';
    this.scheduleFilterRefresh();
  }

  async refresh(): Promise<void> {
    await this.loadDashboard(true);
  }

  exportCsv(): void {
    if (!this.dashboard) return;
    const headers = [
      'Reader',
      'Book',
      'Author',
      'Status',
      'Rating',
      'Has review',
      'Added at',
      'Completed at',
      'Activity at',
    ];
    const records = this.dashboard.rows.map((row) => [
      row.reader,
      row.title,
      row.author,
      humanizeStatus(row.status),
      row.rating ?? '',
      row.hasReview ? 'Yes' : 'No',
      row.addedAt,
      row.completedAt ?? '',
      row.activityAt,
    ]);
    const csv = [headers, ...records]
      .map((record) => record.map(csvCell).join(','))
      .join('\r\n');
    downloadBlob(
      new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }),
      `readtrack-analytics-${this.exportRangeName()}.csv`,
    );
  }

  async exportPdf(): Promise<void> {
    if (!this.dashboardBoard || this.isExportingPdf) return;
    this.isExportingPdf = true;
    this.error = null;
    try {
      const canvas = await html2canvas(this.dashboardBoard.nativeElement, {
        backgroundColor: '#f8f6f2',
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        logging: false,
        onclone: (documentClone) => {
          documentClone
            .querySelectorAll<HTMLElement>('[data-export-hide]')
            .forEach((element) => (element.style.display = 'none'));
        },
      });
      const image = canvas.toDataURL('image/jpeg', 0.94);
      const pdfWidth = 1200;
      const pdfHeight = Math.round((canvas.height / canvas.width) * pdfWidth);
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'pt',
        format: [pdfWidth, pdfHeight],
        compress: true,
      });
      pdf.addImage(image, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`readtrack-dashboard-${this.exportRangeName()}.pdf`);
    } catch {
      this.error = 'The dashboard snapshot could not be exported.';
    } finally {
      this.isExportingPdf = false;
    }
  }

  toggleStatusSegment(index: number): void {
    const chart = this.charts.find((item) => item.canvas === this.statusCanvas?.nativeElement);
    if (!chart) return;
    chart.toggleDataVisibility(index);
    chart.update();
  }

  trackByKey(_: number, item: AnalyticsBucket): string {
    return item.key;
  }

  avatarFallback(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E9783F&color=fff&size=80`;
  }

  private scheduleFilterRefresh(): void {
    if (this.filterTimer) clearTimeout(this.filterTimer);
    this.filterTimer = setTimeout(() => void this.loadDashboard(), 250);
  }

  private async loadDashboard(silent = false): Promise<void> {
    if (this.dateRange === 'custom' && this.from > this.to) {
      this.error = 'The start date must be before the end date.';
      return;
    }
    if (!silent) this.isLoading = true;
    this.error = null;
    try {
      const session = await this.supabaseService.getCurrentSession();
      if (!session?.access_token) {
        this.error = 'Not authenticated.';
        return;
      }
      const params = new URLSearchParams({ scope: this.scope, status: this.status });
      if (this.from) params.set('from', this.from);
      if (this.to) params.set('to', this.to);
      const response = await fetch(`/api/stats/dashboard?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Failed to load analytics.');
      }
      this.dashboard = (await response.json()) as AnalyticsDashboard;
      this.lastUpdated = new Date(this.dashboard.generatedAt);
      this.renderChartsSoon();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load analytics.';
    } finally {
      this.isLoading = false;
    }
  }

  private renderChartsSoon(): void {
    if (!this.viewReady || !this.dashboard) return;
    setTimeout(() => this.renderCharts());
  }

  private renderCharts(): void {
    if (
      !this.dashboard ||
      !this.timelineCanvas ||
      !this.statusCanvas ||
      !this.ratingCanvas
    ) {
      return;
    }
    this.destroyCharts();
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1f2937',
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
        },
      },
    } satisfies ChartConfiguration['options'];

    this.charts.push(
      new Chart(this.timelineCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: this.dashboard.completionTimeline.map((bucket) => bucket.label),
          datasets: [
            {
              label: 'Books completed',
              data: this.dashboard.completionTimeline.map((bucket) => bucket.count),
              borderColor: '#e9783f',
              backgroundColor: 'rgba(233, 120, 63, 0.18)',
              fill: true,
              tension: 0.32,
              pointRadius: 3,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          ...commonOptions,
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
            x: { grid: { display: false } },
          },
        },
      }),
      new Chart(this.statusCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: this.dashboard.statusDistribution.map((bucket) => bucket.label),
          datasets: [
            {
              data: this.dashboard.statusDistribution.map((bucket) => bucket.count),
              backgroundColor: ['#e9783f', '#4f8a8b', '#d8a657', '#8b7aa8'],
              borderWidth: 0,
              hoverOffset: 8,
            },
          ],
        },
        options: {
          ...commonOptions,
          cutout: '66%',
        },
      }),
      new Chart(this.ratingCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: this.dashboard.ratingDistribution.map((bucket) => bucket.key),
          datasets: [
            {
              label: 'Ratings',
              data: this.dashboard.ratingDistribution.map((bucket) => bucket.count),
              backgroundColor: '#d8a657',
              borderRadius: 8,
            },
          ],
        },
        options: {
          ...commonOptions,
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
            x: { grid: { display: false }, title: { display: true, text: 'Stars' } },
          },
        },
      }),
    );

    if (this.topBooksCanvas && this.dashboard.topBooks.length) {
      this.charts.push(new Chart(this.topBooksCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: this.dashboard.topBooks.map((book) => shorten(book.title, 24)),
          datasets: [
            {
              label: 'Shelf entries',
              data: this.dashboard.topBooks.map((book) => book.count),
              backgroundColor: '#4f8a8b',
              borderRadius: 7,
            },
          ],
        },
        options: {
          ...commonOptions,
          indexAxis: 'y',
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0 } },
            y: { grid: { display: false } },
          },
        },
      }));
    }
  }

  private destroyCharts(): void {
    for (const chart of this.charts) chart.destroy();
    this.charts = [];
  }

  private exportRangeName(): string {
    return this.dateRange === 'lifetime'
      ? 'all-time'
      : `${this.from || 'start'}-to-${this.to || 'today'}`;
  }
}

function formatDateInput(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function humanizeStatus(status: string): string {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function shorten(value: string, maximum: number): string {
  return value.length > maximum ? `${value.slice(0, maximum - 1)}…` : value;
}
