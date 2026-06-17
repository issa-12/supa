import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthApiError, SupabaseService } from '../../core/services/supabase.service';
import {
  AUTH_COPY_BY_LANGUAGE,
  AuthCopy,
  LANGUAGE_OPTIONS,
  LanguageOption,
  LanguageSelectorComponent,
} from '../../i18n';

type AuthMode = 'login' | 'signup';

// Matches the backend's email check (auth.controller.ts normalizeEmail). Angular's
// built-in Validators.email accepts addresses with no domain dot (e.g. "a@b"),
// which the backend then rejects — so we validate the stricter shape up front.
const STRICT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function strictEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) return null; // emptiness is handled by Validators.required
  return STRICT_EMAIL_PATTERN.test(value) ? null : { email: true };
}

// Signup is restricted to these providers. Keep in sync with the backend
// allowlist in auth.controller.ts (ALLOWED_EMAIL_DOMAINS).
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
];

function allowedEmailDomainValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim().toLowerCase();
  if (!value || !value.includes('@')) return null; // format handled elsewhere
  const domain = value.slice(value.lastIndexOf('@') + 1);
  return ALLOWED_EMAIL_DOMAINS.includes(domain) ? null : { emailDomain: true };
}

// Signup password policy: at least 8 chars, with an uppercase letter, a
// lowercase letter, and a number. Mirrored on the backend (auth.controller.ts).
function passwordPolicyValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) return null; // emptiness is handled by Validators.required
  const strong =
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value);
  return strong ? null : { passwordPolicy: true };
}

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, LanguageSelectorComponent],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);

  protected readonly mode: AuthMode = this.resolveAuthMode();
  protected readonly languages = LANGUAGE_OPTIONS;
  protected readonly authForm = this.createAuthForm();

  protected selectedLanguage = this.getInitialLanguage();
  protected isSubmitting = false;
  protected showPassword = false;
  protected errorMessage = '';
  protected statusMessage = '';

  protected showResetModal = false;
  protected resetEmail = '';
  protected resetSubmitting = false;
  protected resetError = '';
  protected resetSuccess = '';

  constructor() {
    this.configureFormForMode();
    this.maybeRedirectRecoveryLink();
  }

  private maybeRedirectRecoveryLink(): void {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash);
    if (params.get('type') === 'recovery' && params.get('access_token')) {
      window.location.replace('/reset-password' + window.location.hash);
    }
  }

  private getInitialLanguage(): LanguageOption {
    if (typeof localStorage === 'undefined') {
      return this.languages[0];
    }
    return (
      this.languages.find(
        (l) => l.code === localStorage.getItem('selectedLanguage'),
      ) ?? this.languages[0]
    );
  }

  protected get isSignup(): boolean {
    return this.mode === 'signup';
  }

  protected get text(): AuthCopy {
    return AUTH_COPY_BY_LANGUAGE[this.selectedLanguage.code];
  }

  protected selectLanguage(language: LanguageOption): void {
    this.selectedLanguage = language;
  }

  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  protected async submitAuthForm(): Promise<void> {
    this.clearMessages();
    this.authForm.markAllAsTouched();

    if (this.authForm.invalid) {
      const emailControl = this.authForm.controls.email;
      const passwordControl = this.authForm.controls.password;
      // Give a precise message for a present-but-invalid email or a password
      // that fails the policy; otherwise fall back to "complete the required
      // fields" (i.e. something is actually empty).
      if (emailControl.value?.trim() && emailControl.errors?.['email']) {
        this.errorMessage = this.text.emailInvalid;
      } else if (emailControl.value?.trim() && emailControl.errors?.['emailDomain']) {
        this.errorMessage = this.text.emailDomainNotAllowed;
      } else if (passwordControl.value && passwordControl.errors?.['passwordPolicy']) {
        this.errorMessage = this.text.passwordPolicy;
      } else {
        this.errorMessage = this.text.requiredFields;
      }
      return;
    }

    this.isSubmitting = true;

    try {
      if (this.isSignup) {
        await this.submitSignup();
        return;
      }

      await this.submitLogin();
    } catch (error) {
      this.errorMessage = this.resolveAuthErrorMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  protected sendPasswordReset(): void {
    this.resetEmail = this.normalizedEmail() || '';
    this.resetError = '';
    this.resetSuccess = '';
    this.showResetModal = true;
  }

  protected closeResetModal(): void {
    this.showResetModal = false;
    this.resetEmail = '';
    this.resetError = '';
    this.resetSuccess = '';
    this.resetSubmitting = false;
  }

  protected async submitPasswordReset(): Promise<void> {
    this.resetError = '';
    this.resetSuccess = '';

    const email = this.resetEmail.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailPattern.test(email)) {
      this.resetError = this.text.enterEmailFirst;
      return;
    }

    this.resetSubmitting = true;

    try {
      await this.supabaseService.sendPasswordResetViaFunction(email);
      this.resetSuccess = this.text.resetSent;
      window.setTimeout(() => this.closeResetModal(), 2000);
    } catch (error) {
      this.resetError = this.readErrorMessage(error, this.text.resetError);
    } finally {
      this.resetSubmitting = false;
    }
  }

  protected async continueWithGoogle(): Promise<void> {
    this.clearMessages();
    this.isSubmitting = true;

    try {
      const { error } = await this.supabaseService.signInWithProvider('google');

      if (error) {
        this.errorMessage = error.message;
        this.isSubmitting = false;
      }
    } catch (error) {
      this.errorMessage = this.readErrorMessage(error, this.text.googleError);
      this.isSubmitting = false;
    }
  }

  private createAuthForm() {
    return this.formBuilder.nonNullable.group({
      name: [''],
      email: ['', [Validators.required, strictEmailValidator]],
      password: ['', [Validators.required]],
    });
  }

  private configureFormForMode(): void {
    if (!this.isSignup) {
      return;
    }

    this.authForm.controls.name.addValidators([Validators.required]);
    this.authForm.controls.name.updateValueAndValidity();

    // Signup-only: restrict the email to the allowed provider domains.
    this.authForm.controls.email.addValidators([allowedEmailDomainValidator]);
    this.authForm.controls.email.updateValueAndValidity();

    // The password policy applies to new accounts only — at login we just
    // require a non-empty password and let the server verify it.
    this.authForm.controls.password.addValidators([passwordPolicyValidator]);
    this.authForm.controls.password.updateValueAndValidity();
  }

  private resolveAuthMode(): AuthMode {
    return this.route.snapshot.data['mode'] === 'signup' ? 'signup' : 'login';
  }

  private async submitSignup(): Promise<void> {
    const { name, password } = this.authForm.getRawValue();
    const email = this.normalizedEmail();

    await this.supabaseService.requestEmailVerification({
      email,
      password,
      name: name.trim(),
    });

    void this.router.navigate(['/verify-email'], {
      queryParams: { email },
    });
  }

  private async submitLogin(): Promise<void> {
    const { password } = this.authForm.getRawValue();
    const response = await this.supabaseService.signIn({
      email: this.normalizedEmail(),
      password,
    });

    if (response.error) {
      this.errorMessage = this.mapLoginError(response.error);
      return;
    }

    this.statusMessage = this.text.connected;
    this.authForm.reset();

    window.setTimeout(() => {
      void this.router.navigateByUrl('/home');
    }, 900);
  }

  private normalizedEmail(): string {
    return this.authForm.controls.email.value.trim().toLowerCase();
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.statusMessage = '';
  }

  private readErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }

  // Signup / API errors: map the backend's stable code to a localized message.
  private resolveAuthErrorMessage(error: unknown): string {
    if (error instanceof AuthApiError) {
      switch (error.code) {
        case 'EMAIL_EXISTS':
          return this.text.emailExists;
        case 'WEAK_PASSWORD':
          return this.text.passwordPolicy;
        case 'INVALID_EMAIL':
          return this.text.emailInvalid;
        case 'EMAIL_DOMAIN_NOT_ALLOWED':
          return this.text.emailDomainNotAllowed;
        case 'MISSING_FIELDS':
          return this.text.requiredFields;
        default:
          return error.message || this.text.genericError;
      }
    }
    return error instanceof Error ? error.message : this.text.genericError;
  }

  // Login errors: Supabase returns raw English strings; translate the known ones.
  private mapLoginError(error: { name?: string; message?: string }): string {
    if (error.name === 'EmailNotVerifiedError') {
      return this.text.emailNotVerified;
    }
    const message = (error.message ?? '').toLowerCase();
    if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
      return this.text.invalidCredentials;
    }
    if (message.includes('email not confirmed') || message.includes('not confirmed')) {
      return this.text.emailNotVerified;
    }
    return error.message || this.text.genericError;
  }
}
