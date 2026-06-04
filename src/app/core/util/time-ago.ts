import { LanguageCode } from '../../i18n/language.model';

type TimeAgoStrings = {
  justNow: string;
  minute: (n: number) => string;
  hour: (n: number) => string;
  day: (n: number) => string;
};

const TIME_STRINGS: Record<LanguageCode, TimeAgoStrings> = {
  en: {
    justNow: 'just now',
    minute: (n) => `${n}m ago`,
    hour: (n) => `${n}h ago`,
    day: (n) => `${n}d ago`,
  },
  ar: {
    justNow: 'الآن',
    minute: (n) => `قبل ${n} د`,
    hour: (n) => `قبل ${n} س`,
    day: (n) => `قبل ${n} ي`,
  },
  fr: {
    justNow: "à l'instant",
    minute: (n) => `il y a ${n} min`,
    hour: (n) => `il y a ${n} h`,
    day: (n) => `il y a ${n} j`,
  },
};

export function timeAgo(iso: string | null | undefined, lang: LanguageCode = 'en'): string {
  if (!iso) return '';
  const ts = new Date(normalizeTimestamp(iso)).getTime();
  if (Number.isNaN(ts)) return '';
  const strings = TIME_STRINGS[lang] ?? TIME_STRINGS.en;
  const diff = Date.now() - ts;
  if (diff < 0) return strings.justNow;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return strings.justNow;
  if (m < 60) return strings.minute(m);
  const h = Math.floor(m / 60);
  if (h < 24) return strings.hour(h);
  return strings.day(Math.floor(h / 24));
}

/**
 * Postgres `timestamp without time zone` columns are returned by PostgREST with
 * no zone designator (e.g. "2026-06-04T12:00:00"). `new Date()` parses those in
 * the browser's LOCAL zone, so a freshly-created row reads as hours in the past
 * for any user not on UTC (e.g. UTC+3 → "3h ago" immediately). The stored
 * wall-clock is actually UTC, so append "Z" when no zone is present. Values that
 * already carry a zone (timestamptz → "...+00:00"/"...Z") are left untouched.
 */
function normalizeTimestamp(iso: string): string {
  const trimmed = iso.trim();
  const hasZone = /(?:[zZ]|[+-]\d{2}(?::?\d{2})?)$/.test(trimmed);
  if (hasZone) return trimmed;
  return trimmed.replace(' ', 'T') + 'Z';
}
