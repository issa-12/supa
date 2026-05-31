import { LanguageCode } from './language.model';

export interface BookDetailCopy {
  title: string;
  myShelf: string;
  loadingBook: string;
  goBack: string;
  pages: string;
  pagesUnit: string;
  byAuthor: string;
  yourRating: string;
  recommendToFriend: string;
  noFriends: string;
  recommendSent: string;
  recommendFailed: string;
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
  communityReviews: string;
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
    pages: '{{ n }} pages',
    pagesUnit: 'pages',
    byAuthor: 'by',
    yourRating: 'Your Rating',
    recommendToFriend: 'Recommend to Friend',
    noFriends: 'No friends yet.',
    recommendSent: 'Sent!',
    recommendFailed: 'Failed',
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
    reviewHint: 'Visible to your friends',
    reviewPlaceholder: 'Share your thoughts about this book…',
    saveReview: 'Save Review',
    communityReviews: 'Community Reviews',
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
    pages: '{{ n }} صفحة',
    pagesUnit: 'صفحة',
    byAuthor: 'بقلم',
    yourRating: 'تقييمك',
    recommendToFriend: 'أوصي به لصديق',
    noFriends: 'لا توجد أصدقاء حتى الآن.',
    recommendSent: 'تم الإرسال!',
    recommendFailed: 'فشل',
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
    reviewHint: 'مرئي لأصدقائك',
    reviewPlaceholder: 'شارك أفكارك حول هذا الكتاب…',
    saveReview: 'حفظ التقييم',
    communityReviews: 'تقييمات المجتمع',
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
    pages: '{{ n }} pages',
    pagesUnit: 'pages',
    byAuthor: 'par',
    yourRating: 'Votre note',
    recommendToFriend: 'Recommander à un ami',
    noFriends: 'Aucun ami pour le moment.',
    recommendSent: 'Envoyé !',
    recommendFailed: 'Échec',
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
    reviewHint: 'Visible par vos amis',
    reviewPlaceholder: 'Partagez vos réflexions sur ce livre…',
    saveReview: 'Enregistrer l\'avis',
    communityReviews: 'Avis de la communauté',
    confirmRemove: 'Supprimer ce livre de votre bibliothèque ?',
    currentlyReadingStatusLabel: 'En cours de lecture',
    wantToReadStatusLabel: 'À lire',
    alreadyReadStatusLabel: 'Déjà lu',
  },
};
