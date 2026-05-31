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
  },
};
