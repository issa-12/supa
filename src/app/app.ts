import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslationService } from './i18n';
import { PresenceService } from './core/services/presence.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  isOffline = false;
  private readonly translationService = inject(TranslationService);
  private readonly presenceService = inject(PresenceService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.isOffline = !navigator.onLine;

    // Join online-presence app-wide (resilient to which page hosts the nav).
    void this.presenceService.init();

    // Set up global RTL support. takeUntilDestroyed() runs here in ngOnInit
    // (outside the injection context), so it needs an explicit DestroyRef.
    this.translationService.getCurrentLanguage$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(lang => {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      });
  }

  @HostListener('window:online')
  onOnline(): void { this.isOffline = false; }

  @HostListener('window:offline')
  onOffline(): void { this.isOffline = true; }
}
