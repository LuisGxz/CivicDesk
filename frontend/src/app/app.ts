import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { LanguageService } from './core/language.service';
import { TourService } from './core/tour.service';
import { HeaderComponent } from './layout/header.component';
import { FooterComponent } from './layout/footer.component';
import { ToastContainerComponent } from './shared/toast-container.component';
import { DemoGuideComponent } from './shared/demo-guide.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastContainerComponent, DemoGuideComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-header />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer />
    </div>
    <app-toast-container />
    <app-demo-guide />
  `
})
export class App {
  private readonly lang = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly tour = inject(TourService);

  constructor() {
    document.documentElement.lang = this.lang.lang();
    // Auto-start the how-to-explore guide the first time a session is present.
    effect(() => {
      if (this.auth.isAuthenticated()) this.tour.maybeAutoStart();
    });
  }
}
