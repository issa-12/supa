import { Pipe, PipeTransform } from '@angular/core';
import { LanguageCode } from './language.model';

// The 20 seeded genres (public.genres) are stored in English. We translate them
// at display time, keyed by the canonical English name, rather than duplicating
// translated columns in the DB.
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

// Google Books returns BISAC subject paths, not our seeded genre names —
// "Fiction / Literary", "Biography & Autobiography / Personal Memoirs",
// "Juvenile Fiction / Fantasy & Magic". Those never matched the map above and
// rendered in English on Arabic/French pages, so each path segment is
// translated separately and re-joined. Covers the BISAC top-level subjects plus
// the sub-headings that actually show up on book pages.
const CATEGORY_TRANSLATIONS: Record<string, { ar: string; fr: string }> = {
  // Top-level BISAC subjects
  'Antiques & Collectibles': { ar: 'التحف والمقتنيات', fr: 'Antiquités et objets de collection' },
  'Architecture': { ar: 'العمارة', fr: 'Architecture' },
  'Art': { ar: 'فن', fr: 'Art' },
  'Bibles': { ar: 'الكتاب المقدس', fr: 'Bibles' },
  'Biography & Autobiography': { ar: 'السيرة الذاتية', fr: 'Biographie et autobiographie' },
  'Body, Mind & Spirit': { ar: 'الجسد والعقل والروح', fr: 'Corps, esprit et âme' },
  'Business & Economics': { ar: 'الأعمال والاقتصاد', fr: 'Affaires et économie' },
  'Comics & Graphic Novels': { ar: 'القصص المصورة', fr: 'Bandes dessinées et romans graphiques' },
  'Computers': { ar: 'الحاسوب', fr: 'Informatique' },
  'Cooking': { ar: 'الطبخ', fr: 'Cuisine' },
  'Crafts & Hobbies': { ar: 'الحرف والهوايات', fr: 'Loisirs créatifs' },
  'Design': { ar: 'التصميم', fr: 'Design' },
  'Drama': { ar: 'الدراما', fr: 'Théâtre' },
  'Education': { ar: 'التعليم', fr: 'Éducation' },
  'Family & Relationships': { ar: 'الأسرة والعلاقات', fr: 'Famille et relations' },
  'Foreign Language Study': { ar: 'تعلم اللغات', fr: 'Apprentissage des langues' },
  'Games & Activities': { ar: 'الألعاب والأنشطة', fr: 'Jeux et activités' },
  'Gardening': { ar: 'البستنة', fr: 'Jardinage' },
  'Health & Fitness': { ar: 'الصحة واللياقة', fr: 'Santé et forme' },
  'History': { ar: 'التاريخ', fr: 'Histoire' },
  'House & Home': { ar: 'المنزل', fr: 'Maison' },
  'Humor': { ar: 'الفكاهة', fr: 'Humour' },
  'Juvenile Fiction': { ar: 'خيال للأطفال', fr: 'Fiction jeunesse' },
  'Juvenile Nonfiction': { ar: 'كتب معرفية للأطفال', fr: 'Documentaires jeunesse' },
  'Language Arts & Disciplines': { ar: 'اللغة والأدب', fr: 'Langue et linguistique' },
  'Law': { ar: 'القانون', fr: 'Droit' },
  'Literary Collections': { ar: 'مختارات أدبية', fr: 'Anthologies littéraires' },
  'Literary Criticism': { ar: 'النقد الأدبي', fr: 'Critique littéraire' },
  'Mathematics': { ar: 'الرياضيات', fr: 'Mathématiques' },
  'Medical': { ar: 'الطب', fr: 'Médecine' },
  'Music': { ar: 'الموسيقى', fr: 'Musique' },
  'Nature': { ar: 'الطبيعة', fr: 'Nature' },
  'Performing Arts': { ar: 'الفنون الأدائية', fr: 'Arts du spectacle' },
  'Pets': { ar: 'الحيوانات الأليفة', fr: 'Animaux de compagnie' },
  'Photography': { ar: 'التصوير', fr: 'Photographie' },
  'Political Science': { ar: 'العلوم السياسية', fr: 'Sciences politiques' },
  'Reference': { ar: 'مراجع', fr: 'Ouvrages de référence' },
  'Religion': { ar: 'الدين', fr: 'Religion' },
  'Social Science': { ar: 'العلوم الاجتماعية', fr: 'Sciences sociales' },
  'Sports & Recreation': { ar: 'الرياضة والترفيه', fr: 'Sports et loisirs' },
  'Study Aids': { ar: 'أدلة الدراسة', fr: 'Aides à l’étude' },
  'Technology & Engineering': { ar: 'التكنولوجيا والهندسة', fr: 'Technologie et ingénierie' },
  'Transportation': { ar: 'النقل', fr: 'Transports' },
  'True Crime': { ar: 'جرائم حقيقية', fr: 'Faits divers criminels' },
  'Young Adult Fiction': { ar: 'خيال لليافعين', fr: 'Fiction jeunes adultes' },
  'Young Adult Nonfiction': { ar: 'كتب معرفية لليافعين', fr: 'Documentaires jeunes adultes' },

  // Common sub-headings
  'General': { ar: 'عام', fr: 'Général' },
  'Literary': { ar: 'أدبي', fr: 'Littéraire' },
  'Classics': { ar: 'كلاسيكيات', fr: 'Classiques' },
  'Thrillers': { ar: 'إثارة', fr: 'Thrillers' },
  'Suspense': { ar: 'تشويق', fr: 'Suspense' },
  'Mystery & Detective': { ar: 'غموض وتحقيق', fr: 'Policier' },
  'Crime': { ar: 'جريمة', fr: 'Crime' },
  'Espionage': { ar: 'تجسس', fr: 'Espionnage' },
  'Action & Adventure': { ar: 'أكشن ومغامرة', fr: 'Action et aventure' },
  'Adventure': { ar: 'مغامرة', fr: 'Aventure' },
  'Historical': { ar: 'تاريخي', fr: 'Historique' },
  'Short Stories': { ar: 'قصص قصيرة', fr: 'Nouvelles' },
  'Coming of Age': { ar: 'بلوغ ونضج', fr: 'Passage à l’âge adulte' },
  'Contemporary Women': { ar: 'أدب نسائي معاصر', fr: 'Femmes contemporaines' },
  'Family Life': { ar: 'الحياة الأسرية', fr: 'Vie de famille' },
  'Psychological': { ar: 'نفسي', fr: 'Psychologique' },
  'Dystopian': { ar: 'ديستوبيا', fr: 'Dystopie' },
  'Apocalyptic & Post-Apocalyptic': { ar: 'نهاية العالم وما بعدها', fr: 'Apocalyptique et post-apocalyptique' },
  'Magical Realism': { ar: 'واقعية سحرية', fr: 'Réalisme magique' },
  'Epic': { ar: 'ملحمي', fr: 'Épique' },
  'War & Military': { ar: 'الحرب والجيش', fr: 'Guerre et armée' },
  'Fantasy & Magic': { ar: 'فانتازيا وسحر', fr: 'Fantastique et magie' },
  'Personal Memoirs': { ar: 'مذكرات شخصية', fr: 'Mémoires personnels' },
  'Personal Growth': { ar: 'النمو الشخصي', fr: 'Développement personnel' },
  'Motivational & Inspirational': { ar: 'تحفيزي وإلهامي', fr: 'Motivation et inspiration' },
  'Success': { ar: 'النجاح', fr: 'Réussite' },
  'Nonfiction': { ar: 'غير خيالي', fr: 'Non-fiction' },
};

// Single case-insensitive lookup. The seeded genres are written last so they
// win on the names that appear in both maps (e.g. "Fiction", "Science").
const LOOKUP = new Map<string, { ar: string; fr: string }>();
for (const [name, translations] of Object.entries(CATEGORY_TRANSLATIONS)) {
  LOOKUP.set(name.toLowerCase(), translations);
}
for (const [name, translations] of Object.entries(GENRE_TRANSLATIONS)) {
  LOOKUP.set(name.toLowerCase(), translations);
}

export function translateGenre(name: string | null | undefined, lang: LanguageCode): string {
  if (!name) return '';
  if (lang === 'en') return name;

  const trimmed = name.trim();
  const exact = LOOKUP.get(trimmed.toLowerCase());
  if (exact) return exact[lang];

  // BISAC path — translate each segment, keeping any we don't know in English.
  if (trimmed.includes('/')) {
    const segments = trimmed.split('/').map((segment) => segment.trim()).filter(Boolean);
    if (segments.length > 1) {
      return segments
        .map((segment) => LOOKUP.get(segment.toLowerCase())?.[lang] ?? segment)
        .join(' / ');
    }
  }

  // Unknown genre (an AI-suggested one, or a BISAC heading we don't cover):
  // fall back to the original string rather than hiding it.
  return trimmed;
}

// Pure pipe — re-runs only when the name or `lang` arg changes, so it updates
// live on a language switch (the component's `lang` is updated reactively).
@Pipe({ name: 'genreName', standalone: true })
export class GenreNamePipe implements PipeTransform {
  transform(name: string | null | undefined, lang: LanguageCode): string {
    return translateGenre(name, lang);
  }
}
