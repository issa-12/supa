import { Component, ElementRef, QueryList, ViewChildren, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-email-verification',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.scss',
})
export class EmailVerificationComponent {
  @ViewChildren('codeInput') private readonly codeInputs?: QueryList<ElementRef<HTMLInputElement>>;

  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);

  protected readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  protected readonly codeControls = this.formBuilder.array(
    Array.from({ length: 6 }, () => this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^\d$/),
    ])),
  );
  protected readonly verificationForm = this.formBuilder.nonNullable.group({
    code: this.codeControls,
  });
  protected isSubmitting = false;
  protected errorMessage = '';
  protected statusMessage = '';

  protected get codeArray(): FormArray {
    return this.verificationForm.controls.code;
  }

  protected onCodeInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);
    this.codeArray.at(index).setValue(digit);

    if (digit && index < 5) {
      this.focusCodeInput(index + 1);
    }
  }

  protected onCodeKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.codeArray.at(index).value && index > 0) {
      this.focusCodeInput(index - 1);
    }
  }

  protected onCodePaste(event: ClipboardEvent): void {
    const pastedCode = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';

    if (pastedCode.length !== 6) {
      return;
    }

    event.preventDefault();
    pastedCode.split('').forEach((digit, index) => {
      this.codeArray.at(index).setValue(digit);
    });
    this.focusCodeInput(5);
  }

  protected async verifyCode(): Promise<void> {
    this.verificationForm.markAllAsTouched();
    this.errorMessage = '';
    this.statusMessage = '';

    if (!this.email) {
      this.errorMessage = 'Email address is missing. Start sign up again.';
      return;
    }

    if (this.verificationForm.invalid) {
      this.errorMessage = 'Enter the 6-digit code from your email.';
      return;
    }

    this.isSubmitting = true;

    try {
      await this.supabaseService.verifyEmailCode({
        email: this.email,
        code: this.codeArray.getRawValue().join(''),
      });
      this.statusMessage = 'Email verified. Redirecting to your home page...';

      window.setTimeout(() => {
        void this.router.navigateByUrl('/home');
      }, 900);
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Could not verify this code.';
    } finally {
      this.isSubmitting = false;
    }
  }

  protected async resendCode(): Promise<void> {
    this.errorMessage = '';
    this.statusMessage = '';

    if (!this.email) {
      this.errorMessage = 'Email address is missing. Start sign up again.';
      return;
    }

    this.isSubmitting = true;

    try {
      await this.supabaseService.resendEmailVerification(this.email);
      this.statusMessage = 'A new verification code was sent.';
      this.verificationForm.reset();
      this.focusCodeInput(0);
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Could not resend the verification code.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private focusCodeInput(index: number): void {
    window.setTimeout(() => {
      this.codeInputs?.get(index)?.nativeElement.focus();
    });
  }
}
