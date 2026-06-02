import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

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
        this.sessionError = 'Invalid or expired reset link. Please request a new one.';
        return;
      }

      if (type && type !== 'recovery') {
        this.sessionError = 'Invalid reset link.';
        return;
      }

      const supabase = await this.supabaseService.getClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        this.sessionError = error.message || 'Could not validate reset link.';
        return;
      }

      this.sessionReady = true;

      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (error) {
      this.sessionError =
        error instanceof Error ? error.message : 'Could not validate reset link.';
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
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.submitting = true;

    try {
      const supabase = await this.supabaseService.getClient();
      const { error } = await supabase.auth.updateUser({ password: this.password });

      if (error) {
        this.errorMessage = error.message || 'Could not update password.';
        return;
      }

      this.successMessage = 'Password updated successfully. Redirecting to login…';
      this.password = '';
      this.confirmPassword = '';

      await supabase.auth.signOut();

      window.setTimeout(() => {
        void this.router.navigateByUrl('/');
      }, 1800);
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Could not update password.';
    } finally {
      this.submitting = false;
    }
  }
}
