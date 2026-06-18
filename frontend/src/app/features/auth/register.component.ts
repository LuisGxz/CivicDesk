import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { parseApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div class="card p-6 sm:p-8">
        <h1 class="text-2xl font-extrabold text-civic-900 mb-1">{{ lang.t().auth.register }}</h1>
        <p class="text-sm text-ink-700 mb-6">{{ lang.t().auth.subtitle }}</p>

        @if (errors().length) {
          <div class="rounded-lg bg-danger-100 border border-danger-700/30 p-3 mb-4">
            @for (e of errors(); track e) { <p class="text-sm text-danger-700 font-medium">{{ e }}</p> }
          </div>
        }

        <form (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="label" for="name">{{ lang.t().auth.fullName }}</label>
            <input id="name" name="name" class="input" [(ngModel)]="fullName" required autocomplete="name" />
          </div>
          <div>
            <label class="label" for="email">{{ lang.t().auth.email }}</label>
            <input id="email" name="email" type="email" class="input" [(ngModel)]="email" required autocomplete="email" />
          </div>
          <div>
            <label class="label" for="password">{{ lang.t().auth.password }}</label>
            <input id="password" name="password" type="password" class="input" [(ngModel)]="password" required autocomplete="new-password" />
            <p class="text-xs text-ink-500 mt-1.5">{{ lang.isEs() ? 'Mínimo 8 caracteres, con mayúscula, minúscula y un número.' : 'At least 8 characters, with an uppercase, lowercase and a number.' }}</p>
          </div>
          <button type="submit" class="btn-primary w-full" [disabled]="loading()">
            @if (loading()) { {{ lang.t().common.loading }} } @else { {{ lang.t().auth.createAccount }} }
          </button>
        </form>

        <p class="text-sm text-ink-700 mt-5">
          {{ lang.t().auth.haveAccount }}
          <a routerLink="/login" class="font-bold text-civic-700 hover:underline">{{ lang.t().auth.login }}</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  readonly lang = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);

  async submit(): Promise<void> {
    this.errors.set([]);
    this.loading.set(true);
    try {
      await this.auth.register(this.email.trim(), this.password, this.fullName.trim());
      this.router.navigateByUrl('/applications');
    } catch (e) {
      this.errors.set(parseApiError(e, this.lang.isEs() ? 'No se pudo crear la cuenta.' : 'Could not create the account.', this.lang.lang()));
    } finally {
      this.loading.set(false);
    }
  }
}
