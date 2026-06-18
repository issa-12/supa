import { LanguageCode } from './language.model';

export interface BookDetailCopy {
  title: string;
  myShelf: string;
  loadingBook: string;
  goBack: string;
  bookNotFound: string;
  loadFailed: string;
  pages: string;
  pagesUnit: string;
  byAuthor: string;
  yourRating: string;
  ratingUnit: string;
  ratingsUnit: string;
  recommendToFriend: string;
  noFriends: string;
  recommendSent: string;
  recommendFailed: string;
  recommendAlreadyHas: string;
  changeStatus: string;
  removeFromShelf: string;
  addToShelf: string;
  adding: string;
  statusCurrentlyReading: string;
  statusWantToRead: string;
  statusAlreadyRead: string;
  aboutBook: string;
  myNotes: string;
  notesHint: string;
  notesPlaceholder: string;
  saveNotes: string;
  saving: string;
  saved: string;
  myReview: string;
  reviewHint: string;
  reviewPlaceholder: string;
  saveReview: string;
  postReview: string;
  updateReview: string;
  editReview: string;
  cancelEdit: string;
  communityReviews: string;
  likeReview: string;
  dislikeReview: string;
  confirmRemove: string;
  currentlyReadingStatusLabel: string;
  wantToReadStatusLabel: string;
  alreadyReadStatusLabel: string;
}

export const BOOK_DETAIL_COPY: Record<LanguageCode, BookDetailCopy> = {
  en: {
    title: 'Book Details',
    myShelf: 'My Shelf',
    loadingBook: 'Loading book…',
    goBack: 'Go back',
    bookNotFound: 'Book not found.',
    loadFailed: 'Failed to load book.',
    pages: '{{ n }} pages',
    pagesUnit: 'pages',
    byAuthor: 'by',
    yourRating: 'Your Rating',
    ratingUnit: 'rating',
    ratingsUnit: 'ratings',
    recommendToFriend: 'Recommend to Friend',
    noFriends: 'No friends yet.',
    recommendSent: 'Sent!',
    recommendFailed: 'Failed',
    recommendAlreadyHas: 'Already on their shelf',
    changeStatus: 'Change status',
    removeFromShelf: 'Remove from shelf',
    addToShelf: 'Add to Shelf',
    adding: 'Adding…',
    statusCurrentlyReading: 'Currently Reading',
    statusWantToRead: 'Want to Read',
    statusAlreadyRead: 'Already Read',
    aboutBook: 'About this book',
    myNotes: 'My Notes',
    notesHint: 'Private — only you can see these',
    notesPlaceholder: 'Add your private notes about this book…',
    saveNotes: 'Save Notes',
    saving: 'Saving…',
    saved: 'Saved!',
    myReview: 'My Review',
    reviewHint: 'Visible to the ReadTrack community',
    reviewPlaceholder: 'Share your thoughts about this book…',
    saveReview: 'Save Review',
    postReview: 'Post Review',
    updateReview: 'Update Review',
    editReview: 'Edit',
    cancelEdit: 'Cancel',
    communityReviews: 'Community Reviews',
    likeReview: 'Helpful',
    dislikeReview: 'Not helpful',
    confirmRemove: 'Remove this book from your shelf?',
    currentlyReadingStatusLabel: 'Currently Reading',
    wantToReadStatusLabel: 'Want to Read',
    alreadyReadStatusLabel: 'Already Read',
  },
  ar: {
    title: 'تفاصيل الكتاب',
    myShelf: 'رفي الخاص',
    loadingBook: 'جاري تحميل الكتاب…',
    goBack: 'العودة',
    bookNotFound: 'الكتاب غير موجود.',
    loadFailed: 'فشل تحميل الكتاب.',
    pages: '{{ n }} صفحة',
    pagesUnit: 'صفحة',
    byAuthor: 'بقلم',
    yourRating: 'تقييمك',
    ratingUnit: 'تقييم',
    ratingsUnit: 'تقييمات',
    recommendToFriend: 'أوصي به لصديق',
    noFriends: 'لا توجد أصدقاء حتى الآن.',
    recommendSent: 'تم الإرسال!',
    recommendFailed: 'فشل',
    recommendAlreadyHas: 'موجود بالفعل على رفّه',
    changeStatus: 'تغيير الحالة',
    removeFromShelf: 'إزالة من الرف',
    addToShelf: 'إضافة إلى الرف',
    adding: 'جاري الإضافة…',
    statusCurrentlyReading: 'قيد القراءة حالياً',
    statusWantToRead: 'أريد أن أقرأ',
    statusAlreadyRead: 'تمت قراءته بالفعل',
    aboutBook: 'نبذة عن هذا الكتاب',
    myNotes: 'ملاحظاتي',
    notesHint: 'خاصة — أنت فقط يمكنك رؤيتها',
    notesPlaceholder: 'أضف ملاحظاتك الخاصة حول هذا الكتاب…',
    saveNotes: 'حفظ الملاحظات',
    saving: 'جاري الحفظ…',
    saved: 'تم الحفظ!',
    myReview: 'تقييمي',
    reviewHint: 'مرئي لمجتمع ReadTrack',
    reviewPlaceholder: 'شارك أفكارك حول هذا الكتاب…',
    saveReview: 'حفظ التقييم',
    postReview: 'نشر التقييم',
    updateReview: 'تحديث التقييم',
    editReview: 'تعديل',
    cancelEdit: 'إلغاء',
    communityReviews: 'تقييمات المجتمع',
    likeReview: 'مفيد',
    dislikeReview: 'غير مفيد',
    confirmRemove: 'إزالة هذا الكتاب من رفك؟',
    currentlyReadingStatusLabel: 'قيد القراءة حالياً',
    wantToReadStatusLabel: 'أريد أن أقرأ',
    alreadyReadStatusLabel: 'تمت قراءته بالفعل',
  },
  fr: {
    title: 'Détails du livre',
    myShelf: 'Ma Bibliothèque',
    loadingBook: 'Chargement du livre…',
    goBack: 'Retour',
    bookNotFound: 'Livre introuvable.',
    loadFailed: 'Impossible de charger le livre.',
    pages: '{{ n }} pages',
    pagesUnit: 'pages',
    byAuthor: 'par',
    yourRating: 'Votre note',
    ratingUnit: 'évaluation',
    ratingsUnit: 'évaluations',
    recommendToFriend: 'Recommander à un ami',
    noFriends: 'Aucun ami pour le moment.',
    recommendSent: 'Envoyé !',
    recommendFailed: 'Échec',
    recommendAlreadyHas: 'Déjà dans sa bibliothèque',
    changeStatus: 'Modifier le statut',
    removeFromShelf: 'Supprimer de la bibliothèque',
    addToShelf: 'Ajouter à la bibliothèque',
    adding: 'Ajout en cours…',
    statusCurrentlyReading: 'En cours de lecture',
    statusWantToRead: 'À lire',
    statusAlreadyRead: 'Déjà lu',
    aboutBook: 'À propos de ce livre',
    myNotes: 'Mes notes',
    notesHint: 'Privé — seul vous pouvez les voir',
    notesPlaceholder: 'Ajoutez vos notes privées sur ce livre…',
    saveNotes: 'Enregistrer les notes',
    saving: 'Enregistrement en cours…',
    saved: 'Enregistré !',
    myReview: 'Mon avis',
    reviewHint: 'Visible par la communauté ReadTrack',
    reviewPlaceholder: 'Partagez vos réflexions sur ce livre…',
    saveReview: 'Enregistrer l\'avis',
    postReview: 'Publier l\'avis',
    updateReview: 'Mettre a jour l\'avis',
    editReview: 'Modifier',
    cancelEdit: 'Annuler',
    communityReviews: 'Avis de la communauté',
    likeReview: 'Utile',
    dislikeReview: 'Pas utile',
    confirmRemove: 'Supprimer ce livre de votre bibliothèque ?',
    currentlyReadingStatusLabel: 'En cours de lecture',
    wantToReadStatusLabel: 'À lire',
    alreadyReadStatusLabel: 'Déjà lu',
  },
};
