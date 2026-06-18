import { LanguageCode } from './language.model';

export interface CommentsCopy {
  inputPlaceholder: string;
  commentPlaceholder: string;
  replyPlaceholder: string;
  replyToPlaceholder: string;
  replyButton: string;
  replyBtn: string;
  deleteButton: string;
  deleteBtn: string;
  contentRejected: string;
  commentFailed: string;
}

export const COMMENTS_COPY: Record<LanguageCode, CommentsCopy> = {
  en: {
    inputPlaceholder: 'Write a comment…',
    commentPlaceholder: 'Write a comment…',
    replyPlaceholder: 'Reply to {{ name }}…',
    replyToPlaceholder: 'Reply to ',
    replyButton: 'Reply',
    replyBtn: 'Reply',
    deleteButton: 'Delete',
    deleteBtn: 'Delete',
    contentRejected: 'Your comment was flagged by our community guidelines and can\'t be posted.',
    commentFailed: 'Could not post comment. Please try again.',
  },
  ar: {
    inputPlaceholder: 'اكتب تعليق…',
    commentPlaceholder: 'اكتب تعليق…',
    replyPlaceholder: 'رد على {{ name }}…',
    replyToPlaceholder: 'رد على ',
    replyButton: 'رد',
    replyBtn: 'رد',
    deleteButton: 'حذف',
    deleteBtn: 'حذف',
    contentRejected: 'تم تمييز تعليقك بواسطة إرشادات المجتمع ولا يمكن نشره.',
    commentFailed: 'تعذّر نشر التعليق. حاول مرة أخرى.',
  },
  fr: {
    inputPlaceholder: 'Écrire un commentaire…',
    commentPlaceholder: 'Écrire un commentaire…',
    replyPlaceholder: 'Répondre à {{ name }}…',
    replyToPlaceholder: 'Répondre à ',
    replyButton: 'Répondre',
    replyBtn: 'Répondre',
    deleteButton: 'Supprimer',
    deleteBtn: 'Supprimer',
    contentRejected: 'Votre commentaire a été signalé par nos règles communautaires et ne peut pas être publié.',
    commentFailed: 'Impossible de publier le commentaire. Veuillez réessayer.',
  },
};
