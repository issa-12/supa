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
  logout: string;
  languageLabel: string;
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
    logout: 'Logout',
    languageLabel: 'Change language',
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
    logout: 'تسجيل الخروج',
    languageLabel: 'تغيير اللغة',
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
    logout: 'Déconnexion',
    languageLabel: 'Changer de langue',
  },
};
