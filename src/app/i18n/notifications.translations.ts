import { LanguageCode } from './language.model';

export interface NotificationsCopy {
  panelTitle: string;
  notificationsPanelTitle: string;
  markAllRead: string;
  markAllReadBtn: string;
  loading: string;
  loadingMsg: string;
  emptyState: string;
  noNotificationsMsg: string;
  loadErrorMsg: string;
  retryBtn: string;
  interactedWithYou: string;
  friendRequestSent: string;
  friendRequestAccepted: string;
  bookRecommended: string;
  postLiked: string;
  postCommented: string;
  commentLiked: string;
  commentReply: string;
  reviewLiked: string;
  newPost: string;
  acceptBtn: string;
  declineBtn: string;
  dismissAriaLabel: string;
}

export const NOTIFICATIONS_COPY: Record<LanguageCode, NotificationsCopy> = {
  en: {
    panelTitle: 'Notifications',
    notificationsPanelTitle: 'Notifications',
    markAllRead: 'Mark all read',
    markAllReadBtn: 'Mark all as read',
    loading: 'Loading…',
    loadingMsg: 'Loading…',
    emptyState: 'No notifications yet',
    noNotificationsMsg: 'No notifications yet',
    loadErrorMsg: "Couldn't load notifications",
    retryBtn: 'Try again',
    interactedWithYou: 'interacted with you',
    friendRequestSent: 'sent you a friend request',
    friendRequestAccepted: 'accepted your friend request',
    bookRecommended: 'recommended a book to you',
    postLiked: 'liked your post',
    postCommented: 'commented on your post',
    commentLiked: 'liked your comment',
    commentReply: 'replied to your comment',
    reviewLiked: 'liked your review',
    newPost: 'shared a new post',
    acceptBtn: 'Accept',
    declineBtn: 'Decline',
    dismissAriaLabel: 'Dismiss notification',
  },
  ar: {
    panelTitle: 'الإشعارات',
    notificationsPanelTitle: 'الإشعارات',
    markAllRead: 'وضع علامة على الكل كمقروء',
    markAllReadBtn: 'وضع علامة على الكل كمقروء',
    loading: 'جاري التحميل…',
    loadingMsg: 'جاري التحميل…',
    emptyState: 'لا توجد إشعارات حتى الآن',
    noNotificationsMsg: 'لا توجد إشعارات حتى الآن',
    loadErrorMsg: 'تعذّر تحميل الإشعارات',
    retryBtn: 'حاول مرة أخرى',
    interactedWithYou: 'تفاعل معك',
    friendRequestSent: 'أرسل لك طلب صداقة',
    friendRequestAccepted: 'قَبِل طلب صداقتك',
    bookRecommended: 'أوصى بكتاب لك',
    postLiked: 'أعجب بمنشورك',
    postCommented: 'علق على منشورك',
    commentLiked: 'أعجب بتعليقك',
    commentReply: 'رد على تعليقك',
    reviewLiked: 'أعجب بتقييمك',
    newPost: 'شارك منشور جديد',
    acceptBtn: 'قبول',
    declineBtn: 'رفض',
    dismissAriaLabel: 'تجاهل الإشعار',
  },
  fr: {
    panelTitle: 'Notifications',
    notificationsPanelTitle: 'Notifications',
    markAllRead: 'Marquer tout comme lu',
    markAllReadBtn: 'Marquer tout comme lu',
    loading: 'Chargement…',
    loadingMsg: 'Chargement…',
    emptyState: 'Aucune notification pour le moment',
    noNotificationsMsg: 'Aucune notification pour le moment',
    loadErrorMsg: 'Impossible de charger les notifications',
    retryBtn: 'Réessayer',
    interactedWithYou: 'a interagi avec vous',
    friendRequestSent: 'vous a envoyé une demande d\'amitié',
    friendRequestAccepted: 'a accepté votre demande d\'amitié',
    bookRecommended: 'a recommandé un livre pour vous',
    postLiked: 'a aimé votre message',
    postCommented: 'a commenté votre message',
    commentLiked: 'a aimé votre commentaire',
    commentReply: 'a répondu à votre commentaire',
    reviewLiked: 'a aimé votre avis',
    newPost: 'a partagé un nouveau message',
    acceptBtn: 'Accepter',
    declineBtn: 'Refuser',
    dismissAriaLabel: 'Ignorer la notification',
  },
};
