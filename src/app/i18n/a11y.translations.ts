import { LanguageCode } from './language.model';

// Shared accessibility labels (aria-label / alt) used across multiple pages.
// These aren't visually rendered but are read by screen readers, so they're
// localized too for a complete i18n pass.
export interface A11yCopy {
  goBack: string;
  goHome: string;
  close: string;
  clear: string;
  removeBook: string;
  deletePost: string;
  profileAlt: string;
  youAlt: string;
}

export const A11Y_COPY: Record<LanguageCode, A11yCopy> = {
  en: {
    goBack: 'Go back',
    goHome: 'Go home',
    close: 'Close',
    clear: 'Clear',
    removeBook: 'Remove book',
    deletePost: 'Delete post',
    profileAlt: 'Profile',
    youAlt: 'You',
  },
  ar: {
    goBack: 'رجوع',
    goHome: 'الذهاب إلى الرئيسية',
    close: 'إغلاق',
    clear: 'مسح',
    removeBook: 'إزالة الكتاب',
    deletePost: 'حذف المنشور',
    profileAlt: 'الملف الشخصي',
    youAlt: 'أنت',
  },
  fr: {
    goBack: 'Retour',
    goHome: 'Accueil',
    close: 'Fermer',
    clear: 'Effacer',
    removeBook: 'Retirer le livre',
    deletePost: 'Supprimer la publication',
    profileAlt: 'Profil',
    youAlt: 'Vous',
  },
};
