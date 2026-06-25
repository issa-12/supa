import { LanguageCode } from './language.model';

export interface AppCopy {
  offlineBanner: string;
  unknownUser: string;
  defaultReader: string;
}

export const APP_COPY: Record<LanguageCode, AppCopy> = {
  en: {
    offlineBanner: 'You are offline — some features may not be available',
    unknownUser: 'Unknown User',
    defaultReader: 'ReadTrack Reader',
  },
  ar: {
    offlineBanner: 'أنت غير متصل — قد لا تتوفر بعض الميزات',
    unknownUser: 'مستخدم غير معروف',
    defaultReader: 'قارئ ReadTrack',
  },
  fr: {
    offlineBanner: 'Vous êtes hors ligne — certaines fonctionnalités peuvent être indisponibles',
    unknownUser: 'Utilisateur inconnu',
    defaultReader: 'Lecteur ReadTrack',
  },
};
