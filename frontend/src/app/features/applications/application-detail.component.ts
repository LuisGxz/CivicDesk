import { Component, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { parseApiError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';
import { ToastService } from '../../core/toast.service';
import { ApplicationDetailDto } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { TimelineComponent } from '../../shared/timeline.component';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, LucideAngularModule, StatusBadgeComponent, TimelineComponent],
  template: `
    <section class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <a routerLink="/applications" class="inline-flex items-center gap-1.5 text-sm font-semibold text-civic-700 hover:underline mb-5">
        <lucide-icon name="arrow-left" class="w-4 h-4" /> {{ lang.t().nav.myApplications }}
      </a>

      @if (loading()) {
        <div class="card p-8 skeleton h-40"></div>
      } @else if (app(); as a) {
        <div class="card p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xs text-ink-500 num">{{ a.referenceNumber }}
              @if (a.submittedAtUtc) { · {{ lang.t().detail.submittedInfo }} {{ a.submittedAtUtc | date:'mediumDate':undefined:lang.dateLocale() }} }
            </p>
            <h1 class="text-xl font-extrabold text-civic-900">{{ lang.pick(a.service.nameEn, a.service.nameEs) }}</h1>
          </div>
          <app-status-badge [status]="a.status" />
        </div>

        @if (errors().length) {
          <div class="rounded-lg bg-danger-100 border border-danger-700/30 p-3 mb-4">
            @for (e of errors(); track e) { <p class="text-sm text-danger-700 font-medium">{{ e }}</p> }
          </div>
        }

        <!-- needs-info action -->
        @if (a.status === 'NeedsInfo') {
          <div class="card border-warn-700/40 bg-warn-100/40 p-5 mb-6">
            <div class="flex items-start gap-3 mb-3">
              <lucide-icon name="triangle-alert" class="w-5 h-5 text-warn-700 shrink-0 mt-0.5" />
              <div>
                <p class="font-bold text-ink-900">{{ lang.t().detail.provideInfo }}</p>
                @if (lastNeedsInfo(a)) { <p class="text-sm text-ink-700 mt-0.5">{{ lastNeedsInfo(a) }}</p> }
              </div>
            </div>
            <textarea class="input mb-3" rows="2" [(ngModel)]="note" [placeholder]="lang.t().detail.resubmitNote"></textarea>
            <button (click)="resubmit(a.id)" class="btn-primary" [disabled]="busy()">
              <lucide-icon name="send" class="w-4 h-4" /> {{ lang.t().detail.resubmit }}
            </button>
          </div>
        }

        <div class="grid md:grid-cols-5 gap-6">
          <!-- timeline -->
          <div class="md:col-span-3 card p-6">
            <h2 class="font-bold text-ink-900 mb-5">{{ lang.t().detail.timeline }}</h2>
            <app-timeline [events]="a.timeline" />
            <div class="mt-6 flex items-center gap-3 rounded-lg bg-civic-50 border border-civic-100 p-3.5">
              <lucide-icon name="bell-ring" class="w-5 h-5 text-civic-700 shrink-0" />
              <p class="text-sm text-ink-700">{{ lang.t().detail.notifyNote }}</p>
            </div>
          </div>

          <!-- details + docs -->
          <div class="md:col-span-2 space-y-6">
            <div class="card p-6">
              <h2 class="font-bold text-ink-900 mb-3">{{ lang.t().detail.details }}</h2>
              <dl class="space-y-2.5 text-sm">
                @for (f of a.fields; track f.key) {
                  <div>
                    <dt class="text-ink-500">{{ lang.pick(f.labelEn, f.labelEs) }}</dt>
                    <dd class="font-semibold text-ink-900">{{ f.value }}</dd>
                  </div>
                }
              </dl>
            </div>

            <div class="card p-6">
              <h2 class="font-bold text-ink-900 mb-3">{{ lang.t().detail.documents }}</h2>
              <ul class="space-y-2">
                @for (d of a.documents; track d.id) {
                  <li class="flex items-center gap-2.5 text-sm">
                    <lucide-icon name="paperclip" class="w-4 h-4 text-ink-500 shrink-0" />
                    <a [href]="api.documentUrl(a.id, d.id)" target="_blank" rel="noopener" class="text-civic-700 hover:underline truncate flex-1">{{ d.fileName }}</a>
                    @if (d.status === 'Verified') { <lucide-icon name="badge-check" class="w-4 h-4 text-ok-700" /> }
                  </li>
                }
              </ul>
            </div>

            @if (a.comments.length) {
              <div class="card p-6">
                <h2 class="font-bold text-ink-900 mb-3">{{ lang.t().detail.messages }}</h2>
                <ul class="space-y-3">
                  @for (c of a.comments; track c.id) {
                    <li class="text-sm">
                      <p class="text-xs text-ink-500">{{ c.authorName }} · {{ c.createdAtUtc | date:'short':undefined:lang.dateLocale() }}</p>
                      <p class="text-ink-900">{{ c.body }}</p>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>
      }
    </section>
  `
})
export class ApplicationDetailComponent {
  readonly lang = inject(LanguageService);
  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();
  readonly app = signal<ApplicationDetailDto | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly errors = signal<string[]>([]);
  note = '';

  constructor() { queueMicrotask(() => this.load()); }

  private async load(): Promise<void> {
    this.loading.set(true);
    try { this.app.set(await this.api.getApplication(this.id())); }
    catch (e) { this.errors.set(parseApiError(e, 'Not found.', this.lang.lang())); }
    finally { this.loading.set(false); }
  }

  lastNeedsInfo(a: ApplicationDetailDto): string {
    const ev = [...a.timeline].reverse().find(e => e.status === 'NeedsInfo');
    return ev ? this.lang.pick(ev.detailEn, ev.detailEs) : '';
  }

  async resubmit(id: string): Promise<void> {
    this.busy.set(true); this.errors.set([]);
    try {
      await this.api.resubmitApplication(id, this.note.trim() || undefined);
      this.note = '';
      this.toast.success(this.lang.isEs() ? 'Solicitud reenviada.' : 'Application resubmitted.');
      await this.load();
    } catch (e) {
      this.errors.set(parseApiError(e, this.lang.isEs() ? 'No se pudo reenviar.' : 'Could not resubmit.', this.lang.lang()));
    } finally {
      this.busy.set(false);
    }
  }
}
