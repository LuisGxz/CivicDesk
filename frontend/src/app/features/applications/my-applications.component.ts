import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { ApplicationSummaryDto } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [RouterLink, DatePipe, LucideAngularModule, StatusBadgeComponent],
  template: `
    <section class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-extrabold text-civic-900">{{ lang.t().tracker.title }}</h1>
          <p class="text-ink-700 text-sm mt-1 max-w-xl">{{ lang.t().tracker.subtitle }}</p>
        </div>
        <a routerLink="/services" class="btn-primary shrink-0"><lucide-icon name="plus" class="w-4 h-4" /> {{ lang.t().tracker.newApplication }}</a>
      </div>

      @if (loading()) {
        <div class="space-y-3">@for (i of [1,2,3]; track i) { <div class="card p-5 h-24 skeleton"></div> }</div>
      } @else if (apps().length === 0) {
        <div class="card p-10 text-center">
          <lucide-icon name="clipboard-list" class="w-10 h-10 mx-auto mb-3 text-ink-300" />
          <p class="text-ink-700 mb-4">{{ lang.t().tracker.empty }}</p>
          <a routerLink="/services" class="btn-primary inline-flex">{{ lang.t().tracker.emptyCta }}</a>
        </div>
      } @else {
        <div class="space-y-3">
          @for (a of apps(); track a.id) {
            <a [routerLink]="['/applications', a.id]" class="card p-5 flex items-center gap-4 hover:border-civic-700 hover:shadow-md transition-all">
              <span class="w-11 h-11 rounded-lg bg-civic-50 grid place-items-center shrink-0">
                <lucide-icon [name]="a.serviceIcon" class="w-5 h-5 text-civic-800" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-ink-900 truncate">{{ lang.pick(a.serviceNameEn, a.serviceNameEs) }}</p>
                <p class="text-xs text-ink-500 num">{{ a.referenceNumber }} · {{ lang.t().common.updated }} {{ a.updatedAtUtc | date:'mediumDate':undefined:lang.dateLocale() }}</p>
              </div>
              <app-status-badge [status]="a.status" />
              <lucide-icon name="chevron-right" class="w-5 h-5 text-ink-300" />
            </a>
          }
        </div>
      }
    </section>
  `
})
export class MyApplicationsComponent {
  readonly lang = inject(LanguageService);
  private readonly api = inject(ApiService);
  readonly apps = signal<ApplicationSummaryDto[]>([]);
  readonly loading = signal(true);

  constructor() { this.load(); }
  private async load(): Promise<void> {
    try { this.apps.set(await this.api.getMyApplications()); }
    finally { this.loading.set(false); }
  }
}
