export type LanguageCode = 'en' | 'ar' | 'fr';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
}
