import { Component, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../core/auth.service';
import { LanguageService } from '../core/language.service';

const ICON: Record<string, string> = { Citizen: 'circle-user', Officer: 'clipboard-list', Supervisor: 'shield-check' };

/** Small "You are: <role>" chip so the demo visitor always knows their current vantage point. */
@Component({
  selector: 'app-role-badge',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (auth.user(); as u) {
      <span class="badge bg-civic-50 text-civic-800 border border-civic-100">
        <lucide-icon [name]="icon()" class="w-3.5 h-3.5" />
        <span class="text-ink-500 font-medium">{{ lang.t().guide.youAre }}:</span> {{ lang.role(u.role) }}
      </span>
    }
  `
})
export class RoleBadgeComponent {
  readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);
  readonly icon = computed(() => ICON[this.auth.user()?.role ?? 'Citizen'] ?? 'circle-user');
}
