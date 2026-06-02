import { LanguageCode } from './language.model';

export interface OnboardingCopy {
  title: string;
  onboardingTitle: string;
  subtitle: string;
  onboardingSubtitle: string;
  loadingGenres: string;
  loadingGenresMsg: string;
  tryAgain: string;
  tryAgainBtn: string;
  continueButton: string;
  continueBtn: string;
  saving: string;
  savingMsg: string;
  selectionHint: string;
  errorLoadGenres: string;
  errorSelectGenre: string;
  errorSave: string;
  couldNotLoadGenresMsg: string;
}

export const ONBOARDING_COPY: Record<LanguageCode, OnboardingCopy> = {
  en: {
    title: 'What do you love to read?',
    onboardingTitle: 'What do you love to read?',
    subtitle: 'Pick at least one genre so we can personalise your recommendations.',
    onboardingSubtitle: 'Pick at least one genre so we can personalise your recommendations.',
    loadingGenres: 'Loading genres…',
    loadingGenresMsg: 'Loading genres…',
    tryAgain: 'Try again',
    tryAgainBtn: 'Try again',
    continueButton: 'Continue',
    continueBtn: 'Continue',
    saving: 'Saving…',
    savingMsg: 'Saving…',
    selectionHint: '{{ n }} genre(s) selected',
    errorLoadGenres: 'Could not load genres. Please refresh.',
    errorSelectGenre: 'Please select at least one genre.',
    errorSave: 'Failed to save genres. Please try again.',
    couldNotLoadGenresMsg: 'Could not load genres. Please refresh.',
  },
  ar: {
    title: 'ما الذي تحب قراءته؟',
    onboardingTitle: 'ما الذي تحب قراءته؟',
    subtitle: 'اختر نوعاً واحداً على الأقل حتى نتمكن من تخصيص التوصيات لك.',
    onboardingSubtitle: 'اختر نوعاً واحداً على الأقل حتى نتمكن من تخصيص التوصيات لك.',
    loadingGenres: 'جاري تحميل الأنواع…',
    loadingGenresMsg: 'جاري تحميل الأنواع…',
    tryAgain: 'حاول مرة أخرى',
    tryAgainBtn: 'حاول مرة أخرى',
    continueButton: 'متابعة',
    continueBtn: 'متابعة',
    saving: 'جاري الحفظ…',
    savingMsg: 'جاري الحفظ…',
    selectionHint: '{{ n }} نوع مختار',
    errorLoadGenres: 'تعذر تحميل الأنواع. يرجى تحديث الصفحة.',
    errorSelectGenre: 'يرجى تحديد نوع واحد على الأقل.',
    errorSave: 'فشل حفظ الأنواع. حاول مرة أخرى.',
    couldNotLoadGenresMsg: 'تعذر تحميل الأنواع. يرجى تحديث الصفحة.',
  },
  fr: {
    title: 'Qu\'aimez-vous lire ?',
    onboardingTitle: 'Qu\'aimez-vous lire ?',
    subtitle: 'Choisissez au moins un genre pour que nous puissions personnaliser vos recommandations.',
    onboardingSubtitle: 'Choisissez au moins un genre pour que nous puissions personnaliser vos recommandations.',
    loadingGenres: 'Chargement des genres…',
    loadingGenresMsg: 'Chargement des genres…',
    tryAgain: 'Réessayer',
    tryAgainBtn: 'Réessayer',
    continueButton: 'Continuer',
    continueBtn: 'Continuer',
    saving: 'Enregistrement en cours…',
    savingMsg: 'Enregistrement en cours…',
    selectionHint: '{{ n }} genre(s) sélectionné(s)',
    errorLoadGenres: 'Impossible de charger les genres. Veuillez actualiser.',
    errorSelectGenre: 'Veuillez sélectionner au moins un genre.',
    errorSave: 'Impossible d\'enregistrer les genres. Veuillez réessayer.',
    couldNotLoadGenresMsg: 'Impossible de charger les genres. Veuillez actualiser.',
  },
};
