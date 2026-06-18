import { Component, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../core/auth.service';
import { LanguageService } from '../core/language.service';
import { TourService } from '../core/tour.service';

/** First-visit, role-aware "how to explore" overlay. Dismissible + replayable from the header. */
@Component({
  selector: 'app-demo-guide',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (tour.open()) {
      <div class="fixed inset-0 z-[90] grid place-items-center p-4 bg-civic-900/40 backdrop-blur-sm" (click)="tour.dismiss()">
        <div class="card max-w-lg w-full p-6 sm:p-7" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="flex items-start gap-3 mb-4">
            <span class="w-10 h-10 rounded-lg bg-civic-50 grid place-items-center shrink-0">
              <lucide-icon name="sparkles" class="w-5 h-5 text-civic-700" />
            </span>
            <div>
              <h2 class="text-lg font-extrabold text-civic-900">{{ g().title }}</h2>
              <p class="text-sm text-ink-700">{{ g().intro }}</p>
            </div>
          </div>

          <div class="rounded-lg bg-civic-50 border border-civic-100 p-4 mb-4">
            <p class="text-xs font-bold text-civic-700 uppercase tracking-wide mb-1">{{ g().youAre }}: {{ roleLabel() }}</p>
            <p class="text-sm text-ink-900">{{ roleTip() }}</p>
          </div>

          <div class="flex items-start gap-3 rounded-lg bg-ok-100 border border-ok-700/20 p-4 mb-5">
            <lucide-icon name="circle-check" class="w-5 h-5 text-ok-700 shrink-0 mt-0.5" />
            <p class="text-sm text-ink-900"><span class="font-semibold">{{ lang.isEs() ? 'Momento estrella:' : 'Try this:' }}</span> {{ ahaTip() }}</p>
          </div>

          <button (click)="tour.dismiss()" class="btn-primary w-full">{{ g().gotIt }}</button>
        </div>
      </div>
    }
  `
})
export class DemoGuideComponent {
  readonly tour = inject(TourService);
  readonly lang = inject(LanguageService);
  readonly auth = inject(AuthService);

  readonly g = computed(() => this.lang.t().guide);
  readonly roleLabel = computed(() => this.lang.role(this.auth.user()?.role ?? 'Citizen'));
  readonly roleTip = computed(() => {
    const r = this.auth.user()?.role;
    return r === 'Supervisor' ? this.g().supervisorTip : r === 'Officer' ? this.g().officerTip : this.g().citizenTip;
  });
  readonly ahaTip = computed(() => this.auth.isStaff() ? this.g().ahaOfficer : this.g().ahaCitizen);
}
