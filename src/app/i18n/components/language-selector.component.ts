import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { LanguageOption } from '../language.model';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss',
})
export class LanguageSelectorComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly translationService = inject(TranslationService);

  @Input({ required: true }) languages: readonly LanguageOption[] = [];
  @Input({ required: true }) selectedLanguage!: LanguageOption;
  @Input({ required: true }) label = 'Change language';

  @Output() readonly selectedLanguageChange = new EventEmitter<LanguageOption>();

  protected isOpen = false;

  protected toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  protected selectLanguage(language: LanguageOption): void {
    this.translationService.setLanguage(language.code);
    this.selectedLanguageChange.emit(language);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  protected closeOnOutsideClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.isOpen = false;
  }
}
