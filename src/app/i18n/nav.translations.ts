import { LanguageCode } from './language.model';

export interface NavCopy {
  searchPlaceholder: string;
  searchingState: string;
  searchNoResults: string;
  searchSectionPeople: string;
  searchSectionBooks: string;
  searchSeeAll: string;
  homeAriaLabel: string;
  myShelfAriaLabel: string;
  communityAriaLabel: string;
  statsAriaLabel: string;
  notificationsAriaLabel: string;
  myProfile: string;
  apiKeys: string;
  logout: string;
  languageLabel: string;
  profileAvatarAlt: string;
}

export const NAV_COPY: Record<LanguageCode, NavCopy> = {
  en: {
    searchPlaceholder: 'Search books or users…',
    searchingState: 'Searching…',
    searchNoResults: 'No results for "{{ query }}"',
    searchSectionPeople: 'People',
    searchSectionBooks: 'Books',
    searchSeeAll: 'See all book results',
    homeAriaLabel: 'Home',
    myShelfAriaLabel: 'My Shelf',
    communityAriaLabel: 'Community',
    statsAriaLabel: 'Stats',
    notificationsAriaLabel: 'Notifications',
    myProfile: 'My Profile',
    apiKeys: 'API Keys',
    logout: 'Logout',
    languageLabel: 'Change language',
    profileAvatarAlt: 'Profile',
  },
  ar: {
    searchPlaceholder: 'ابحث عن الكتب أو المستخدمين…',
    searchingState: 'جاري البحث…',
    searchNoResults: 'لا توجد نتائج لـ "{{ query }}"',
    searchSectionPeople: 'الأشخاص',
    searchSectionBooks: 'الكتب',
    searchSeeAll: 'شاهد جميع نتائج البحث عن الكتب',
    homeAriaLabel: 'الرئيسية',
    myShelfAriaLabel: 'رفي الخاص',
    communityAriaLabel: 'المجتمع',
    statsAriaLabel: 'الإحصائيات',
    notificationsAriaLabel: 'الإشعارات',
    myProfile: 'ملفي الشخصي',
    apiKeys: 'مفاتيح API',
    logout: 'تسجيل الخروج',
    languageLabel: 'تغيير اللغة',
    profileAvatarAlt: 'الملف الشخصي',
  },
  fr: {
    searchPlaceholder: 'Rechercher des livres ou des utilisateurs…',
    searchingState: 'Recherche en cours…',
    searchNoResults: 'Aucun résultat pour "{{ query }}"',
    searchSectionPeople: 'Personnes',
    searchSectionBooks: 'Livres',
    searchSeeAll: 'Afficher tous les résultats de livres',
    homeAriaLabel: 'Accueil',
    myShelfAriaLabel: 'Ma Bibliothèque',
    communityAriaLabel: 'Communauté',
    statsAriaLabel: 'Statistiques',
    notificationsAriaLabel: 'Notifications',
    myProfile: 'Mon Profil',
    apiKeys: 'Clés API',
    logout: 'Déconnexion',
    languageLabel: 'Changer de langue',
    profileAvatarAlt: 'Profil',
  },
};
