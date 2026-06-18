import { Pipe, PipeTransform } from '@angular/core';
import { LanguageCode } from './language.model';

// The 20 seeded genres (public.genres) are stored in English. We translate them
// at display time, keyed by the canonical English name, rather than duplicating
// translated columns in the DB. Names not in this map (Google Books categories,
// AI-suggested genres) fall back to the original string.
const GENRE_TRANSLATIONS: Record<string, { ar: string; fr: string }> = {
  'Fiction': { ar: 'خيال', fr: 'Fiction' },
  'Non-Fiction': { ar: 'غير خيالي', fr: 'Non-fiction' },
  'Mystery & Thriller': { ar: 'غموض وإثارة', fr: 'Mystère et thriller' },
  'Science Fiction': { ar: 'خيال علمي', fr: 'Science-fiction' },
  'Fantasy': { ar: 'فانتازيا', fr: 'Fantastique' },
  'Romance': { ar: 'رومانسية', fr: 'Romance' },
  'Historical Fiction': { ar: 'خيال تاريخي', fr: 'Fiction historique' },
  'Biography': { ar: 'سيرة ذاتية', fr: 'Biographie' },
  'Self-Help': { ar: 'تطوير الذات', fr: 'Développement personnel' },
  'Horror': { ar: 'رعب', fr: 'Horreur' },
  'Literary Fiction': { ar: 'أدب أدبي', fr: 'Fiction littéraire' },
  'Graphic Novel': { ar: 'رواية مصورة', fr: 'Roman graphique' },
  'Young Adult': { ar: 'يافعون', fr: 'Jeunes adultes' },
  'Children': { ar: 'أطفال', fr: 'Enfants' },
  'Psychology': { ar: 'علم النفس', fr: 'Psychologie' },
  'Philosophy': { ar: 'فلسفة', fr: 'Philosophie' },
  'Science': { ar: 'علوم', fr: 'Science' },
  'Travel': { ar: 'سفر', fr: 'Voyage' },
  'Poetry': { ar: 'شعر', fr: 'Poésie' },
  'Art & Photography': { ar: 'فن وتصوير', fr: 'Art et photographie' },
};

export function translateGenre(name: string | null | undefined, lang: LanguageCode): string {
  if (!name) return '';
  if (lang === 'en') return name;
  return GENRE_TRANSLATIONS[name]?.[lang] ?? name;
}

// Pure pipe — re-runs only when the name or `lang` arg changes, so it updates
// live on a language switch (the component's `lang` is updated reactively).
@Pipe({ name: 'genreName', standalone: true })
export class GenreNamePipe implements PipeTransform {
  transform(name: string | null | undefined, lang: LanguageCode): string {
    return translateGenre(name, lang);
  }
}
