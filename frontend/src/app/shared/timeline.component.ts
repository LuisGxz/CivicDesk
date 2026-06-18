import { Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { LanguageService } from '../core/language.service';
import { TimelineEventDto } from '../core/models';

const DOT: Record<string, { bg: string; icon: string | null }> = {
  Submitted: { bg: 'bg-ok-700', icon: 'check' },
  UnderReview: { bg: 'bg-civic-700', icon: null },
  NeedsInfo: { bg: 'bg-warn-700', icon: 'circle-alert' },
  Approved: { bg: 'bg-ok-700', icon: 'check' },
  Rejected: { bg: 'bg-danger-700', icon: 'ban' },
  Draft: { bg: 'bg-ink-300', icon: null }
};

/** Vertical status timeline rendered from the application's immutable event history. */
@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [DatePipe, LucideAngularModule],
  template: `
    <ol class="relative border-l-2 border-ink-200 ml-3 space-y-7">
      @for (e of events(); track $index; let last = $last) {
        <li class="relative pl-7">
          <span class="absolute -left-[11px] top-0.5 w-5 h-5 rounded-full grid place-items-center" [class]="dot(e.status).bg">
            @if (dot(e.status).icon) {
              <lucide-icon [name]="dot(e.status).icon!" class="w-3 h-3 text-white" />
            } @else {
              <span class="w-1.5 h-1.5 rounded-full bg-white" [class.animate-pulse]="last && e.status === 'UnderReview'"></span>
            }
          </span>
          <p class="font-bold text-ink-900">{{ lang.pick(e.titleEn, e.titleEs) }}</p>
          @if (lang.pick(e.detailEn, e.detailEs)) {
            <p class="text-sm text-ink-700 mt-0.5">{{ lang.pick(e.detailEn, e.detailEs) }}</p>
          }
          <time class="text-xs text-ink-500 num">{{ e.occurredAtUtc | date:'medium':undefined:lang.dateLocale() }}</time>
        </li>
      }
    </ol>
  `
})
export class TimelineComponent {
  readonly lang = inject(LanguageService);
  readonly events = input.required<TimelineEventDto[]>();
  dot(status: string) { return DOT[status] ?? DOT['Draft']; }
}
