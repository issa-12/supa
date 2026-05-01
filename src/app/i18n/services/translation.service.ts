import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AUTH_COPY_BY_LANGUAGE, AuthCopy } from '../auth.translations';
import { LanguageCode } from '../language.model';

type TranslationDictionary = Record<string, unknown>;
type TranslationStore = Record<LanguageCode, TranslationDictionary>;

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private currentLanguage$ = new BehaviorSubject<LanguageCode>(
    this.getInitialLanguage(),
  );
  private translations: TranslationStore = {
    en: { auth: AUTH_COPY_BY_LANGUAGE.en },
    ar: { auth: AUTH_COPY_BY_LANGUAGE.ar },
    fr: { auth: AUTH_COPY_BY_LANGUAGE.fr },
  };

  getCurrentLanguage(): LanguageCode {
    return this.currentLanguage$.value;
  }

  getCurrentLanguage$(): Observable<LanguageCode> {
    return this.currentLanguage$.asObservable();
  }

  setLanguage(language: LanguageCode): void {
    this.currentLanguage$.next(language);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('selectedLanguage', language);
    }
  }

  getTranslation(key: string, language?: LanguageCode): string {
    const lang = language || this.currentLanguage$.value;
    const keys = key.split('.');

    let value: unknown = this.translations[lang];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  getAuth(key: keyof AuthCopy): string {
    return this.getTranslation(`auth.${String(key)}`);
  }

  private getInitialLanguage(): LanguageCode {
    if (typeof localStorage === 'undefined') {
      return 'en';
    }
    return (localStorage.getItem('selectedLanguage') as LanguageCode | null) ?? 'en';
  }
}
