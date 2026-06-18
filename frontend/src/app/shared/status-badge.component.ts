import { Component, computed, inject, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { LanguageService } from '../core/language.service';
import { ApplicationStatus } from '../core/models';

const MAP: Record<ApplicationStatus, { cls: string; icon: string }> = {
  Draft: { cls: 'badge-draft', icon: 'file-text' },
  Submitted: { cls: 'badge-submitted', icon: 'inbox' },
  UnderReview: { cls: 'badge-review', icon: 'hourglass' },
  NeedsInfo: { cls: 'badge-needsinfo', icon: 'circle-alert' },
  Approved: { cls: 'badge-approved', icon: 'badge-check' },
  Rejected: { cls: 'badge-rejected', icon: 'ban' }
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <span [class]="map().cls">
      <lucide-icon [name]="map().icon" class="w-3.5 h-3.5" />
      {{ lang.status(status()) }}
    </span>
  `
})
export class StatusBadgeComponent {
  readonly lang = inject(LanguageService);
  readonly status = input.required<ApplicationStatus>();
  readonly map = computed(() => MAP[this.status()]);
}
