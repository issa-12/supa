import { Component, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslationService } from './i18n';
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

  ngOnInit(): void {
    this.isOffline = !navigator.onLine;

    // Set up global RTL support
    this.translationService.getCurrentLanguage$()
      .pipe(takeUntilDestroyed())
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
