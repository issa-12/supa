import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import {
  AUTH_COPY_BY_LANGUAGE,
  AuthCopy,
  LANGUAGE_OPTIONS,
  LanguageOption,
  LanguageSelectorComponent,
} from '../../i18n';

type AuthMode = 'login' | 'signup';

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
      this.errorMessage = this.text.requiredFields;
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
      this.errorMessage = this.readErrorMessage(error, this.text.genericError);
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
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private configureFormForMode(): void {
    if (!this.isSignup) {
      return;
    }

    this.authForm.controls.name.addValidators([Validators.required]);
    this.authForm.controls.name.updateValueAndValidity();
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
      this.errorMessage = response.error.message;
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
}
