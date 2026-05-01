import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

type AuthMode = 'login' | 'signup';
type LanguageCode = 'en' | 'ar' | 'fr';

interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
}

interface AuthCopy {
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

const languageOptions: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
];

const copyByLanguage: Record<LanguageCode, AuthCopy> = {
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

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);

  protected readonly mode: AuthMode;
  protected readonly languages = languageOptions;
  protected selectedLanguage = languageOptions[0];
  protected isLanguageMenuOpen = false;
  protected isSubmitting = false;
  protected showPassword = false;
  protected errorMessage = '';
  protected statusMessage = '';

  protected readonly authForm = this.formBuilder.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    this.mode = this.route.snapshot.data['mode'] === 'signup' ? 'signup' : 'login';

    if (this.mode === 'signup') {
      this.authForm.controls.name.addValidators([Validators.required]);
      this.authForm.controls.name.updateValueAndValidity();
    }
  }

  protected get isSignup(): boolean {
    return this.mode === 'signup';
  }

  protected get text(): AuthCopy {
    return copyByLanguage[this.selectedLanguage.code];
  }

  protected toggleLanguageMenu(): void {
    this.isLanguageMenuOpen = !this.isLanguageMenuOpen;
  }

  protected selectLanguage(language: LanguageOption): void {
    this.selectedLanguage = language;
    this.isLanguageMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  protected closeLanguageMenuOnOutsideClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isLanguageMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  protected closeLanguageMenuOnEscape(): void {
    this.isLanguageMenuOpen = false;
  }

  protected async submitAuthForm(): Promise<void> {
    this.authForm.markAllAsTouched();
    this.errorMessage = '';
    this.statusMessage = '';

    if (this.authForm.invalid) {
      this.errorMessage = this.text.requiredFields;
      return;
    }

    this.isSubmitting = true;

    try {
      const { name, email, password } = this.authForm.getRawValue();
      const normalizedEmail = email.trim().toLowerCase();
      if (this.isSignup) {
        await this.supabaseService.requestEmailVerification({
          email: normalizedEmail,
          password,
          name: name.trim(),
        });

        void this.router.navigate(['/verify-email'], {
          queryParams: {
            email: normalizedEmail,
          },
        });
        return;
      }

      const response = await this.supabaseService.signIn({
        email: normalizedEmail,
        password,
      });

      if (response.error) {
        this.errorMessage = response.error.message;
        return;
      }

      this.statusMessage = this.text.connected;
      this.authForm.reset();

      // Navigate to home page after successful login
      window.setTimeout(() => {
        void this.router.navigateByUrl('/home');
      }, 900);
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : this.text.genericError;
    } finally {
      this.isSubmitting = false;
    }
  }

  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  protected async sendPasswordReset(): Promise<void> {
    this.errorMessage = '';
    this.statusMessage = '';

    const email = this.authForm.controls.email.value.trim().toLowerCase();

    if (!email || this.authForm.controls.email.invalid) {
      this.errorMessage = this.text.enterEmailFirst;
      this.authForm.controls.email.markAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      await this.supabaseService.sendPasswordReset(email);
      this.statusMessage = this.text.resetSent;
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : this.text.resetError;
    } finally {
      this.isSubmitting = false;
    }
  }

  protected async continueWithGoogle(): Promise<void> {
    this.errorMessage = '';
    this.statusMessage = '';
    this.isSubmitting = true;

    try {
      const { error } = await this.supabaseService.signInWithProvider('google');

      if (error) {
        this.errorMessage = error.message;
        this.isSubmitting = false;
      }
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : this.text.googleError;
      this.isSubmitting = false;
    }
  }

  protected navigateToOtherMode(): void {
    void this.router.navigateByUrl(this.isSignup ? '/' : '/signup');
  }
}
