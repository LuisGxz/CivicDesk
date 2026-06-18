import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { parseApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';

interface DemoAccount { email: string; pass: string; role: 'Citizen' | 'Officer' | 'Supervisor'; icon: string; }

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-2 gap-10 items-start">
      <!-- form -->
      <div class="card p-6 sm:p-8 order-2 lg:order-1">
        <h1 class="text-2xl font-extrabold text-civic-900 mb-1">{{ lang.t().auth.title }}</h1>
        <p class="text-sm text-ink-700 mb-6">{{ lang.t().auth.subtitle }}</p>

        @if (errors().length) {
          <div class="rounded-lg bg-danger-100 border border-danger-700/30 p-3 mb-4">
            @for (e of errors(); track e) { <p class="text-sm text-danger-700 font-medium">{{ e }}</p> }
          </div>
        }

        <form (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="label" for="email">{{ lang.t().auth.email }}</label>
            <input id="email" name="email" type="email" class="input" [(ngModel)]="email" required autocomplete="email" />
          </div>
          <div>
            <label class="label" for="password">{{ lang.t().auth.password }}</label>
            <input id="password" name="password" type="password" class="input" [(ngModel)]="password" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn-primary w-full" [disabled]="loading()">
            @if (loading()) { {{ lang.t().common.loading }} } @else { <lucide-icon name="log-in" class="w-4 h-4" /> {{ lang.t().auth.login }} }
          </button>
        </form>

        <p class="text-sm text-ink-700 mt-5">
          {{ lang.t().auth.noAccount }}
          <a routerLink="/register" class="font-bold text-civic-700 hover:underline">{{ lang.t().auth.createAccount }}</a>
        </p>
        <a routerLink="/about" class="inline-block mt-3 text-sm font-bold text-civic-700 hover:underline">{{ lang.t().auth.aboutLink }}</a>
      </div>

      <!-- demo accounts -->
      <div class="order-1 lg:order-2">
        <div class="rounded-xl bg-civic-900 text-white p-6 sm:p-7">
          <div class="flex items-center gap-2 mb-2">
            <lucide-icon name="sparkles" class="w-5 h-5 text-civic-100" />
            <h2 class="font-extrabold">{{ lang.t().auth.demoAccounts }}</h2>
          </div>
          <p class="text-sm text-civic-100/80 mb-5">{{ lang.t().auth.subtitle }}</p>
          <div class="space-y-2.5">
            @for (a of accounts; track a.email) {
              <button (click)="useDemo(a)" [disabled]="loading()"
                class="w-full flex items-center gap-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors p-3 text-left">
                <span class="w-9 h-9 rounded-lg bg-white/15 grid place-items-center shrink-0">
                  <lucide-icon [name]="a.icon" class="w-4 h-4 text-white" />
                </span>
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-bold">{{ lang.role(a.role) }}</span>
                  <span class="block text-xs text-civic-100/70 truncate">{{ roleHint(a.role) }}</span>
                </span>
                <span class="text-xs font-bold bg-white text-civic-800 rounded px-2.5 py-1">{{ lang.t().auth.useAccount }}</span>
              </button>
            }
          </div>
          <p class="text-[11px] text-civic-100/60 mt-4 font-mono">citizen · officer · supervisor @civicdesk.gov</p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  readonly lang = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);

  readonly accounts: DemoAccount[] = [
    { email: 'citizen@civicdesk.gov', pass: 'Citizen123!', role: 'Citizen', icon: 'circle-user' },
    { email: 'officer@civicdesk.gov', pass: 'Officer123!', role: 'Officer', icon: 'clipboard-list' },
    { email: 'supervisor@civicdesk.gov', pass: 'Supervisor123!', role: 'Supervisor', icon: 'shield-check' }
  ];

  roleHint(role: string): string {
    const a = this.lang.t().auth;
    return role === 'Supervisor' ? a.supervisorDemo : role === 'Officer' ? a.officerDemo : a.citizenDemo;
  }

  useDemo(a: DemoAccount): void { this.email = a.email; this.password = a.pass; this.submit(); }

  async submit(): Promise<void> {
    this.errors.set([]);
    this.loading.set(true);
    try {
      await this.auth.login(this.email.trim(), this.password);
      const back = this.route.snapshot.queryParamMap.get('returnUrl');
      this.router.navigateByUrl(back || (this.auth.isStaff() ? '/officer' : '/applications'));
    } catch (e) {
      this.errors.set(parseApiError(e, this.lang.isEs() ? 'No se pudo iniciar sesión.' : 'Could not sign in.', this.lang.lang()));
    } finally {
      this.loading.set(false);
    }
  }
}
