import { LanguageCode } from './language.model';

export interface VerificationCopy {
  brandKicker: string;
  brandHomeLabel: string;
  badge: string;
  title: string; // contains {count}
  sentCodePrefix: string;
  sentCodeSuffix: string;
  yourEmailFallback: string;
  formAriaLabel: string;
  codeInputsAriaLabel: string; // contains {count}
  digitLabel: string;
  verifyingBtn: string;
  verifyBtn: string;
  resendPrompt: string;
  resendBtn: string;
  // dynamic status / error messages
  emailMissing: string;
  enterCode: string; // contains {count}
  verifiedRedirect: string;
  verifyFailed: string;
  codeResent: string;
  resendFailed: string;
}

export const VERIFICATION_COPY: Record<LanguageCode, VerificationCopy> = {
  en: {
    brandKicker: 'Reading platform',
    brandHomeLabel: 'ReadTrack home',
    badge: 'Email verification',
    title: 'Enter your {count}-digit code',
    sentCodePrefix: 'We sent a code to',
    sentCodeSuffix: 'Use the latest code from your inbox.',
    yourEmailFallback: 'your email address',
    formAriaLabel: 'Verify email',
    codeInputsAriaLabel: '{count}-digit verification code',
    digitLabel: 'Digit',
    verifyingBtn: 'Verifying...',
    verifyBtn: 'Verify Email',
    resendPrompt: "Didn't receive the code?",
    resendBtn: 'Resend',
    emailMissing: 'Email address is missing. Start sign up again.',
    enterCode: 'Enter the {count}-digit code from your email.',
    verifiedRedirect: 'Email verified. Redirecting to your home page...',
    verifyFailed: 'Could not verify this code.',
    codeResent: 'A new verification code was sent.',
    resendFailed: 'Could not resend the verification code.',
  },
  ar: {
    brandKicker: 'منصة قراءة',
    brandHomeLabel: 'الصفحة الرئيسية لـ ReadTrack',
    badge: 'تأكيد البريد الإلكتروني',
    title: 'أدخل الرمز المكوّن من {count} أرقام',
    sentCodePrefix: 'أرسلنا رمزًا إلى',
    sentCodeSuffix: 'استخدم أحدث رمز من بريدك.',
    yourEmailFallback: 'بريدك الإلكتروني',
    formAriaLabel: 'تأكيد البريد الإلكتروني',
    codeInputsAriaLabel: 'رمز تحقق مكوّن من {count} أرقام',
    digitLabel: 'الرقم',
    verifyingBtn: 'جارٍ التحقق...',
    verifyBtn: 'تأكيد البريد',
    resendPrompt: 'لم يصلك الرمز؟',
    resendBtn: 'إعادة الإرسال',
    emailMissing: 'عنوان البريد الإلكتروني مفقود. ابدأ التسجيل من جديد.',
    enterCode: 'أدخل الرمز المكوّن من {count} أرقام من بريدك.',
    verifiedRedirect: 'تم تأكيد البريد. جارٍ التوجيه إلى صفحتك الرئيسية...',
    verifyFailed: 'تعذّر التحقق من هذا الرمز.',
    codeResent: 'تم إرسال رمز تحقق جديد.',
    resendFailed: 'تعذّر إعادة إرسال رمز التحقق.',
  },
  fr: {
    brandKicker: 'Plateforme de lecture',
    brandHomeLabel: 'Accueil ReadTrack',
    badge: 'Verification de l e-mail',
    title: 'Saisissez votre code a {count} chiffres',
    sentCodePrefix: 'Nous avons envoye un code a',
    sentCodeSuffix: 'Utilisez le dernier code recu dans votre boite mail.',
    yourEmailFallback: 'votre adresse e-mail',
    formAriaLabel: 'Verifier l e-mail',
    codeInputsAriaLabel: 'Code de verification a {count} chiffres',
    digitLabel: 'Chiffre',
    verifyingBtn: 'Verification...',
    verifyBtn: 'Verifier l e-mail',
    resendPrompt: 'Vous n avez pas recu le code ?',
    resendBtn: 'Renvoyer',
    emailMissing: 'Adresse e-mail manquante. Recommencez l inscription.',
    enterCode: 'Saisissez le code a {count} chiffres recu par e-mail.',
    verifiedRedirect: 'E-mail verifie. Redirection vers votre accueil...',
    verifyFailed: 'Impossible de verifier ce code.',
    codeResent: 'Un nouveau code de verification a ete envoye.',
    resendFailed: 'Impossible de renvoyer le code de verification.',
  },
};
