import { LanguageCode } from './language.model';

export interface AppCopy {
  offlineBanner: string;
  unknownUser: string;
  defaultReader: string;
  footerPrivacy: string;
  footerTerms: string;
  footerRights: string;
}

export const APP_COPY: Record<LanguageCode, AppCopy> = {
  en: {
    offlineBanner: 'You are offline — some features may not be available',
    unknownUser: 'Unknown User',
    defaultReader: 'ReadTrack Reader',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms of Service',
    footerRights: 'All rights reserved.',
  },
  ar: {
    offlineBanner: 'أنت غير متصل — قد لا تتوفر بعض الميزات',
    unknownUser: 'مستخدم غير معروف',
    defaultReader: 'قارئ ReadTrack',
    footerPrivacy: 'سياسة الخصوصية',
    footerTerms: 'شروط الخدمة',
    footerRights: 'جميع الحقوق محفوظة.',
  },
  fr: {
    offlineBanner: 'Vous êtes hors ligne — certaines fonctionnalités peuvent être indisponibles',
    unknownUser: 'Utilisateur inconnu',
    defaultReader: 'Lecteur ReadTrack',
    footerPrivacy: 'Politique de confidentialité',
    footerTerms: 'Conditions d\'utilisation',
    footerRights: 'Tous droits réservés.',
  },
};
