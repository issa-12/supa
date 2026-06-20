import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  HostListener,
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
import type { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from '../../core/services/supabase.service';
import { TopNavComponent } from '../home/components/top-nav.component';
import { TranslationService } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type StatsScope = 'personal' | 'friends' | 'community';
type StatsStatus = 'all' | 'read' | 'currently_reading' | 'want_to_read';
type DateRange = 'lifetime' | '7d' | '30d' | 'custom';

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
  availableFrom: string | null;
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
  @ViewChild('downloadMenu') downloadMenu?: ElementRef<HTMLDetailsElement>;
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
  private previousDatePreset: Exclude<DateRange, 'custom'> = 'lifetime';
  scope: StatsScope = 'personal';
  status: StatsStatus = 'all';
  dashboard: AnalyticsDashboard | null = null;
  isLoading = true;
  isExportingPdf = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  realtimeStatus: 'connecting' | 'live' | 'offline' = 'connecting';
  private viewReady = false;
  private filterTimer?: ReturnType<typeof setTimeout>;
  private realtimeRefreshTimer?: ReturnType<typeof setTimeout>;
  private realtimeChannel?: RealtimeChannel;
  private charts: Chart[] = [];

  get currentScopeLabel(): string {
    return this.scopeOptions.find((option) => option.value === this.scope)?.label ?? 'My data';
  }

  get currentDateLabel(): string {
    if (this.dateRange === 'lifetime') {
      return this.dashboard?.availableFrom
        ? `All time · since ${formatDisplayDate(this.dashboard.availableFrom)}`
        : 'All time';
    }
    if (this.dateRange === '7d') return 'Last 7 days';
    if (this.dateRange === '30d') return 'Last 30 days';
    return this.from && this.to ? `${this.from} → ${this.to}` : 'Custom dates';
  }

  get overviewDescription(): string {
    const scopeLabel =
      this.scope === 'personal'
        ? 'your reading data'
        : this.scope === 'friends'
          ? 'your friends’ reading data'
          : 'all public reading data';
    return `Summary and visual trends for ${scopeLabel} during ${this.currentDateLabel.toLowerCase()}.`;
  }

  get showComparativeInsights(): boolean {
    return this.scope !== 'personal';
  }

  get minimumDate(): string {
    return this.dashboard?.availableFrom
      ? formatDateInput(new Date(this.dashboard.availableFrom))
      : formatDateInput(new Date());
  }

  get maximumDate(): string {
    return formatDateInput(new Date());
  }

  get minimumDateValue(): number {
    return dateInputToDayNumber(this.minimumDate);
  }

  get maximumDateValue(): number {
    return dateInputToDayNumber(this.maximumDate);
  }

  get fromDateValue(): number {
    return dateInputToDayNumber(this.from || this.minimumDate);
  }

  get toDateValue(): number {
    return dateInputToDayNumber(this.to || this.maximumDate);
  }

  get selectedRangePercent(): { left: number; width: number } {
    const span = Math.max(1, this.maximumDateValue - this.minimumDateValue);
    const left = ((this.fromDateValue - this.minimumDateValue) / span) * 100;
    const right = ((this.toDateValue - this.minimumDateValue) / span) * 100;
    return { left, width: Math.max(0, right - left) };
  }

  constructor() {
    this.translationService
      .getCurrentLanguage$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.renderChartsSoon());
  }

  ngOnInit(): void {
    void this.loadDashboard();
    void this.setupRealtime();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChartsSoon();
  }

  ngOnDestroy(): void {
    if (this.filterTimer) clearTimeout(this.filterTimer);
    if (this.realtimeRefreshTimer) clearTimeout(this.realtimeRefreshTimer);
    void this.teardownRealtime();
    this.destroyCharts();
  }

  @HostListener('document:click', ['$event'])
  closeDownloadMenuOnOutsideClick(event: MouseEvent): void {
    const menu = this.downloadMenu?.nativeElement;
    if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) {
      menu.open = false;
    }
  }

  onDateRangeChange(range: DateRange): void {
    this.dateRange = range;
    if (range === 'custom') {
      // Preserve the dates produced by the selected preset. Entering Custom
      // after "Last 7 days", for example, opens on that exact seven-day range.
      if (!this.from || !this.to) {
        this.from = this.minimumDate;
        this.to = this.maximumDate;
      }
      this.scheduleFilterRefresh();
      return;
    }
    this.previousDatePreset = range;
    if (range === 'lifetime') {
      this.from = '';
      this.to = '';
      this.scheduleFilterRefresh();
      return;
    }
    const days = range === '7d' ? 7 : 30;
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
      this.from = clampDateInput(this.from, this.minimumDate, this.to);
      this.to = clampDateInput(this.to, this.from, this.maximumDate);
      this.scheduleFilterRefresh();
    }
  }

  onFromSliderChange(value: string | number): void {
    const day = Math.min(Number(value), this.toDateValue);
    this.from = dayNumberToDateInput(day);
    this.scheduleFilterRefresh();
  }

  onToSliderChange(value: string | number): void {
    const day = Math.max(Number(value), this.fromDateValue);
    this.to = dayNumberToDateInput(day);
    this.scheduleFilterRefresh();
  }

  leaveCustomDates(): void {
    this.onDateRangeChange(this.previousDatePreset);
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
    if (!this.dashboard || this.scope !== 'personal') return;
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

  private async setupRealtime(): Promise<void> {
    const client = await this.supabaseService.getClient();
    const tables = [
      'user_books',
      'user_genres',
      'posts',
      'comments',
      'post_likes',
      'comment_likes',
      'review_likes',
      'friendship',
      'users',
    ] as const;

    let channel = client.channel(`stats-dashboard-${crypto.randomUUID()}`);
    for (const table of tables) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => this.scheduleRealtimeRefresh(),
      );
    }
    this.realtimeChannel = channel.subscribe((status) => {
      this.realtimeStatus =
        status === 'SUBSCRIBED'
          ? 'live'
          : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'
            ? 'offline'
            : 'connecting';
    });
  }

  private scheduleRealtimeRefresh(): void {
    if (this.realtimeRefreshTimer) clearTimeout(this.realtimeRefreshTimer);
    // One user action may update several related tables. Collapse that burst
    // into one aggregate request so every chart changes atomically.
    this.realtimeRefreshTimer = setTimeout(() => void this.loadDashboard(true), 600);
  }

  private async teardownRealtime(): Promise<void> {
    if (!this.realtimeChannel) return;
    const client = await this.supabaseService.getClient();
    await client.removeChannel(this.realtimeChannel);
    this.realtimeChannel = undefined;
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
      if (this.dateRange === 'custom') {
        this.from = clampDateInput(this.from || this.minimumDate, this.minimumDate, this.to || this.maximumDate);
        this.to = clampDateInput(this.to || this.maximumDate, this.from, this.maximumDate);
      }
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

function formatDisplayDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function dateInputToDayNumber(value: string): number {
  return Math.floor(new Date(`${value}T00:00:00Z`).getTime() / 86_400_000);
}

function dayNumberToDateInput(value: number): string {
  return new Date(value * 86_400_000).toISOString().slice(0, 10);
}

function clampDateInput(value: string, minimum: string, maximum: string): string {
  if (value < minimum) return minimum;
  if (value > maximum) return maximum;
  return value;
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
