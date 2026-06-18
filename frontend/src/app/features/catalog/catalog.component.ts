import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';
import { ServiceSummaryDto } from '../../core/models';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div class="max-w-2xl mb-8">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-civic-900 mb-2">{{ lang.t().home.heroTitle }}</h1>
        <p class="text-ink-700">{{ lang.t().home.heroSubtitle }}</p>
        <div class="mt-5 flex rounded-lg border-2 border-ink-300 bg-white overflow-hidden focus-within:border-civic-700 transition-colors">
          <span class="grid place-items-center pl-4"><lucide-icon name="search" class="w-5 h-5 text-ink-500" /></span>
          <input class="flex-1 px-3 py-3.5 text-sm outline-none" [(ngModel)]="search" (ngModelChange)="onSearch()"
                 [placeholder]="lang.t().home.searchPlaceholder" [attr.aria-label]="lang.t().common.search" />
        </div>
      </div>

      <!-- category filter -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button (click)="setCategory(null)" [class]="chip(null)">{{ lang.t().home.all }}</button>
        @for (c of categories; track c) {
          <button (click)="setCategory(c)" [class]="chip(c)">{{ lang.category(c) }}</button>
        }
      </div>

      @if (loading()) {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) { <div class="card p-5 h-44"><div class="skeleton w-11 h-11 mb-4"></div><div class="skeleton h-4 w-2/3 mb-2"></div><div class="skeleton h-3 w-full mb-1"></div><div class="skeleton h-3 w-1/2"></div></div> }
        </div>
      } @else if (filtered().length === 0) {
        <div class="card p-10 text-center text-ink-500">
          <lucide-icon name="search" class="w-8 h-8 mx-auto mb-3 text-ink-300" />
          <p>{{ lang.t().home.empty }}</p>
        </div>
      } @else {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (s of filtered(); track s.id) {
            <button (click)="apply(s)" class="group text-left card p-5 hover:border-civic-700 hover:shadow-md transition-all">
              <div class="w-11 h-11 rounded-lg bg-civic-50 grid place-items-center mb-4 group-hover:bg-civic-800 transition-colors">
                <lucide-icon [name]="s.icon" class="w-5 h-5 text-civic-800 group-hover:text-white transition-colors" />
              </div>
              <p class="font-bold mb-1 text-ink-900">{{ lang.pick(s.nameEn, s.nameEs) }}</p>
              <p class="text-sm text-ink-700 mb-4 line-clamp-2">{{ lang.pick(s.descriptionEn, s.descriptionEs) }}</p>
              <div class="flex items-center justify-between text-xs">
                <span class="text-ink-500 flex items-center gap-1.5">
                  <lucide-icon name="clock" class="w-3.5 h-3.5" />{{ lang.pick(s.processingTimeEn, s.processingTimeEs) }}
                </span>
                <span class="font-bold num text-civic-900">{{ s.fee > 0 ? ('$' + s.fee.toFixed(0)) : lang.t().common.free }}</span>
              </div>
            </button>
          }
        </div>
      }
    </section>
  `
})
export class CatalogComponent {
  readonly lang = inject(LanguageService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly categories = ['Business', 'Permits', 'Records', 'Community'];
  readonly services = signal<ServiceSummaryDto[]>([]);
  readonly loading = signal(true);
  readonly category = signal<string | null>(null);
  search = '';
  private searchTerm = signal('');

  readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const cat = this.category();
    return this.services().filter(s => {
      if (cat && s.category !== cat) return false;
      if (!term) return true;
      return (s.nameEn + s.nameEs + s.descriptionEn + s.descriptionEs).toLowerCase().includes(term);
    });
  });

  constructor() { this.load(); }

  private async load(): Promise<void> {
    try { this.services.set(await this.api.getServices()); }
    finally { this.loading.set(false); }
  }

  onSearch(): void { this.searchTerm.set(this.search); }
  setCategory(c: string | null): void { this.category.set(c); }
  chip(c: string | null): string {
    const active = this.category() === c;
    return `px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${active ? 'bg-civic-800 text-white' : 'bg-white border border-ink-300 text-ink-700 hover:bg-ink-100'}`;
  }

  apply(s: ServiceSummaryDto): void {
    if (this.auth.isStaff()) { this.router.navigate(['/officer']); return; }
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/services/${s.slug}/apply` } });
      return;
    }
    this.router.navigate(['/services', s.slug, 'apply']);
  }
}
