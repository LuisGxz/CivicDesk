import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { InboxItemDto, InboxStatsDto, PagedResult } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { RoleBadgeComponent } from '../../shared/role-badge.component';

@Component({
  selector: 'app-officer-inbox',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, StatusBadgeComponent, RoleBadgeComponent],
  template: `
    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-extrabold text-civic-900">{{ lang.t().officer.inbox }}</h1>
          <p class="text-ink-700 text-sm mt-1">{{ lang.t().officer.dashboard }}</p>
        </div>
        <app-role-badge />
      </div>

      <!-- stats -->
      @if (stats(); as s) {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <button (click)="filterStatus('Submitted')" [class]="statCard('Submitted')">
            <span class="text-2xl font-extrabold num text-civic-800">{{ s.submitted }}</span>
            <span class="text-xs font-semibold text-ink-500">{{ lang.status('Submitted') }}</span>
          </button>
          <button (click)="filterStatus('UnderReview')" [class]="statCard('UnderReview')">
            <span class="text-2xl font-extrabold num text-warn-700">{{ s.underReview }}</span>
            <span class="text-xs font-semibold text-ink-500">{{ lang.status('UnderReview') }}</span>
          </button>
          <button (click)="filterStatus('NeedsInfo')" [class]="statCard('NeedsInfo')">
            <span class="text-2xl font-extrabold num text-warn-700">{{ s.needsInfo }}</span>
            <span class="text-xs font-semibold text-ink-500">{{ lang.status('NeedsInfo') }}</span>
          </button>
          <button (click)="filterStatus('Approved')" [class]="statCard('Approved')">
            <span class="text-2xl font-extrabold num text-ok-700">{{ s.approved }}</span>
            <span class="text-xs font-semibold text-ink-500">{{ lang.status('Approved') }}</span>
          </button>
          <button (click)="filterStatus('Rejected')" [class]="statCard('Rejected')">
            <span class="text-2xl font-extrabold num text-danger-700">{{ s.rejected }}</span>
            <span class="text-xs font-semibold text-ink-500">{{ lang.status('Rejected') }}</span>
          </button>
          <div class="card p-4 flex flex-col items-start gap-1">
            <span class="text-2xl font-extrabold num text-ink-900">{{ s.assignedToMe }}</span>
            <span class="text-xs font-semibold text-ink-500">{{ lang.t().officer.mineOnly }}</span>
          </div>
        </div>
      }

      <!-- filters -->
      <div class="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 flex-1 min-w-[12rem]">
          <lucide-icon name="search" class="w-4 h-4 text-ink-500" />
          <input class="flex-1 text-sm outline-none bg-transparent" [(ngModel)]="search" (ngModelChange)="debouncedReload()" [placeholder]="lang.t().officer.searchPlaceholder" />
        </div>
        <select class="input w-auto py-2" [(ngModel)]="status" (ngModelChange)="reload()">
          <option value="">{{ lang.t().officer.allStatuses }}</option>
          @for (st of statuses; track st) { <option [value]="st">{{ lang.status(st) }}</option> }
        </select>
        <label class="flex items-center gap-2 text-sm font-semibold text-ink-700 cursor-pointer">
          <input type="checkbox" class="w-4 h-4 accent-civic-800" [(ngModel)]="mine" (ngModelChange)="reload()" />
          {{ lang.t().officer.mineOnly }}
        </label>
      </div>

      <!-- table -->
      @if (loading()) {
        <div class="card p-6 space-y-3">@for (i of [1,2,3,4]; track i) { <div class="skeleton h-12"></div> }</div>
      } @else if (page(); as p) {
        @if (p.items.length === 0) {
          <div class="card p-10 text-center text-ink-500">
            <lucide-icon name="inbox" class="w-8 h-8 mx-auto mb-3 text-ink-300" />
            <p>{{ lang.t().officer.noResults }}</p>
          </div>
        } @else {
          <div class="card overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-ink-50 text-left text-xs uppercase text-ink-500 tracking-wide">
                <tr>
                  <th class="px-4 py-3 font-bold">{{ lang.t().common.reference }}</th>
                  <th class="px-4 py-3 font-bold">{{ lang.t().common.service }}</th>
                  <th class="px-4 py-3 font-bold hidden sm:table-cell">{{ lang.t().common.applicant }}</th>
                  <th class="px-4 py-3 font-bold">{{ lang.t().common.status }}</th>
                  <th class="px-4 py-3 font-bold hidden md:table-cell">{{ lang.t().officer.assignedTo }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ink-100">
                @for (a of p.items; track a.id) {
                  <tr class="hover:bg-civic-50/50 cursor-pointer transition-colors" (click)="open(a)">
                    <td class="px-4 py-3 font-mono text-xs text-ink-700 whitespace-nowrap">{{ a.referenceNumber }}</td>
                    <td class="px-4 py-3">
                      <span class="flex items-center gap-2">
                        <lucide-icon [name]="a.serviceIcon" class="w-4 h-4 text-civic-700 shrink-0" />
                        <span class="font-semibold text-ink-900">{{ lang.pick(a.serviceNameEn, a.serviceNameEs) }}</span>
                      </span>
                    </td>
                    <td class="px-4 py-3 text-ink-700 hidden sm:table-cell">{{ a.citizenName }}</td>
                    <td class="px-4 py-3"><app-status-badge [status]="a.status" /></td>
                    <td class="px-4 py-3 text-ink-500 hidden md:table-cell">{{ a.assignedOfficerName || lang.t().officer.unassigned }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (p.totalPages > 1) {
            <div class="flex items-center justify-center gap-3 mt-5 text-sm">
              <button (click)="go(p.page - 1)" [disabled]="p.page <= 1" class="btn-secondary px-3 py-2 min-h-0"><lucide-icon name="chevron-left" class="w-4 h-4" /></button>
              <span class="text-ink-700 num">{{ p.page }} / {{ p.totalPages }}</span>
              <button (click)="go(p.page + 1)" [disabled]="p.page >= p.totalPages" class="btn-secondary px-3 py-2 min-h-0"><lucide-icon name="chevron-right" class="w-4 h-4" /></button>
            </div>
          }
        }
      }
    </section>
  `
})
export class OfficerInboxComponent {
  readonly lang = inject(LanguageService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly statuses = ['Submitted', 'UnderReview', 'NeedsInfo', 'Approved', 'Rejected'];
  readonly page = signal<PagedResult<InboxItemDto> | null>(null);
  readonly stats = signal<InboxStatsDto | null>(null);
  readonly loading = signal(true);

  status = '';
  mine = false;
  search = '';
  private currentPage = signal(1);
  private debounce?: ReturnType<typeof setTimeout>;

  constructor() { this.loadStats(); this.reload(); }

  statCard(st: string): string {
    const active = this.status === st;
    return `card p-4 flex flex-col items-start gap-1 text-left transition-all hover:border-civic-700 ${active ? 'ring-2 ring-civic-700' : ''}`;
  }

  filterStatus(st: string): void { this.status = this.status === st ? '' : st; this.reload(); }
  debouncedReload(): void { clearTimeout(this.debounce); this.debounce = setTimeout(() => this.reload(), 300); }
  go(p: number): void { this.currentPage.set(p); this.reload(); }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      this.page.set(await this.api.getInbox({
        status: this.status || undefined, mine: this.mine || undefined,
        search: this.search.trim() || undefined, page: this.currentPage(), pageSize: 10
      }));
    } finally { this.loading.set(false); }
  }
  private async loadStats(): Promise<void> { try { this.stats.set(await this.api.getStats()); } catch { /* ignore */ } }

  open(a: InboxItemDto): void { this.router.navigate(['/officer', a.id]); }
}
