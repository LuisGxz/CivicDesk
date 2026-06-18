import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { parseApiError, parseFieldErrors } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { ToastService } from '../../core/toast.service';
import { DocumentDto, FormFieldDto, RequiredDocumentDto, ServiceDetailDto } from '../../core/models';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <section class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      @if (loading()) {
        <div class="card p-8"><div class="skeleton h-6 w-1/2 mb-6"></div><div class="skeleton h-32 w-full"></div></div>
      } @else if (detail(); as d) {
        <p class="text-sm text-ink-500 mb-1 num">
          {{ lang.t().apply.title }} · {{ lang.pick(d.service.nameEn, d.service.nameEs) }}
          @if (appRef()) { · {{ appRef() }} }
        </p>
        <h1 class="text-2xl font-extrabold text-civic-900 mb-6">{{ lang.pick(d.service.nameEn, d.service.nameEs) }}</h1>

        <!-- stepper -->
        <ol class="grid grid-cols-3 gap-2 mb-8 text-center text-xs font-bold">
          @for (s of steps; track s.i) {
            <li>
              <span class="block h-1.5 rounded-full mb-2" [class.bg-ok-700]="step() > s.i" [class.bg-civic-700]="step() === s.i" [class.bg-ink-200]="step() < s.i"></span>
              <span [class.text-ok-700]="step() > s.i" [class.text-civic-700]="step() === s.i" [class.text-ink-500]="step() < s.i">{{ label(s.i) }}</span>
            </li>
          }
        </ol>

        @if (errors().length) {
          <div class="rounded-lg bg-danger-100 border border-danger-700/30 p-3 mb-4">
            @for (e of errors(); track e) { <p class="text-sm text-danger-700 font-medium">{{ e }}</p> }
          </div>
        }

        <!-- STEP 1: details -->
        @if (step() === 1) {
          <div class="card p-6 sm:p-8 space-y-5">
            @for (f of d.fields; track f.key) {
              <div>
                <label class="label" [for]="f.key">
                  {{ lang.pick(f.labelEn, f.labelEs) }}
                  @if (!f.required) { <span class="text-ink-500 font-normal">· {{ lang.t().common.optional }}</span> }
                </label>
                @switch (f.type) {
                  @case ('Textarea') {
                    <textarea [id]="f.key" class="input min-h-24" rows="3" [(ngModel)]="values[f.key]" [maxlength]="f.maxLength || 2000"></textarea>
                  }
                  @case ('Select') {
                    <select [id]="f.key" class="input" [(ngModel)]="values[f.key]">
                      <option value="">—</option>
                      @for (o of f.options; track o.value) { <option [value]="o.value">{{ lang.pick(o.labelEn, o.labelEs) }}</option> }
                    </select>
                  }
                  @case ('Checkbox') {
                    <label class="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" class="w-5 h-5 accent-civic-800" [checked]="values[f.key] === 'true'"
                             (change)="values[f.key] = $any($event.target).checked ? 'true' : 'false'" />
                      <span class="text-sm text-ink-700">{{ lang.pick(f.helpTextEn, f.helpTextEs) || lang.pick(f.labelEn, f.labelEs) }}</span>
                    </label>
                  }
                  @case ('Number') { <input [id]="f.key" type="number" class="input" [(ngModel)]="values[f.key]" [min]="f.min ?? null" [max]="f.max ?? null" /> }
                  @case ('Date') { <input [id]="f.key" type="date" class="input" [(ngModel)]="values[f.key]" /> }
                  @default { <input [id]="f.key" type="text" class="input" [(ngModel)]="values[f.key]" [maxlength]="f.maxLength || 200" /> }
                }
                @if (f.helpTextEn && f.type !== 'Checkbox') { <p class="text-xs text-ink-500 mt-1.5">{{ lang.pick(f.helpTextEn, f.helpTextEs) }}</p> }
                @for (fe of fieldErrors()[f.key] || []; track fe) { <p class="field-error">{{ fe }}</p> }
              </div>
            }
            <div class="flex justify-end pt-2">
              <button (click)="saveDetails()" class="btn-primary" [disabled]="busy()">
                {{ lang.t().apply.saveContinue }} <lucide-icon name="arrow-right" class="w-4 h-4" />
              </button>
            </div>
          </div>
        }

        <!-- STEP 2: documents -->
        @if (step() === 2) {
          <div class="card p-6 sm:p-8">
            <h3 class="font-bold text-lg mb-1">{{ lang.t().apply.documents }}</h3>
            <p class="text-sm text-ink-700 mb-5">{{ lang.t().apply.uploadHint }}</p>
            <div class="space-y-3 mb-6">
              @for (doc of d.documents; track doc.key) {
                <div>
                  <p class="text-sm font-semibold mb-1.5">
                    {{ lang.pick(doc.labelEn, doc.labelEs) }}
                    @if (!doc.required) { <span class="text-ink-500 font-normal">· {{ lang.t().common.optional }}</span> }
                  </p>
                  @if (uploaded()[doc.key]; as up) {
                    <div class="flex items-center gap-3 rounded-lg border border-ok-700/40 bg-ok-100/50 p-3.5">
                      <lucide-icon name="file-check-2" class="w-5 h-5 text-ok-700 shrink-0" />
                      <span class="flex-1 min-w-0 text-sm font-medium truncate">{{ up.fileName }}</span>
                      <span class="text-xs font-bold text-ok-700">{{ lang.t().apply.verified }}</span>
                      <label class="text-xs font-bold text-civic-700 cursor-pointer hover:underline">
                        {{ lang.t().apply.replace }}
                        <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png" (change)="upload(doc, $event)" />
                      </label>
                    </div>
                  } @else if (uploading()[doc.key]) {
                    <div class="flex items-center gap-3 rounded-lg border border-ink-200 p-3.5">
                      <lucide-icon name="hourglass" class="w-5 h-5 text-civic-700 shrink-0 animate-pulse" />
                      <span class="text-sm text-ink-700">{{ lang.t().apply.uploading }}</span>
                    </div>
                  } @else {
                    <label class="flex flex-col items-center gap-1 rounded-lg border-2 border-dashed border-ink-300 p-5 text-center hover:border-civic-700 hover:bg-civic-50 transition-colors cursor-pointer">
                      <lucide-icon name="upload" class="w-6 h-6 text-ink-500 mb-1" />
                      <span class="text-sm font-semibold text-ink-900">{{ lang.t().apply.uploadHere }}</span>
                      <span class="text-xs text-ink-500">{{ lang.t().apply.maxSize }}</span>
                      <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png" (change)="upload(doc, $event)" />
                    </label>
                  }
                </div>
              }
            </div>
            <div class="flex items-center justify-between">
              <button (click)="step.set(1)" class="btn-secondary"><lucide-icon name="arrow-left" class="w-4 h-4" /> {{ lang.t().common.back }}</button>
              <button (click)="step.set(3)" class="btn-primary" [disabled]="!allRequiredUploaded()">
                {{ lang.t().common.next }} <lucide-icon name="arrow-right" class="w-4 h-4" />
              </button>
            </div>
          </div>
        }

        <!-- STEP 3: review -->
        @if (step() === 3) {
          <div class="card p-6 sm:p-8">
            <h3 class="font-bold text-lg mb-1">{{ lang.t().apply.review }}</h3>
            <p class="text-sm text-ink-700 mb-5">{{ lang.t().apply.reviewIntro }}</p>

            <dl class="divide-y divide-ink-100 mb-5">
              @for (f of d.fields; track f.key) {
                @if (values[f.key]) {
                  <div class="flex justify-between gap-4 py-2.5 text-sm">
                    <dt class="text-ink-500">{{ lang.pick(f.labelEn, f.labelEs) }}</dt>
                    <dd class="font-semibold text-ink-900 text-right">{{ display(f, values[f.key]) }}</dd>
                  </div>
                }
              }
              <div class="flex justify-between gap-4 py-2.5 text-sm">
                <dt class="text-ink-500">{{ lang.t().detail.documents }}</dt>
                <dd class="font-semibold text-ink-900 text-right">{{ uploadedCount() }}</dd>
              </div>
              <div class="flex justify-between gap-4 py-2.5 text-sm">
                <dt class="text-ink-500">{{ lang.t().common.fee }}</dt>
                <dd class="font-bold text-civic-900 num">{{ d.service.fee > 0 ? ('$' + d.service.fee.toFixed(2)) : lang.t().common.free }}</dd>
              </div>
            </dl>

            <div class="flex items-center justify-between">
              <button (click)="step.set(2)" class="btn-secondary"><lucide-icon name="arrow-left" class="w-4 h-4" /> {{ lang.t().common.back }}</button>
              <button (click)="submit()" class="btn-primary" [disabled]="busy()">
                <lucide-icon name="send" class="w-4 h-4" /> {{ lang.t().apply.confirmSubmit }}
              </button>
            </div>
          </div>
        }
      }
    </section>
  `
})
export class ApplyComponent {
  readonly lang = inject(LanguageService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly slug = input.required<string>();

  readonly steps = [{ i: 1 }, { i: 2 }, { i: 3 }];
  readonly detail = signal<ServiceDetailDto | null>(null);
  readonly loading = signal(true);
  readonly step = signal(1);
  readonly busy = signal(false);
  readonly errors = signal<string[]>([]);
  readonly fieldErrors = signal<Record<string, string[]>>({});

  readonly appId = signal<string | null>(null);
  readonly appRef = signal<string | null>(null);
  values: Record<string, string> = {};
  readonly uploaded = signal<Record<string, DocumentDto>>({});
  readonly uploading = signal<Record<string, boolean>>({});

  readonly allRequiredUploaded = computed(() => {
    const docs = this.detail()?.documents ?? [];
    const up = this.uploaded();
    return docs.filter(dd => dd.required).every(dd => up[dd.key]);
  });
  readonly uploadedCount = computed(() => Object.keys(this.uploaded()).length + (this.lang.isEs() ? ' archivo(s)' : ' file(s)'));

  constructor() {
    // input() resolves after construction; load lazily via effect-like microtask.
    queueMicrotask(() => this.load());
  }

  label(i: number): string {
    const a = this.lang.t().apply;
    return i === 1 ? a.details : i === 2 ? a.documents : a.review;
  }

  private async load(): Promise<void> {
    try { this.detail.set(await this.api.getService(this.slug())); }
    catch (e) { this.errors.set(parseApiError(e, 'Service not found.', this.lang.lang())); }
    finally { this.loading.set(false); }
  }

  display(f: FormFieldDto, value: string): string {
    if (f.type === 'Select') return this.lang.pick(...optionLabels(f, value));
    if (f.type === 'Checkbox') return value === 'true' ? (this.lang.isEs() ? 'Sí' : 'Yes') : 'No';
    return value;
  }

  async saveDetails(): Promise<void> {
    this.errors.set([]); this.fieldErrors.set({});
    this.busy.set(true);
    try {
      if (this.appId()) { this.step.set(2); return; } // already created — don't duplicate
      const created = await this.api.createApplication(this.slug(), this.cleanValues());
      this.appId.set(created.id);
      this.appRef.set(created.referenceNumber);
      this.step.set(2);
    } catch (e) {
      this.fieldErrors.set(parseFieldErrors(e));
      this.errors.set(parseApiError(e, this.lang.isEs() ? 'Revisa los campos.' : 'Please check the fields.', this.lang.lang()));
    } finally {
      this.busy.set(false);
    }
  }

  async upload(doc: RequiredDocumentDto, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.appId()) return;
    this.uploading.update(u => ({ ...u, [doc.key]: true }));
    this.errors.set([]);
    try {
      const result = await this.api.uploadDocument(this.appId()!, doc.key, file);
      this.uploaded.update(u => ({ ...u, [doc.key]: result }));
    } catch (e) {
      this.errors.set(parseApiError(e, this.lang.isEs() ? 'No se pudo subir el archivo.' : 'Could not upload the file.', this.lang.lang()));
    } finally {
      this.uploading.update(u => ({ ...u, [doc.key]: false }));
    }
  }

  async submit(): Promise<void> {
    if (!this.appId()) return;
    this.busy.set(true); this.errors.set([]);
    try {
      await this.api.submitApplication(this.appId()!);
      this.toast.success(this.lang.t().apply.submitted);
      this.router.navigate(['/applications', this.appId()]);
    } catch (e) {
      this.errors.set(parseApiError(e, this.lang.isEs() ? 'No se pudo enviar.' : 'Could not submit.', this.lang.lang()));
    } finally {
      this.busy.set(false);
    }
  }

  private cleanValues(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(this.values)) if (v != null && String(v).trim() !== '') out[k] = String(v).trim();
    return out;
  }
}

function optionLabels(f: FormFieldDto, value: string): [string, string] {
  const o = f.options.find(x => x.value === value);
  return [o?.labelEn ?? value, o?.labelEs ?? value];
}
