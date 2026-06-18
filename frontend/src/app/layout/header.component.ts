import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../core/auth.service';
import { LanguageService } from '../core/language.service';
import { TourService } from '../core/tour.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <!-- official government banner -->
    <div class="bg-civic-900 text-white text-xs px-4 sm:px-6 py-1.5 flex items-center gap-2">
      <lucide-icon name="landmark" class="w-3.5 h-3.5 shrink-0" />
      <span>{{ lang.t().officialBanner }}</span>
    </div>

    <header class="sticky top-0 z-40 bg-white border-b-4 border-civic-800">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between py-3 gap-3">
        <a routerLink="/" class="flex items-center gap-3 shrink-0">
          <span class="w-9 h-9 rounded-lg bg-civic-800 grid place-items-center">
            <lucide-icon name="building-2" class="w-5 h-5 text-white" />
          </span>
          <span class="leading-tight">
            <span class="block font-extrabold text-civic-900">{{ lang.t().brand }}</span>
            <span class="block text-[11px] text-ink-500 -mt-0.5">{{ lang.t().brandSub }}</span>
          </span>
        </a>

        <!-- desktop nav -->
        <nav class="hidden md:flex items-center gap-1 text-sm font-semibold">
          <a routerLink="/services" routerLinkActive="text-civic-800 bg-civic-50"
             class="px-3 py-2 rounded-lg text-ink-700 hover:text-civic-800 hover:bg-civic-50 transition-colors">{{ lang.t().nav.catalog }}</a>
          @if (auth.isAuthenticated() && !auth.isStaff()) {
            <a routerLink="/applications" routerLinkActive="text-civic-800 bg-civic-50"
               class="px-3 py-2 rounded-lg text-ink-700 hover:text-civic-800 hover:bg-civic-50 transition-colors">{{ lang.t().nav.myApplications }}</a>
          }
          @if (auth.isStaff()) {
            <a routerLink="/officer" routerLinkActive="text-civic-800 bg-civic-50"
               class="px-3 py-2 rounded-lg text-ink-700 hover:text-civic-800 hover:bg-civic-50 transition-colors">{{ lang.t().nav.inbox }}</a>
          }
          <a routerLink="/about" routerLinkActive="text-civic-800 bg-civic-50"
             class="px-3 py-2 rounded-lg text-ink-700 hover:text-civic-800 hover:bg-civic-50 transition-colors">{{ lang.t().nav.about }}</a>
        </nav>

        <div class="flex items-center gap-2 sm:gap-3">
          @if (auth.isAuthenticated()) {
            <button (click)="tour.start()" class="hidden sm:inline-flex btn-ghost px-3 py-2 min-h-0 text-xs">
              <lucide-icon name="circle-help" class="w-4 h-4" /> {{ lang.t().guide.replay }}
            </button>
          }
          <!-- language toggle -->
          <div class="flex rounded-lg border border-ink-300 overflow-hidden text-xs font-bold">
            <button (click)="lang.set('en')" [class]="lang.lang()==='en' ? active : idle" class="px-3 py-1.5 transition-colors">EN</button>
            <button (click)="lang.set('es')" [class]="lang.lang()==='es' ? active : idle" class="px-3 py-1.5 transition-colors">ES</button>
          </div>

          @if (auth.user(); as u) {
            <div class="hidden sm:flex items-center gap-2 text-sm">
              <span class="text-ink-700">{{ u.fullName }}</span>
              <button (click)="signOut()" class="btn-secondary px-3 py-2 min-h-0 text-xs">
                <lucide-icon name="log-out" class="w-4 h-4" /> {{ lang.t().nav.signOut }}
              </button>
            </div>
          } @else {
            <a routerLink="/login" class="btn-primary px-4 py-2 min-h-0 text-xs">
              <lucide-icon name="log-in" class="w-4 h-4" /> {{ lang.t().nav.signIn }}
            </a>
          }

          <button (click)="mobileOpen.set(!mobileOpen())" class="md:hidden p-2 text-ink-700" aria-label="Menu">
            <lucide-icon [name]="mobileOpen() ? 'x' : 'menu'" class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- mobile nav -->
      @if (mobileOpen()) {
        <nav class="md:hidden border-t border-ink-200 px-4 py-3 flex flex-col gap-1 text-sm font-semibold bg-white">
          <a routerLink="/services" (click)="mobileOpen.set(false)" class="px-3 py-2 rounded-lg text-ink-700 hover:bg-civic-50">{{ lang.t().nav.catalog }}</a>
          @if (auth.isAuthenticated() && !auth.isStaff()) {
            <a routerLink="/applications" (click)="mobileOpen.set(false)" class="px-3 py-2 rounded-lg text-ink-700 hover:bg-civic-50">{{ lang.t().nav.myApplications }}</a>
          }
          @if (auth.isStaff()) {
            <a routerLink="/officer" (click)="mobileOpen.set(false)" class="px-3 py-2 rounded-lg text-ink-700 hover:bg-civic-50">{{ lang.t().nav.inbox }}</a>
          }
          <a routerLink="/about" (click)="mobileOpen.set(false)" class="px-3 py-2 rounded-lg text-ink-700 hover:bg-civic-50">{{ lang.t().nav.about }}</a>
          @if (auth.user(); as u) {
            <button (click)="signOut()" class="text-left px-3 py-2 rounded-lg text-ink-700 hover:bg-civic-50">{{ lang.t().nav.signOut }} · {{ u.fullName }}</button>
          } @else {
            <a routerLink="/login" (click)="mobileOpen.set(false)" class="px-3 py-2 rounded-lg text-civic-800 font-bold">{{ lang.t().nav.signIn }}</a>
          }
        </nav>
      }
    </header>
  `
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);
  readonly tour = inject(TourService);
  private readonly router = inject(Router);

  readonly mobileOpen = signal(false);
  readonly active = 'bg-civic-800 text-white';
  readonly idle = 'bg-white text-ink-700 hover:bg-ink-100';

  async signOut(): Promise<void> {
    this.mobileOpen.set(false);
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
