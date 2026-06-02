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
  },
};
