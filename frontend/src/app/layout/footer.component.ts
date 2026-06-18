import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LanguageService } from '../core/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <footer class="border-t border-ink-200 bg-white mt-16">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <div class="flex items-center gap-2 text-ink-500">
          <lucide-icon name="landmark" class="w-4 h-4" />
          <span>{{ lang.t().brand }} · {{ lang.isEs() ? 'Ciudad de Riverton' : 'City of Riverton' }}</span>
        </div>
        <div class="flex items-center gap-4 text-ink-500">
          <a routerLink="/about" class="hover:text-civic-700">{{ lang.t().nav.about }}</a>
          <span class="font-mono text-xs">Demo · Luis Chiquito Vera</span>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  readonly lang = inject(LanguageService);
}
