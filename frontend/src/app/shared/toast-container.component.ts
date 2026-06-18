import { Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,22rem)]" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="card flex items-start gap-3 p-3.5 shadow-lg border-l-4"
             [class.border-l-ok-700]="t.kind === 'success'"
             [class.border-l-danger-700]="t.kind === 'error'"
             [class.border-l-civic-700]="t.kind === 'info'">
          <lucide-icon [name]="t.kind === 'success' ? 'circle-check' : t.kind === 'error' ? 'circle-x' : 'info'"
                       class="w-5 h-5 shrink-0 mt-0.5"
                       [class.text-ok-700]="t.kind === 'success'"
                       [class.text-danger-700]="t.kind === 'error'"
                       [class.text-civic-700]="t.kind === 'info'" />
          <p class="text-sm text-ink-900 flex-1">{{ t.message }}</p>
          <button (click)="toasts.dismiss(t.id)" class="text-ink-500 hover:text-ink-900" aria-label="Dismiss">
            <lucide-icon name="x" class="w-4 h-4" />
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  readonly toasts = inject(ToastService);
}
