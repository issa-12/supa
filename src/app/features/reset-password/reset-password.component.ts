import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { TranslationService, RESET_COPY, LanguageCode } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  protected readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return RESET_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  protected password = '';
  protected confirmPassword = '';
  protected showPassword = false;
  protected showConfirmPassword = false;

  protected submitting = false;
  protected errorMessage = '';
  protected successMessage = '';

  protected sessionReady = false;
  protected sessionError = '';

  async ngOnInit(): Promise<void> {
    await this.establishRecoverySession();
  }

  private async establishRecoverySession(): Promise<void> {
    try {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;

      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (!accessToken || !refreshToken) {
        const session = await this.supabaseService.getCurrentSession();
        if (session) {
          this.sessionReady = true;
          return;
        }
        this.sessionError = this.copy.invalidLink;
        return;
      }

      if (type && type !== 'recovery') {
        this.sessionError = this.copy.invalidLinkType;
        return;
      }

      const supabase = await this.supabaseService.getClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        this.sessionError = this.copy.validateError;
        return;
      }

      this.sessionReady = true;

      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      this.sessionError = this.copy.validateError;
    }
  }

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  protected toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  protected async submit(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.password || this.password.length < 6) {
      this.errorMessage = this.copy.passwordTooShort;
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = this.copy.passwordsDontMatch;
      return;
    }

    this.submitting = true;

    try {
      const supabase = await this.supabaseService.getClient();
      const { error } = await supabase.auth.updateUser({ password: this.password });

      if (error) {
        this.errorMessage = this.copy.updateError;
        return;
      }

      this.successMessage = this.copy.updateSuccess;
      this.password = '';
      this.confirmPassword = '';

      await supabase.auth.signOut();

      window.setTimeout(() => {
        void this.router.navigateByUrl('/');
      }, 1800);
    } catch {
      this.errorMessage = this.copy.updateError;
    } finally {
      this.submitting = false;
    }
  }
}
