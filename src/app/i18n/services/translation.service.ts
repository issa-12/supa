import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AUTH_COPY_BY_LANGUAGE, AuthCopy } from '../auth.translations';
import { NAV_COPY, NavCopy } from '../nav.translations';
import { HOME_COPY, HomeCopy } from '../home.translations';
import { NOTIFICATIONS_COPY, NotificationsCopy } from '../notifications.translations';
import { COMMENTS_COPY, CommentsCopy } from '../comments.translations';
import { PROFILE_COPY, ProfileCopy } from '../profile.translations';
import { SHELF_COPY, ShelfCopy } from '../shelf.translations';
import { BOOK_SEARCH_COPY, BookSearchCopy } from '../bookSearch.translations';
import { BOOK_DETAIL_COPY, BookDetailCopy } from '../bookDetail.translations';
import { STATS_COPY, StatsCopy } from '../stats.translations';
import { COMMUNITY_COPY, CommunityCopy } from '../community.translations';
import { ONBOARDING_COPY, OnboardingCopy } from '../onboarding.translations';
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
    en: {
      auth: AUTH_COPY_BY_LANGUAGE.en,
      nav: NAV_COPY.en,
      home: HOME_COPY.en,
      notifications: NOTIFICATIONS_COPY.en,
      comments: COMMENTS_COPY.en,
      profile: PROFILE_COPY.en,
      shelf: SHELF_COPY.en,
      bookSearch: BOOK_SEARCH_COPY.en,
      bookDetail: BOOK_DETAIL_COPY.en,
      stats: STATS_COPY.en,
      community: COMMUNITY_COPY.en,
      onboarding: ONBOARDING_COPY.en,
    },
    ar: {
      auth: AUTH_COPY_BY_LANGUAGE.ar,
      nav: NAV_COPY.ar,
      home: HOME_COPY.ar,
      notifications: NOTIFICATIONS_COPY.ar,
      comments: COMMENTS_COPY.ar,
      profile: PROFILE_COPY.ar,
      shelf: SHELF_COPY.ar,
      bookSearch: BOOK_SEARCH_COPY.ar,
      bookDetail: BOOK_DETAIL_COPY.ar,
      stats: STATS_COPY.ar,
      community: COMMUNITY_COPY.ar,
      onboarding: ONBOARDING_COPY.ar,
    },
    fr: {
      auth: AUTH_COPY_BY_LANGUAGE.fr,
      nav: NAV_COPY.fr,
      home: HOME_COPY.fr,
      notifications: NOTIFICATIONS_COPY.fr,
      comments: COMMENTS_COPY.fr,
      profile: PROFILE_COPY.fr,
      shelf: SHELF_COPY.fr,
      bookSearch: BOOK_SEARCH_COPY.fr,
      bookDetail: BOOK_DETAIL_COPY.fr,
      stats: STATS_COPY.fr,
      community: COMMUNITY_COPY.fr,
      onboarding: ONBOARDING_COPY.fr,
    },
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

  getNav(key: keyof NavCopy): string {
    return this.getTranslation(`nav.${String(key)}`);
  }

  getHome(key: keyof HomeCopy): string {
    return this.getTranslation(`home.${String(key)}`);
  }

  getNotifications(key: keyof NotificationsCopy): string {
    return this.getTranslation(`notifications.${String(key)}`);
  }

  getComments(key: keyof CommentsCopy): string {
    return this.getTranslation(`comments.${String(key)}`);
  }

  getProfile(key: keyof ProfileCopy): string {
    return this.getTranslation(`profile.${String(key)}`);
  }

  getShelf(key: keyof ShelfCopy): string {
    return this.getTranslation(`shelf.${String(key)}`);
  }

  getBookSearch(key: keyof BookSearchCopy): string {
    return this.getTranslation(`bookSearch.${String(key)}`);
  }

  getBookDetail(key: keyof BookDetailCopy): string {
    return this.getTranslation(`bookDetail.${String(key)}`);
  }

  getStats(key: keyof StatsCopy): string {
    return this.getTranslation(`stats.${String(key)}`);
  }

  getCommunity(key: keyof CommunityCopy): string {
    return this.getTranslation(`community.${String(key)}`);
  }

  getOnboarding(key: keyof OnboardingCopy): string {
    return this.getTranslation(`onboarding.${String(key)}`);
  }

  private getInitialLanguage(): LanguageCode {
    if (typeof localStorage === 'undefined') {
      return 'en';
    }
    return (localStorage.getItem('selectedLanguage') as LanguageCode | null) ?? 'en';
  }
}
