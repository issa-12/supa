import { LanguageCode } from './language.model';

export interface CommunityCopy {
  title: string;
  subtitle: string;
  searchTagsTitle: string;
  searchTagsPlaceholder: string;
  trendingTagsTitle: string;
  noTrendingTags: string;
  composePlaceholder: string;
  composeTextareaPlaceholder: string;
  tagsInputPlaceholder: string;
  bookPickerPlaceholder: string;
  aiModeration: string;
  cancelButton: string;
  postButton: string;
  posting: string;
  tabAllPosts: string;
  tabFriends: string;
  tabMine: string;
  tabTrending: string;
  emptyNoTag: string;
  emptyWithTag: string;
  loadMore: string;
  loading: string;
  ariaDeletePost: string;
  ariaRemoveBook: string;
  ariaFilterClear: string;
  confirmDelete: string;
  sentimentPositive: string;
  sentimentNegative: string;
  sentimentNeutral: string;
  sentimentMixed: string;
  contentRejected: string;
  postFailed: string;
  goBackAria: string;
  currentUserAlt: string;
}

export const COMMUNITY_COPY: Record<LanguageCode, CommunityCopy> = {
  en: {
    title: 'Community',
    subtitle: 'Discover what readers are saying',
    searchTagsTitle: 'Search Tags',
    searchTagsPlaceholder: '#fantasy, #mystery…',
    trendingTagsTitle: 'Trending Tags',
    noTrendingTags: 'No trending tags this week.',
    composePlaceholder: 'Share your thoughts on a book…',
    composeTextareaPlaceholder: 'What did you think? Any quotes? Recommend it?',
    tagsInputPlaceholder: 'Add tags: horror fantasy mystery  (max 5)',
    bookPickerPlaceholder: 'Tag a book (required)…',
    aiModeration: 'AI-moderated for community safety',
    cancelButton: 'Cancel',
    postButton: 'Post',
    posting: 'Posting…',
    tabAllPosts: 'All Posts',
    tabFriends: 'Friends',
    tabMine: 'My Posts',
    tabTrending: 'Trending',
    emptyNoTag: 'No posts yet — be the first to share!',
    emptyWithTag: 'No posts tagged #{{ tag }}.',
    loadMore: 'Load more',
    loading: 'Loading…',
    ariaDeletePost: 'Delete post',
    ariaRemoveBook: 'Remove book',
    ariaFilterClear: 'Clear filter',
    confirmDelete: 'Delete this post?',
    sentimentPositive: 'positive',
    sentimentNegative: 'negative',
    sentimentNeutral: 'neutral',
    sentimentMixed: 'mixed',
    contentRejected: 'Your post was flagged by our community guidelines and can\'t be published.',
    postFailed: 'Could not post. Please try again.',
    goBackAria: 'Go back',
    currentUserAlt: 'You',
  },
  ar: {
    title: 'المجتمع',
    subtitle: 'اكتشف ما يقوله القراء',
    searchTagsTitle: 'البحث عن الوسوم',
    searchTagsPlaceholder: '#خيال، #غموض…',
    trendingTagsTitle: 'الوسوم الشهيرة',
    noTrendingTags: 'لا توجد وسوم شهيرة هذا الأسبوع.',
    composePlaceholder: 'شارك أفكارك حول كتاب…',
    composeTextareaPlaceholder: 'ماذا كان انطباعك؟ هل لديك اقتباسات؟ هل توصي به؟',
    tagsInputPlaceholder: 'إضافة وسوم: رعب خيال غموض (الحد الأقصى 5)',
    bookPickerPlaceholder: 'حدد كتاب (مطلوب)…',
    aiModeration: 'معتدل بواسطة الذكاء الاصطناعي لسلامة المجتمع',
    cancelButton: 'إلغاء',
    postButton: 'نشر',
    posting: 'جاري النشر…',
    tabAllPosts: 'جميع المنشورات',
    tabFriends: 'الأصدقاء',
    tabMine: 'منشوراتي',
    tabTrending: 'الأكثر شهرة',
    emptyNoTag: 'لا توجد منشورات حتى الآن — كن أول من يشارك!',
    emptyWithTag: 'لا توجد منشورات موسومة #{{ tag }}.',
    loadMore: 'تحميل المزيد',
    loading: 'جاري التحميل…',
    ariaDeletePost: 'حذف المنشور',
    ariaRemoveBook: 'إزالة الكتاب',
    ariaFilterClear: 'مسح المرشح',
    confirmDelete: 'حذف هذا المنشور؟',
    sentimentPositive: 'إيجابي',
    sentimentNegative: 'سلبي',
    sentimentNeutral: 'محايد',
    sentimentMixed: 'مختلط',
    contentRejected: 'تم تمييز منشورك بواسطة إرشادات المجتمع ولا يمكن نشره.',
    postFailed: 'تعذّر النشر. حاول مرة أخرى.',
    goBackAria: 'رجوع',
    currentUserAlt: 'أنت',
  },
  fr: {
    title: 'Communauté',
    subtitle: 'Découvrez ce que disent les lecteurs',
    searchTagsTitle: 'Rechercher des balises',
    searchTagsPlaceholder: '#fantaisie, #mystère…',
    trendingTagsTitle: 'Balises tendance',
    noTrendingTags: 'Aucune balise tendance cette semaine.',
    composePlaceholder: 'Partagez vos réflexions sur un livre…',
    composeTextareaPlaceholder: 'Que pensiez-vous ? Des citations ? Vous le recommandez ?',
    tagsInputPlaceholder: 'Ajouter des balises : horreur fantaisie mystère (max 5)',
    bookPickerPlaceholder: 'Marquer un livre (obligatoire)…',
    aiModeration: 'Modéré par l\'IA pour la sécurité de la communauté',
    cancelButton: 'Annuler',
    postButton: 'Publier',
    posting: 'Publication en cours…',
    tabAllPosts: 'Tous les messages',
    tabFriends: 'Amis',
    tabMine: 'Mes messages',
    tabTrending: 'Tendance',
    emptyNoTag: 'Aucun message pour le moment — soyez le premier à partager !',
    emptyWithTag: 'Aucun message avec la balise #{{ tag }}.',
    loadMore: 'Charger plus',
    loading: 'Chargement…',
    ariaDeletePost: 'Supprimer le message',
    ariaRemoveBook: 'Supprimer le livre',
    ariaFilterClear: 'Effacer le filtre',
    confirmDelete: 'Supprimer ce message ?',
    sentimentPositive: 'positif',
    sentimentNegative: 'négatif',
    sentimentNeutral: 'neutre',
    sentimentMixed: 'mitigé',
    contentRejected: 'Votre message a été signalé par nos règles communautaires et ne peut pas être publié.',
    postFailed: 'Échec de la publication. Veuillez réessayer.',
    goBackAria: 'Retour',
    currentUserAlt: 'Vous',
  },
};
