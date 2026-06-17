import { Component, ElementRef, QueryList, ViewChildren, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupabaseService } from '../../core/services/supabase.service';
import { TranslationService, VERIFICATION_COPY, LanguageCode } from '../../i18n';

@Component({
  selector: 'app-email-verification',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.scss',
})
export class EmailVerificationComponent {
  @ViewChildren('codeInput') private readonly codeInputs?: QueryList<ElementRef<HTMLInputElement>>;

  protected readonly codeLength = 8;

  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return VERIFICATION_COPY[this.lang]; }

  // The chosen language carries over from the login/signup page (localStorage).
  // Subscribe so the page re-renders if it changes while open.
  protected get titleText(): string {
    return this.copy.title.replace('{count}', String(this.codeLength));
  }
  protected get codeInputsAria(): string {
    return this.copy.codeInputsAriaLabel.replace('{count}', String(this.codeLength));
  }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  protected readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  protected readonly codeControls = this.formBuilder.array(
    Array.from({ length: this.codeLength }, () => this.formBuilder.nonNullable.control('', [
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

    if (digit && index < this.codeLength - 1) {
      this.focusCodeInput(index + 1);
    }
  }

  protected onCodeKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.codeArray.at(index).value && index > 0) {
      this.focusCodeInput(index - 1);
    }
  }

  protected onCodePaste(event: ClipboardEvent): void {
    const pastedCode = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, this.codeLength) ?? '';

    if (pastedCode.length !== this.codeLength) {
      return;
    }

    event.preventDefault();
    pastedCode.split('').forEach((digit, index) => {
      this.codeArray.at(index).setValue(digit);
    });
    this.focusCodeInput(this.codeLength - 1);
  }

  protected async verifyCode(): Promise<void> {
    this.verificationForm.markAllAsTouched();
    this.errorMessage = '';
    this.statusMessage = '';

    if (!this.email) {
      this.errorMessage = this.copy.emailMissing;
      return;
    }

    if (this.verificationForm.invalid) {
      this.errorMessage = this.copy.enterCode.replace('{count}', String(this.codeLength));
      return;
    }

    this.isSubmitting = true;

    try {
      await this.supabaseService.verifyEmailCode({
        email: this.email,
        code: this.codeArray.getRawValue().join(''),
      });
      this.statusMessage = this.copy.verifiedRedirect;

      window.setTimeout(() => {
        void this.router.navigateByUrl('/home');
      }, 900);
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : this.copy.verifyFailed;
    } finally {
      this.isSubmitting = false;
    }
  }

  protected async resendCode(): Promise<void> {
    this.errorMessage = '';
    this.statusMessage = '';

    if (!this.email) {
      this.errorMessage = this.copy.emailMissing;
      return;
    }

    this.isSubmitting = true;

    try {
      await this.supabaseService.resendEmailVerification(this.email);
      this.statusMessage = this.copy.codeResent;
      this.verificationForm.reset();
      this.focusCodeInput(0);
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : this.copy.resendFailed;
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
