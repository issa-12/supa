import { LanguageCode } from './language.model';

export interface HomeCopy {
  loadProfileError: string;
  currentUserAlt: string;
  coverAlt: string;
  byAuthor: string;
  // Hero section
  heroPill: string;
  heroEyebrow: string;
  heroEyebrowPrefix: string;
  heroFallbackDescription: string;
  heroViewBook: string;
  heroAddToReading: string;
  heroAdding: string;
  heroAdded: string;
  heroAddError: string;

  // Continue Reading
  continueReadingTitle: string;
  continueReadingNoProgress: string;
  continueReadingPageOf: string;
  continueReadingButton: string;
  progressLabel: string;
  noProgressTracked: string;
  continueReadingBtn: string;

  // Recommended Books
  recommendedTitle: string;
  recommendedEyebrow: string;
  recommendedAriaViewDetails: string;
  recommendedSubtitle: string;

  // Trending Books
  trendingTitle: string;
  trendingTagPopular: string;
  trendingTagTopRated: string;

  // Posts Feed
  feedComposePlaceholder: string;
  feedComposeTextareaPlaceholder: string;
  feedBookSearchPlaceholder: string;
  feedCancelButton: string;
  feedPostButton: string;
  feedPosting: string;
  feedTabFriends: string;
  feedTabTrending: string;
  feedEmptyFriends: string;
  feedEmptyTrending: string;
  feedAriaDeletePost: string;
  feedAriaRemoveBook: string;
  feedConfirmDelete: string;
  composePlaceholder: string;
  composeTextareaPlaceholder: string;
  bookSearchPlaceholder: string;
  tagBookBtn: string;
  cancelBtn: string;
  postingBtn: string;
  postBtn: string;
  contentRejected: string;
  postFailed: string;
  friendsTab: string;
  trendingTab: string;
  noPostsFriendsMsg: string;
  noTrendingPostsMsg: string;

  // Home page FAB
  writePostAriaLabel: string;

  // Additional keys
  deletePostConfirm: string;

  // Post translation
  translateBtn: string;
  showOriginalBtn: string;
  translating: string;
}

export const HOME_COPY: Record<LanguageCode, HomeCopy> = {
  en: {
    loadProfileError: 'Failed to load user profile.',
    currentUserAlt: 'You',
    coverAlt: '{{ title }} cover',
    byAuthor: 'by {{ author }}',
    heroPill: 'Recommended for you',
    heroEyebrow: 'Recommended for you',
    heroEyebrowPrefix: 'Because you like',
    heroFallbackDescription: 'A compelling read waiting to be discovered. Add it to your shelf to start your journey.',
    heroViewBook: 'View Book',
    heroAddToReading: 'Add to Reading',
    heroAdding: 'Adding…',
    heroAdded: 'Added to Reading',
    heroAddError: 'Could not add this book. Please try again.',

    continueReadingTitle: 'Continue Reading',
    continueReadingNoProgress: 'No progress tracked yet',
    continueReadingPageOf: 'Page {{ n }} / {{ total }}',
    continueReadingButton: 'Continue reading',
    progressLabel: 'Page ',
    noProgressTracked: 'No progress tracked yet',
    continueReadingBtn: 'Continue reading',

    recommendedTitle: 'Recommended for You',
    recommendedEyebrow: 'Based on your favorite genres',
    recommendedAriaViewDetails: 'View book details',
    recommendedSubtitle: 'Based on your favorite genres',

    trendingTitle: 'Trending This Week',
    trendingTagPopular: 'Popular',
    trendingTagTopRated: 'Top Rated',

    feedComposePlaceholder: 'Share your thoughts on a book…',
    feedComposeTextareaPlaceholder: 'What did you think? Any quotes? Recommend it?',
    feedBookSearchPlaceholder: 'Search for a book…',
    feedCancelButton: 'Cancel',
    feedPostButton: 'Post',
    feedPosting: 'Posting…',
    feedTabFriends: 'Friends',
    feedTabTrending: 'Trending',
    feedEmptyFriends: 'No posts yet. Add friends and start sharing!',
    feedEmptyTrending: 'No trending posts this week.',
    feedAriaDeletePost: 'Delete post',
    feedAriaRemoveBook: 'Remove book',
    feedConfirmDelete: 'Delete this post?',
    composePlaceholder: 'What are you reading? Share a thought…',
    composeTextareaPlaceholder: 'What did you think? Any quotes? Recommend it?',
    bookSearchPlaceholder: 'Search for a book…',
    tagBookBtn: 'Tag a book',
    cancelBtn: 'Cancel',
    postingBtn: 'Posting…',
    postBtn: 'Post',
    contentRejected: 'Your post was flagged by our community guidelines and can\'t be published.',
    postFailed: 'Could not post. Please try again.',
    friendsTab: 'Friends',
    trendingTab: 'Trending',
    noPostsFriendsMsg: 'No posts yet. Add friends and start sharing!',
    noTrendingPostsMsg: 'No trending posts this week.',

    writePostAriaLabel: 'Write a post',
    deletePostConfirm: 'Delete this post?',
    translateBtn: 'Translate',
    showOriginalBtn: 'Show original',
    translating: 'Translating…',
  },
  ar: {
    loadProfileError: 'فشل تحميل ملف المستخدم.',
    currentUserAlt: 'أنت',
    coverAlt: 'غلاف {{ title }}',
    byAuthor: 'بقلم {{ author }}',
    heroPill: 'موصى به لك',
    heroEyebrow: 'موصى به لك',
    heroEyebrowPrefix: 'لأنك تحب',
    heroFallbackDescription: 'قراءة رائعة تنتظر اكتشافك. أضفها إلى رفك لبدء رحلتك.',
    heroViewBook: 'عرض الكتاب',
    heroAddToReading: 'أضف إلى القراءة الحالية',
    heroAdding: 'جاري الإضافة…',
    heroAdded: 'تمت الإضافة إلى القراءة',
    heroAddError: 'تعذّر إضافة هذا الكتاب. حاول مرة أخرى.',

    continueReadingTitle: 'متابعة القراءة',
    continueReadingNoProgress: 'لم يتم تتبع أي تقدم بعد',
    continueReadingPageOf: 'الصفحة {{ n }} من {{ total }}',
    continueReadingButton: 'استمر في القراءة',
    progressLabel: 'الصفحة ',
    noProgressTracked: 'لم يتم تتبع أي تقدم بعد',
    continueReadingBtn: 'استمر في القراءة',

    recommendedTitle: 'موصى به لك',
    recommendedEyebrow: 'بناءً على أنواعك المفضلة',
    recommendedAriaViewDetails: 'عرض تفاصيل الكتاب',
    recommendedSubtitle: 'بناءً على أنواعك المفضلة',

    trendingTitle: 'الأكثر شهرة هذا الأسبوع',
    trendingTagPopular: 'شهير',
    trendingTagTopRated: 'الأعلى تقييماً',

    feedComposePlaceholder: 'شارك أفكارك حول كتاب…',
    feedComposeTextareaPlaceholder: 'ماذا كان انطباعك؟ هل لديك اقتباسات؟ هل توصي به؟',
    feedBookSearchPlaceholder: 'ابحث عن كتاب…',
    feedCancelButton: 'إلغاء',
    feedPostButton: 'نشر',
    feedPosting: 'جاري النشر…',
    feedTabFriends: 'الأصدقاء',
    feedTabTrending: 'الأكثر شهرة',
    feedEmptyFriends: 'لا توجد منشورات حتى الآن. أضف أصدقاء وابدأ المشاركة!',
    feedEmptyTrending: 'لا توجد منشورات شهيرة هذا الأسبوع.',
    feedAriaDeletePost: 'حذف المنشور',
    feedAriaRemoveBook: 'إزالة الكتاب',
    feedConfirmDelete: 'حذف هذا المنشور؟',
    composePlaceholder: 'ماذا تقرأ؟ شارك فكرة…',
    composeTextareaPlaceholder: 'ماذا كان انطباعك؟ هل لديك اقتباسات؟ هل توصي به؟',
    bookSearchPlaceholder: 'ابحث عن كتاب…',
    tagBookBtn: 'أضف كتابًا',
    cancelBtn: 'إلغاء',
    postingBtn: 'جاري النشر…',
    postBtn: 'نشر',
    contentRejected: 'تم تمييز منشورك بواسطة إرشادات المجتمع ولا يمكن نشره.',
    postFailed: 'تعذّر النشر. حاول مرة أخرى.',
    friendsTab: 'الأصدقاء',
    trendingTab: 'الأكثر شهرة',
    noPostsFriendsMsg: 'لا توجد منشورات حتى الآن. أضف أصدقاء وابدأ المشاركة!',
    noTrendingPostsMsg: 'لا توجد منشورات شهيرة هذا الأسبوع.',

    writePostAriaLabel: 'كتابة منشور',
    deletePostConfirm: 'حذف هذا المنشور؟',
    translateBtn: 'ترجمة',
    showOriginalBtn: 'عرض الأصل',
    translating: 'جاري الترجمة…',
  },
  fr: {
    loadProfileError: 'Impossible de charger le profil utilisateur.',
    currentUserAlt: 'Vous',
    coverAlt: 'Couverture de {{ title }}',
    byAuthor: 'par {{ author }}',
    heroPill: 'Recommandé pour vous',
    heroEyebrow: 'Recommandé pour vous',
    heroEyebrowPrefix: 'Parce que vous aimez',
    heroFallbackDescription: 'Une lecture captivante qui n\'attend que d\'être découverte. Ajoutez-la à votre bibliothèque pour commencer votre voyage.',
    heroViewBook: 'Afficher le livre',
    heroAddToReading: 'Ajouter à la lecture en cours',
    heroAdding: 'Ajout en cours…',
    heroAdded: 'Ajouté à la lecture',
    heroAddError: 'Impossible d’ajouter ce livre. Veuillez réessayer.',

    continueReadingTitle: 'Continuer la lecture',
    continueReadingNoProgress: 'Aucune progression enregistrée pour l\'instant',
    continueReadingPageOf: 'Page {{ n }} / {{ total }}',
    continueReadingButton: 'Continuer la lecture',
    progressLabel: 'Page ',
    noProgressTracked: 'Aucune progression enregistrée pour l\'instant',
    continueReadingBtn: 'Continuer la lecture',

    recommendedTitle: 'Recommandé pour vous',
    recommendedEyebrow: 'Basé sur vos genres préférés',
    recommendedAriaViewDetails: 'Afficher les détails du livre',
    recommendedSubtitle: 'Basé sur vos genres préférés',

    trendingTitle: 'Tendance cette semaine',
    trendingTagPopular: 'Populaire',
    trendingTagTopRated: 'Les mieux notés',

    feedComposePlaceholder: 'Partagez vos réflexions sur un livre…',
    feedComposeTextareaPlaceholder: 'Que pensiez-vous ? Des citations ? Vous le recommandez ?',
    feedBookSearchPlaceholder: 'Rechercher un livre…',
    feedCancelButton: 'Annuler',
    feedPostButton: 'Publier',
    feedPosting: 'Publication en cours…',
    feedTabFriends: 'Amis',
    feedTabTrending: 'Tendance',
    feedEmptyFriends: 'Aucun message pour le moment. Ajoutez des amis et commencez à partager !',
    feedEmptyTrending: 'Aucun message en tendance cette semaine.',
    feedAriaDeletePost: 'Supprimer le message',
    feedAriaRemoveBook: 'Supprimer le livre',
    feedConfirmDelete: 'Supprimer ce message ?',
    composePlaceholder: 'Que lisez-vous ? Partagez une pensée…',
    composeTextareaPlaceholder: 'Que pensiez-vous ? Des citations ? Vous le recommandez ?',
    bookSearchPlaceholder: 'Rechercher un livre…',
    tagBookBtn: 'Associer un livre',
    cancelBtn: 'Annuler',
    postingBtn: 'Publication en cours…',
    postBtn: 'Publier',
    contentRejected: 'Votre message a été signalé par nos règles communautaires et ne peut pas être publié.',
    postFailed: 'Échec de la publication. Veuillez réessayer.',
    friendsTab: 'Amis',
    trendingTab: 'Tendance',
    noPostsFriendsMsg: 'Aucun message pour le moment. Ajoutez des amis et commencez à partager !',
    noTrendingPostsMsg: 'Aucun message en tendance cette semaine.',

    writePostAriaLabel: 'Écrire un message',
    deletePostConfirm: 'Supprimer ce message ?',
    translateBtn: 'Traduire',
    showOriginalBtn: 'Voir l\'original',
    translating: 'Traduction…',
  },
};
