import { Injectable, computed, signal } from '@angular/core';
import { CATEGORY_LABEL, COPY, Lang, ROLE_LABEL, STATUS_LABEL } from './i18n';

const LANG_KEY = 'civicdesk.lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<Lang>(readStoredLang());

  /** App-wide copy for the active language. */
  readonly t = computed(() => COPY[this.lang()]);
  readonly isEs = computed(() => this.lang() === 'es');
  readonly dateLocale = computed(() => this.lang() === 'es' ? 'es' : 'en-US');

  set(lang: Lang): void {
    this.lang.set(lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }

  toggle(): void { this.set(this.lang() === 'es' ? 'en' : 'es'); }

  /** Picks the EN or ES variant of a bilingual API field. */
  pick(en: string | null | undefined, es: string | null | undefined): string {
    return (this.lang() === 'es' ? es : en) ?? en ?? es ?? '';
  }

  status(value: string): string { return STATUS_LABEL[this.lang()][value] ?? value; }
  category(value: string): string { return CATEGORY_LABEL[this.lang()][value] ?? value; }
  role(value: string): string { return ROLE_LABEL[this.lang()][value] ?? value; }
}

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch { /* ignore */ }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}
