import { LanguageCode } from './language.model';

export interface ShelfCopy {
  title: string;
  myLibraryTitle: string;
  emptyTitle: string;
  emptyLibraryTitle: string;
  emptyHint: string;
  emptyLibraryHint: string;
  findBooks: string;
  findBooksBtn: string;
  filterAll: string;
  allFilter: string;
  filterReading: string;
  readingFilter: string;
  filterWantToRead: string;
  wantToReadFilter: string;
  filterRead: string;
  readFilter: string;
  sortDateAdded: string;
  dateAddedSort: string;
  sortTitleAZ: string;
  titleAZSort: string;
  sortRating: string;
  ratingSort: string;
  dropdownMoveTo: string;
  dropdownRemove: string;
  statusCurrentlyReading: string;
  statusWantToRead: string;
  statusAlreadyRead: string;
  trackProgress: string;
  progressPagePlaceholder: string;
  progressTotalPlaceholder: string;
  confirmRemove: string;
  thisBook: string;
  ariaGoHome: string;
  ariaFindBooks: string;
  currentlyReadingLabel: string;
  wantToReadLabel: string;
  alreadyReadLabel: string;
  failedToLoadShelfMsg: string;
  friendRecommendationsLabel: string;
  recommendationsFilter: string;
  recommendedByPrefix: string;
  acceptBtn: string;
  declineBtn: string;
  addBookBtn: string;
  booksAcrossShelves: string;
  booksAcrossShelvesOne: string;
  booksAcrossShelvesOther: string;
  seeAllLink: string;
  seeAllCount: string;
  moreBooks: string;
  pendingRecommendations: string;
  pendingRecommendationsOne: string;
  pendingRecommendationsOther: string;
  fromPrefix: string;
  friendFallback: string;
  andOthers: string;
  viewAllBtn: string;
  dismissBtn: string;
  sectionCount: string;
  sectionCountOne: string;
  sectionCountOther: string;
}

export const SHELF_COPY: Record<LanguageCode, ShelfCopy> = {
  en: {
    title: 'My Library',
    myLibraryTitle: 'My Library',
    emptyTitle: 'Your library is empty',
    emptyLibraryTitle: 'Your library is empty',
    emptyHint: 'Search for books and add them to your shelf.',
    emptyLibraryHint: 'Search for books and add them to your shelf.',
    findBooks: 'Find Books',
    findBooksBtn: 'Find Books',
    filterAll: 'All',
    allFilter: 'All',
    filterReading: 'Reading',
    readingFilter: 'Reading',
    filterWantToRead: 'Want to Read',
    wantToReadFilter: 'Want to Read',
    filterRead: 'Read',
    readFilter: 'Read',
    sortDateAdded: 'Date Added',
    dateAddedSort: 'Date Added',
    sortTitleAZ: 'Title A–Z',
    titleAZSort: 'Title A–Z',
    sortRating: 'Rating',
    ratingSort: 'Rating',
    dropdownMoveTo: 'Move to',
    dropdownRemove: 'Remove from shelf',
    statusCurrentlyReading: 'Currently Reading',
    statusWantToRead: 'Want to Read',
    statusAlreadyRead: 'Already Read',
    trackProgress: '+ Track progress',
    progressPagePlaceholder: 'Page',
    progressTotalPlaceholder: 'Total',
    confirmRemove: 'Remove "{{ title }}" from your shelf?',
    thisBook: 'this book',
    ariaGoHome: 'Go home',
    ariaFindBooks: 'Find books',
    currentlyReadingLabel: 'Currently Reading',
    wantToReadLabel: 'Want to Read',
    alreadyReadLabel: 'Already Read',
    failedToLoadShelfMsg: 'Failed to load shelf',
    friendRecommendationsLabel: 'Friends Recommendations',
    recommendationsFilter: 'Recommendations',
    recommendedByPrefix: 'Recommended by',
    acceptBtn: 'Accept',
    declineBtn: 'Decline',
    addBookBtn: 'Add book',
    booksAcrossShelves: '{count} books across all shelves',
    booksAcrossShelvesOne: '{count} book across all shelves',
    booksAcrossShelvesOther: '{count} books across all shelves',
    seeAllLink: 'See all',
    seeAllCount: 'See all {count}',
    moreBooks: '+{count} more',
    pendingRecommendations: '{count} pending recommendations',
    pendingRecommendationsOne: '{count} pending recommendation',
    pendingRecommendationsOther: '{count} pending recommendations',
    fromPrefix: 'From',
    friendFallback: 'a friend',
    andOthers: 'and others',
    viewAllBtn: 'View all',
    dismissBtn: 'Dismiss',
    sectionCount: '{count} books',
    sectionCountOne: '{count} book',
    sectionCountOther: '{count} books',
  },
  ar: {
    title: 'مكتبتي',
    myLibraryTitle: 'مكتبتي',
    emptyTitle: 'مكتبتك فارغة',
    emptyLibraryTitle: 'مكتبتك فارغة',
    emptyHint: 'ابحث عن الكتب وأضفها إلى رفك.',
    emptyLibraryHint: 'ابحث عن الكتب وأضفها إلى رفك.',
    findBooks: 'ابحث عن الكتب',
    findBooksBtn: 'ابحث عن الكتب',
    filterAll: 'الكل',
    allFilter: 'الكل',
    filterReading: 'قيد القراءة',
    readingFilter: 'قيد القراءة',
    filterWantToRead: 'أريد أن أقرأ',
    wantToReadFilter: 'أريد أن أقرأ',
    filterRead: 'مقروء',
    readFilter: 'مقروء',
    sortDateAdded: 'تاريخ الإضافة',
    dateAddedSort: 'تاريخ الإضافة',
    sortTitleAZ: 'العنوان أ–ي',
    titleAZSort: 'العنوان أ–ي',
    sortRating: 'التقييم',
    ratingSort: 'التقييم',
    dropdownMoveTo: 'نقل إلى',
    dropdownRemove: 'إزالة من الرف',
    statusCurrentlyReading: 'قيد القراءة حالياً',
    statusWantToRead: 'أريد أن أقرأ',
    statusAlreadyRead: 'تمت قراءته بالفعل',
    trackProgress: '+ تتبع التقدم',
    progressPagePlaceholder: 'الصفحة',
    progressTotalPlaceholder: 'الإجمالي',
    confirmRemove: 'إزالة "{{ title }}" من رفك؟',
    thisBook: 'هذا الكتاب',
    ariaGoHome: 'الرجوع للرئيسية',
    ariaFindBooks: 'ابحث عن الكتب',
    currentlyReadingLabel: 'قيد القراءة حالياً',
    wantToReadLabel: 'أريد أن أقرأ',
    alreadyReadLabel: 'تمت قراءته بالفعل',
    failedToLoadShelfMsg: 'فشل تحميل الرف',
    friendRecommendationsLabel: 'توصيات الأصدقاء',
    recommendationsFilter: 'التوصيات',
    recommendedByPrefix: 'أوصى به',
    acceptBtn: 'قبول',
    declineBtn: 'رفض',
    addBookBtn: 'إضافة كتاب',
    booksAcrossShelves: '{count} كتاب في جميع الرفوف',
    booksAcrossShelvesOne: 'كتاب واحد في جميع الرفوف',
    booksAcrossShelvesOther: '{count} كتاب في جميع الرفوف',
    seeAllLink: 'عرض الكل',
    seeAllCount: 'عرض الكل ({count})',
    moreBooks: '+{count} المزيد',
    pendingRecommendations: '{count} توصيات معلّقة',
    pendingRecommendationsOne: 'توصية واحدة معلّقة',
    pendingRecommendationsOther: '{count} توصيات معلّقة',
    fromPrefix: 'من',
    friendFallback: 'صديق',
    andOthers: 'وآخرين',
    viewAllBtn: 'عرض الكل',
    dismissBtn: 'تجاهل',
    sectionCount: '{count} كتاب',
    sectionCountOne: 'كتاب واحد',
    sectionCountOther: '{count} كتاب',
  },
  fr: {
    title: 'Ma bibliothèque',
    myLibraryTitle: 'Ma bibliothèque',
    emptyTitle: 'Votre bibliothèque est vide',
    emptyLibraryTitle: 'Votre bibliothèque est vide',
    emptyHint: 'Recherchez des livres et ajoutez-les à votre bibliothèque.',
    emptyLibraryHint: 'Recherchez des livres et ajoutez-les à votre bibliothèque.',
    findBooks: 'Trouver des livres',
    findBooksBtn: 'Trouver des livres',
    filterAll: 'Tous',
    allFilter: 'Tous',
    filterReading: 'En lecture',
    readingFilter: 'En lecture',
    filterWantToRead: 'À lire',
    wantToReadFilter: 'À lire',
    filterRead: 'Lus',
    readFilter: 'Lus',
    sortDateAdded: 'Date d’ajout',
    dateAddedSort: 'Date d’ajout',
    sortTitleAZ: 'Titre A–Z',
    titleAZSort: 'Titre A–Z',
    sortRating: 'Note',
    ratingSort: 'Note',
    dropdownMoveTo: 'Déplacer vers',
    dropdownRemove: 'Supprimer de la bibliothèque',
    statusCurrentlyReading: 'En cours de lecture',
    statusWantToRead: 'À lire',
    statusAlreadyRead: 'Déjà lu',
    trackProgress: '+ Suivre la progression',
    progressPagePlaceholder: 'Page',
    progressTotalPlaceholder: 'Total',
    confirmRemove: 'Supprimer "{{ title }}" de votre bibliothèque ?',
    thisBook: 'ce livre',
    ariaGoHome: 'Aller à l’accueil',
    ariaFindBooks: 'Trouver des livres',
    currentlyReadingLabel: 'En cours de lecture',
    wantToReadLabel: 'À lire',
    alreadyReadLabel: 'Déjà lu',
    failedToLoadShelfMsg: 'Impossible de charger la bibliothèque',
    friendRecommendationsLabel: 'Recommandations d’amis',
    recommendationsFilter: 'Recommandations',
    recommendedByPrefix: 'Recommandé par',
    acceptBtn: 'Accepter',
    declineBtn: 'Refuser',
    addBookBtn: 'Ajouter un livre',
    booksAcrossShelves: '{count} livres sur toutes les étagères',
    booksAcrossShelvesOne: '{count} livre sur toutes les étagères',
    booksAcrossShelvesOther: '{count} livres sur toutes les étagères',
    seeAllLink: 'Voir tout',
    seeAllCount: 'Voir les {count}',
    moreBooks: '+{count} de plus',
    pendingRecommendations: '{count} recommandations en attente',
    pendingRecommendationsOne: '{count} recommandation en attente',
    pendingRecommendationsOther: '{count} recommandations en attente',
    fromPrefix: 'De',
    friendFallback: 'un ami',
    andOthers: 'et d’autres',
    viewAllBtn: 'Voir tout',
    dismissBtn: 'Ignorer',
    sectionCount: '{count} livres',
    sectionCountOne: '{count} livre',
    sectionCountOther: '{count} livres',
  },
};
