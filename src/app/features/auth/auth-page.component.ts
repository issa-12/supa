import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);

  protected readonly mode: AuthMode;
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

  protected async submitAuthForm(): Promise<void> {
    this.authForm.markAllAsTouched();
    this.errorMessage = '';
    this.statusMessage = '';

    if (this.authForm.invalid) {
      this.errorMessage = 'Please complete the required fields.';
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

      this.statusMessage = 'Logged in. Your ReadTrack account is connected.';
      this.authForm.reset();

      // Navigate to home page after successful login
      window.setTimeout(() => {
        void this.router.navigateByUrl('/home');
      }, 900);
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.';
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
      this.errorMessage = 'Enter your email address first.';
      this.authForm.controls.email.markAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      await this.supabaseService.sendPasswordReset(email);
      this.statusMessage = 'Password reset link sent. Check your inbox.';
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Could not send a password reset email.';
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
        : 'Could not start Google sign-in.';
      this.isSubmitting = false;
    }
  }

  protected navigateToOtherMode(): void {
    void this.router.navigateByUrl(this.isSignup ? '/' : '/signup');
  }
}
