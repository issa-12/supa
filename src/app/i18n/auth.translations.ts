import { LanguageCode } from './language.model';

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
  emailInvalid: string;
  passwordPolicy: string;
  passwordHint: string;
  emailExists: string;
  invalidCredentials: string;
  emailNotVerified: string;
  enterEmailFirst: string;
  resetSent: string;
  connected: string;
  genericError: string;
  resetError: string;
  googleError: string;
}

export const AUTH_COPY_BY_LANGUAGE: Record<LanguageCode, AuthCopy> = {
  en: {
    languageLabel: 'Change language',
    brandKicker: 'Reading platform',
    loginEyebrow: 'Welcome back to your reading journey',
    signupEyebrow: 'Start your reading journey',
    loginTitle: 'Log in to continue tracking books',
    signupTitle: 'Sign up to start tracking books',
    loginDescription: 'Track your reading progress and connect with readers worldwide.',
    signupDescription: 'Create your reader profile and start building your digital shelf.',
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
    emailInvalid: 'Please enter a valid email address (e.g. you@example.com).',
    passwordPolicy: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.',
    passwordHint: 'At least 8 characters, with an uppercase letter, a lowercase letter, and a number.',
    emailExists: 'An account with this email already exists. Log in or reset your password instead.',
    invalidCredentials: 'Incorrect email or password. Please try again.',
    emailNotVerified: 'Please verify your email before logging in.',
    enterEmailFirst: 'Enter your email address first.',
    resetSent: 'If an account exists for that email, a password reset link is on its way. Check your inbox.',
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
    loginDescription: 'تابع تقدمك في القراءة وتواصل مع قراء من حول العالم.',
    signupDescription: 'أنشئ ملفك كقارئ وابدأ ببناء رفك الرقمي.',
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
    emailInvalid: 'يرجى إدخال عنوان بريد إلكتروني صالح (مثال: you@example.com).',
    passwordPolicy: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل وتتضمن حرفًا كبيرًا وحرفًا صغيرًا ورقمًا.',
    passwordHint: '8 أحرف على الأقل، مع حرف كبير وحرف صغير ورقم.',
    emailExists: 'يوجد حساب بهذا البريد الإلكتروني بالفعل. سجّل الدخول أو أعد تعيين كلمة المرور.',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مرة أخرى.',
    emailNotVerified: 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.',
    enterEmailFirst: 'أدخل بريدك الإلكتروني أولا.',
    resetSent: 'إذا كان هناك حساب بهذا البريد، فسيصلك رابط إعادة تعيين كلمة المرور. تحقق من بريدك.',
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
    loginDescription: 'Suivez votre progression et echangez avec des lecteurs du monde entier.',
    signupDescription: 'Creez votre profil de lecteur et commencez votre etagere numerique.',
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
    emailInvalid: 'Veuillez saisir une adresse e-mail valide (ex. : you@example.com).',
    passwordPolicy: 'Le mot de passe doit comporter au moins 8 caracteres, dont une majuscule, une minuscule et un chiffre.',
    passwordHint: 'Au moins 8 caracteres, avec une majuscule, une minuscule et un chiffre.',
    emailExists: 'Un compte existe deja avec cet e-mail. Connectez-vous ou reinitialisez votre mot de passe.',
    invalidCredentials: 'E-mail ou mot de passe incorrect. Veuillez reessayer.',
    emailNotVerified: 'Veuillez verifier votre e-mail avant de vous connecter.',
    enterEmailFirst: 'Saisissez d abord votre adresse e-mail.',
    resetSent: 'Si un compte existe pour cet e-mail, un lien de reinitialisation va arriver. Verifiez votre boite de reception.',
    connected: 'Connexion reussie. Votre compte ReadTrack est connecte.',
    genericError: 'Une erreur est survenue. Veuillez reessayer.',
    resetError: 'Impossible d envoyer l e-mail de reinitialisation.',
    googleError: 'Impossible de demarrer la connexion Google.',
  },
};
