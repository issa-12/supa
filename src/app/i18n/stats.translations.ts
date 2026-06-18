import { LanguageCode } from './language.model';

export interface StatsCopy {
  title: string;
  subtitle: string;
  periodWeek: string;
  periodMonth: string;
  topBooks: string;
  noBooks: string;
  trendingGenres: string;
  noGenres: string;
  topReaders: string;
  noReaders: string;
  booksRead: string;
  myReadingPace: string;
  noReadingPace: string;
  paceTotal: string;
  errorNotAuthenticated: string;
  errorLoadStats: string;
  errorLoadPace: string;
  months: string[]; // 12 short month labels, Jan..Dec order
}

export const STATS_COPY: Record<LanguageCode, StatsCopy> = {
  en: {
    title: 'Reading Stats',
    subtitle: 'Community insights & your progress',
    periodWeek: 'This Week',
    periodMonth: 'This Month',
    topBooks: 'Top Books',
    noBooks: 'No books added in this period.',
    trendingGenres: 'Trending Genres',
    noGenres: 'No genre data yet.',
    topReaders: 'Top Readers',
    noReaders: 'No readers yet — mark books as "Read" to appear here.',
    booksRead: '{{ n }} book(s) read',
    myReadingPace: 'My Reading Pace',
    noReadingPace: 'Mark books as "Read" to track your reading pace.',
    paceTotal: '{{ n }} book(s) read so far this year',
    errorNotAuthenticated: 'Not authenticated.',
    errorLoadStats: 'Failed to load stats. Try again.',
    errorLoadPace: 'Failed to load reading pace.',
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
  ar: {
    title: 'إحصائيات القراءة',
    subtitle: 'رؤى المجتمع وتقدمك',
    periodWeek: 'هذا الأسبوع',
    periodMonth: 'هذا الشهر',
    topBooks: 'أفضل الكتب',
    noBooks: 'لم تتم إضافة كتب في هذه الفترة.',
    trendingGenres: 'الأنواع الشهيرة',
    noGenres: 'لا توجد بيانات نوع حتى الآن.',
    topReaders: 'أفضل القراء',
    noReaders: 'لا قراء حتى الآن — وضح علامة على الكتب بـ "مقروء" للظهور هنا.',
    booksRead: '{{ n }} كتاب مقروء',
    myReadingPace: 'وتيرة قراءتي',
    noReadingPace: 'وضع علامة على الكتب بـ "مقروء" لتتبع وتيرة القراءة.',
    paceTotal: '{{ n }} كتاب تمت قراءته حتى الآن هذا العام',
    errorNotAuthenticated: 'لم يتم المصادقة.',
    errorLoadStats: 'فشل تحميل الإحصائيات. حاول مرة أخرى.',
    errorLoadPace: 'فشل تحميل وتيرة القراءة.',
    months: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  },
  fr: {
    title: 'Statistiques de lecture',
    subtitle: 'Aperçus communautaires et votre progression',
    periodWeek: 'Cette semaine',
    periodMonth: 'Ce mois-ci',
    topBooks: 'Meilleurs livres',
    noBooks: 'Aucun livre ajouté pour cette période.',
    trendingGenres: 'Genres tendance',
    noGenres: 'Aucune donnée de genre pour le moment.',
    topReaders: 'Meilleurs lecteurs',
    noReaders: 'Aucun lecteur encore — marquez les livres comme « Lus » pour apparaître ici.',
    booksRead: '{{ n }} livre(s) lu(s)',
    myReadingPace: 'Ma vitesse de lecture',
    noReadingPace: 'Marquez les livres comme « Lus » pour suivre votre vitesse de lecture.',
    paceTotal: '{{ n }} livre(s) lu(s) jusqu\'à présent cette année',
    errorNotAuthenticated: 'Non authentifié.',
    errorLoadStats: 'Impossible de charger les statistiques. Réessayez.',
    errorLoadPace: 'Impossible de charger la vitesse de lecture.',
    months: ['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'],
  },
};
