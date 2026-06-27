import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { APP_COPY, LanguageCode, TranslationService } from './i18n';
import { PresenceService } from './core/services/presence.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly translationService = inject(TranslationService);
  private readonly presenceService = inject(PresenceService);
  private readonly destroyRef = inject(DestroyRef);
  isOffline = false;
  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return APP_COPY[this.lang]; }

  ngOnInit(): void {
    this.isOffline = !navigator.onLine;

    // Join online-presence app-wide (resilient to which page hosts the nav).
    void this.presenceService.init();

    // Set up global RTL support. takeUntilDestroyed() runs here in ngOnInit
    // (outside the injection context), so it needs an explicit DestroyRef.
    this.translationService.getCurrentLanguage$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(lang => {
        this.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      });
  }

  @HostListener('window:online')
  onOnline(): void { this.isOffline = false; }

  @HostListener('window:offline')
  onOffline(): void { this.isOffline = true; }
}
