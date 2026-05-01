export type AuthMode = 'login' | 'signup';
export type LanguageCode = 'en' | 'ar' | 'fr';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
}

export interface AuthCopy {
  languageLabel: string;
  brandKicker: string;
  loginEyebrow: string;
  signupEyebrow: string;
  loginTitle: string;
  signupTitle: string;
  loginDescription: string;
  signupDescription: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  loginButton: string;
  signupButton: string;
  loggingIn: string;
  creatingAccount: string;
  divider: string;
  googleLogin: string;
  googleSignup: string;
  newToReadTrack: string;
  alreadyHaveAccount: string;
  loginLink: string;
  signupLink: string;
  showPassword: string;
  hidePassword: string;
  requiredFields: string;
  enterEmailFirst: string;
  resetSent: string;
  connected: string;
  genericError: string;
  resetError: string;
  googleError: string;
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
];

export const AUTH_COPY_BY_LANGUAGE: Record<LanguageCode, AuthCopy> = {
  en: {
    languageLabel: 'Change language',
    brandKicker: 'Reading platform',
    loginEyebrow: 'Welcome back to your reading journey',
    signupEyebrow: 'Start your reading journey',
    loginTitle: 'Log in to continue tracking books',
    signupTitle: 'Sign up to start tracking books',
    loginDescription: 'Save your progress, rate your latest reads, and join conversations with readers in Arabic, English, and French.',
    signupDescription: 'Create your reader profile, save your first shelf, and join conversations with readers in Arabic, English, and French.',
    nameLabel: 'Name',
    namePlaceholder: 'Your reading name',
    emailLabel: 'Email Address',
    emailPlaceholder: 'hello@readtrack.app',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    forgotPassword: 'Forgot Password?',
    loginButton: 'Log In',
    signupButton: 'Create Account',
    loggingIn: 'Logging in...',
    creatingAccount: 'Creating account...',
    divider: 'Or continue with',
    googleLogin: 'Log In with Google',
    googleSignup: 'Sign Up with Google',
    newToReadTrack: 'New to ReadTrack?',
    alreadyHaveAccount: 'Already have an account?',
    loginLink: 'Log In',
    signupLink: 'Sign Up',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    requiredFields: 'Please complete the required fields.',
    enterEmailFirst: 'Enter your email address first.',
    resetSent: 'Password reset link sent. Check your inbox.',
    connected: 'Logged in. Your ReadTrack account is connected.',
    genericError: 'Something went wrong. Please try again.',
    resetError: 'Could not send a password reset email.',
    googleError: 'Could not start Google sign-in.',
  },
  ar: {
    languageLabel: 'تغيير اللغة',
    brandKicker: 'منصة قراءة',
    loginEyebrow: 'مرحبا بعودتك إلى رحلة القراءة',
    signupEyebrow: 'ابدأ رحلة القراءة الخاصة بك',
    loginTitle: 'سجل الدخول لمتابعة تتبع الكتب',
    signupTitle: 'أنشئ حسابا لبدء تتبع الكتب',
    loginDescription: 'احفظ تقدمك، قيّم آخر قراءاتك، وشارك في نقاشات مع قراء بالعربية والإنجليزية والفرنسية.',
    signupDescription: 'أنشئ ملفك كقارئ، احفظ أول رف كتب لك، وشارك في نقاشات مع قراء بالعربية والإنجليزية والفرنسية.',
    nameLabel: 'الاسم',
    namePlaceholder: 'اسمك كقارئ',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'hello@readtrack.app',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    loginButton: 'تسجيل الدخول',
    signupButton: 'إنشاء حساب',
    loggingIn: 'جار تسجيل الدخول...',
    creatingAccount: 'جار إنشاء الحساب...',
    divider: 'أو تابع باستخدام',
    googleLogin: 'تسجيل الدخول عبر Google',
    googleSignup: 'التسجيل عبر Google',
    newToReadTrack: 'جديد على ReadTrack؟',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    loginLink: 'تسجيل الدخول',
    signupLink: 'إنشاء حساب',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    requiredFields: 'يرجى إكمال الحقول المطلوبة.',
    enterEmailFirst: 'أدخل بريدك الإلكتروني أولا.',
    resetSent: 'تم إرسال رابط إعادة تعيين كلمة المرور. تحقق من بريدك.',
    connected: 'تم تسجيل الدخول. حساب ReadTrack متصل.',
    genericError: 'حدث خطأ ما. حاول مرة أخرى.',
    resetError: 'تعذر إرسال بريد إعادة تعيين كلمة المرور.',
    googleError: 'تعذر بدء تسجيل الدخول عبر Google.',
  },
  fr: {
    languageLabel: 'Changer de langue',
    brandKicker: 'Plateforme de lecture',
    loginEyebrow: 'Bon retour dans votre parcours de lecture',
    signupEyebrow: 'Commencez votre parcours de lecture',
    loginTitle: 'Connectez-vous pour continuer a suivre vos livres',
    signupTitle: 'Creez un compte pour suivre vos livres',
    loginDescription: 'Enregistrez votre progression, notez vos dernieres lectures et rejoignez des conversations avec des lecteurs en arabe, anglais et francais.',
    signupDescription: 'Creez votre profil de lecteur, enregistrez votre premiere etagere et rejoignez des conversations avec des lecteurs en arabe, anglais et francais.',
    nameLabel: 'Nom',
    namePlaceholder: 'Votre nom de lecteur',
    emailLabel: 'Adresse e-mail',
    emailPlaceholder: 'hello@readtrack.app',
    passwordLabel: 'Mot de passe',
    passwordPlaceholder: 'Entrez votre mot de passe',
    forgotPassword: 'Mot de passe oublie ?',
    loginButton: 'Connexion',
    signupButton: 'Creer un compte',
    loggingIn: 'Connexion...',
    creatingAccount: 'Creation du compte...',
    divider: 'Ou continuer avec',
    googleLogin: 'Connexion avec Google',
    googleSignup: 'Inscription avec Google',
    newToReadTrack: 'Nouveau sur ReadTrack ?',
    alreadyHaveAccount: 'Vous avez deja un compte ?',
    loginLink: 'Connexion',
    signupLink: 'Inscription',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    requiredFields: 'Veuillez remplir les champs obligatoires.',
    enterEmailFirst: 'Saisissez d abord votre adresse e-mail.',
    resetSent: 'Lien de reinitialisation envoye. Verifiez votre boite de reception.',
    connected: 'Connexion reussie. Votre compte ReadTrack est connecte.',
    genericError: 'Une erreur est survenue. Veuillez reessayer.',
    resetError: 'Impossible d envoyer l e-mail de reinitialisation.',
    googleError: 'Impossible de demarrer la connexion Google.',
  },
};
