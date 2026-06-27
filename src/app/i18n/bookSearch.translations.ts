import { LanguageCode } from './language.model';

export interface BookSearchCopy {
  title: string;
  placeholder: string;
  searchButton: string;
  noResults: string;
  noResultsHint: string;
  idleTitle: string;
  idleHint: string;
  resultsCount: string;
  addButton: string;
  addingLabel: string;
  loadMore: string;
  loading: string;
  ariaAddToShelf: string;
  statusWantToRead: string;
  statusCurrentlyReading: string;
  statusAlreadyRead: string;
  wantToReadStatusLabel: string;
  currentlyReadingStatusLabel: string;
  alreadyReadStatusLabel: string;
  goHomeAria: string;
  filtersAria: string;
  filterBy: string;
  author: string;
  anyAuthor: string;
  isbn: string;
  isbnPlaceholder: string;
  language: string;
  anyLanguage: string;
  languageEnglish: string;
  languageArabic: string;
  languageFrench: string;
  languageSpanish: string;
  languageGerman: string;
  languageItalian: string;
  reset: string;
  sortBy: string;
  order: string;
  relevance: string;
  newest: string;
  noFilteredResults: string;
  noFilteredResultsHint: string;
  searchFailed: string;
  notSignedIn: string;
  addFailed: string;
}

export const BOOK_SEARCH_COPY: Record<LanguageCode, BookSearchCopy> = {
  en: {
    title: 'Find Books',
    placeholder: 'Search by title, author, or ISBN…',
    searchButton: 'Search',
    noResults: 'No books found for "{{ query }}"',
    noResultsHint: 'Try a different title, author, or ISBN.',
    idleTitle: 'Search millions of books',
    idleHint: 'Find your next favourite read and add it to your shelf.',
    resultsCount: '{{ n }} results',
    addButton: 'Add',
    addingLabel: 'Adding…',
    loadMore: 'Load more results',
    loading: 'Loading…',
    ariaAddToShelf: 'Add to shelf',
    statusWantToRead: 'Want to Read',
    statusCurrentlyReading: 'Currently Reading',
    statusAlreadyRead: 'Already Read',
    wantToReadStatusLabel: 'Want to Read',
    currentlyReadingStatusLabel: 'Currently Reading',
    alreadyReadStatusLabel: 'Already Read',
    goHomeAria: 'Go home',
    filtersAria: 'Search filters and sorting',
    filterBy: 'Filter by',
    author: 'Author',
    anyAuthor: 'Any author',
    isbn: 'ISBN',
    isbnPlaceholder: 'ISBN-10 or ISBN-13',
    language: 'Language',
    anyLanguage: 'Any language',
    languageEnglish: 'English',
    languageArabic: 'Arabic',
    languageFrench: 'French',
    languageSpanish: 'Spanish',
    languageGerman: 'German',
    languageItalian: 'Italian',
    reset: 'Reset',
    sortBy: 'Sort by',
    order: 'Order',
    relevance: 'Relevance',
    newest: 'Newest',
    noFilteredResults: 'No books match your search and filters.',
    noFilteredResultsHint: 'Try another search or clear one of the filters.',
    searchFailed: 'Search failed. Please try again.',
    notSignedIn: 'Not signed in.',
    addFailed: 'Could not add book. Try again.',
  },
  ar: {
    title: 'ابحث عن الكتب',
    placeholder: 'ابحث حسب العنوان أو المؤلف أو رقم ISBN…',
    searchButton: 'بحث',
    noResults: 'لم يتم العثور على كتب لـ "{{ query }}"',
    noResultsHint: 'جرب عنواناً أو مؤلفاً أو رقم ISBN مختلفاً.',
    idleTitle: 'ابحث في ملايين الكتب',
    idleHint: 'ابحث عن قراءتك التالية المفضلة وأضفها إلى رفك.',
    resultsCount: '{{ n }} نتيجة',
    addButton: 'إضافة',
    addingLabel: 'جاري الإضافة…',
    loadMore: 'تحميل المزيد من النتائج',
    loading: 'جاري التحميل…',
    ariaAddToShelf: 'إضافة إلى الرف',
    statusWantToRead: 'أريد أن أقرأ',
    statusCurrentlyReading: 'قيد القراءة حالياً',
    statusAlreadyRead: 'تمت قراءته بالفعل',
    wantToReadStatusLabel: 'أريد أن أقرأ',
    currentlyReadingStatusLabel: 'قيد القراءة حالياً',
    alreadyReadStatusLabel: 'تمت قراءته بالفعل',
    goHomeAria: 'العودة إلى الصفحة الرئيسية',
    filtersAria: 'مرشحات البحث والترتيب',
    filterBy: 'تصفية حسب',
    author: 'المؤلف',
    anyAuthor: 'أي مؤلف',
    isbn: 'ISBN',
    isbnPlaceholder: 'ISBN-10 أو ISBN-13',
    language: 'اللغة',
    anyLanguage: 'أي لغة',
    languageEnglish: 'الإنجليزية',
    languageArabic: 'العربية',
    languageFrench: 'الفرنسية',
    languageSpanish: 'الإسبانية',
    languageGerman: 'الألمانية',
    languageItalian: 'الإيطالية',
    reset: 'إعادة ضبط',
    sortBy: 'ترتيب حسب',
    order: 'الترتيب',
    relevance: 'الصلة',
    newest: 'الأحدث',
    noFilteredResults: 'لا توجد كتب تطابق البحث والمرشحات.',
    noFilteredResultsHint: 'جرّب بحثاً آخر أو امسح أحد المرشحات.',
    searchFailed: 'فشل البحث. حاول مرة أخرى.',
    notSignedIn: 'لم يتم تسجيل الدخول.',
    addFailed: 'تعذرت إضافة الكتاب. حاول مرة أخرى.',
  },
  fr: {
    title: 'Trouver des livres',
    placeholder: 'Recherchez par titre, auteur ou ISBN…',
    searchButton: 'Rechercher',
    noResults: 'Aucun livre trouvé pour "{{ query }}"',
    noResultsHint: 'Essayez un titre, un auteur ou un ISBN différent.',
    idleTitle: 'Cherchez parmi des millions de livres',
    idleHint: 'Trouvez votre prochaine lecture préférée et ajoutez-la à votre bibliothèque.',
    resultsCount: '{{ n }} résultats',
    addButton: 'Ajouter',
    addingLabel: 'Ajout en cours…',
    loadMore: 'Charger plus de résultats',
    loading: 'Chargement…',
    ariaAddToShelf: 'Ajouter à la bibliothèque',
    statusWantToRead: 'À lire',
    statusCurrentlyReading: 'En cours de lecture',
    statusAlreadyRead: 'Déjà lu',
    wantToReadStatusLabel: 'À lire',
    currentlyReadingStatusLabel: 'En cours de lecture',
    alreadyReadStatusLabel: 'Déjà lu',
    goHomeAria: 'Retour à l’accueil',
    filtersAria: 'Filtres et tri de la recherche',
    filterBy: 'Filtrer par',
    author: 'Auteur',
    anyAuthor: 'Tous les auteurs',
    isbn: 'ISBN',
    isbnPlaceholder: 'ISBN-10 ou ISBN-13',
    language: 'Langue',
    anyLanguage: 'Toutes les langues',
    languageEnglish: 'Anglais',
    languageArabic: 'Arabe',
    languageFrench: 'Français',
    languageSpanish: 'Espagnol',
    languageGerman: 'Allemand',
    languageItalian: 'Italien',
    reset: 'Réinitialiser',
    sortBy: 'Trier par',
    order: 'Ordre',
    relevance: 'Pertinence',
    newest: 'Plus récents',
    noFilteredResults: 'Aucun livre ne correspond à votre recherche et aux filtres.',
    noFilteredResultsHint: 'Essayez une autre recherche ou effacez un filtre.',
    searchFailed: 'La recherche a échoué. Réessayez.',
    notSignedIn: 'Vous n’êtes pas connecté.',
    addFailed: 'Impossible d’ajouter le livre. Réessayez.',
  },
};
