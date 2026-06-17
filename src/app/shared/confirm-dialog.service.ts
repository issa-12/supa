import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * App-wide replacement for the native `confirm()`. Call `confirm(options)` and
 * await the boolean result; a single <app-confirm-dialog> mounted in the app
 * root renders the themed modal and resolves the promise.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmState | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    // If a dialog is already open, resolve it as cancelled first.
    this.state()?.resolve(false);
    return new Promise<boolean>((resolve) => {
      this.state.set({ ...options, resolve });
    });
  }

  respond(value: boolean): void {
    const current = this.state();
    if (!current) return;
    this.state.set(null);
    current.resolve(value);
  }
}
