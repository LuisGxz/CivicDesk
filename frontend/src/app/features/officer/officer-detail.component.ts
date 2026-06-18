import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { parseApiError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';
import { ToastService } from '../../core/toast.service';
import { ApplicationDetailDto, StaffDto } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { TimelineComponent } from '../../shared/timeline.component';

type Panel = 'none' | 'requestInfo' | 'approve' | 'reject';

@Component({
  selector: 'app-officer-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, LucideAngularModule, StatusBadgeComponent, TimelineComponent],
  template: `
    <section class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <a routerLink="/officer" class="inline-flex items-center gap-1.5 text-sm font-semibold text-civic-700 hover:underline mb-5">
        <lucide-icon name="arrow-left" class="w-4 h-4" /> {{ lang.t().officer.inbox }}
      </a>

      @if (loading()) {
        <div class="card p-8 skeleton h-40"></div>
      } @else if (app(); as a) {
        <div class="card p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xs text-ink-500 num">{{ a.referenceNumber }} · {{ a.citizenName }}
              @if (a.submittedAtUtc) { · {{ a.submittedAtUtc | date:'mediumDate':undefined:lang.dateLocale() }} }</p>
            <h1 class="text-xl font-extrabold text-civic-900">{{ lang.pick(a.service.nameEn, a.service.nameEs) }}</h1>
            <p class="text-xs text-ink-500 mt-0.5">{{ lang.t().officer.assignedTo }}: {{ a.assignedOfficerName || lang.t().officer.unassigned }}</p>
          </div>
          <app-status-badge [status]="a.status" />
        </div>

        @if (errors().length) {
          <div class="rounded-lg bg-danger-100 border border-danger-700/30 p-3 mb-4">
            @for (e of errors(); track e) { <p class="text-sm text-danger-700 font-medium">{{ e }}</p> }
          </div>
        }

        <!-- action bar -->
        <div class="card p-4 mb-6">
          <div class="flex flex-wrap items-center gap-2">
            @if (a.status === 'Submitted' || a.status === 'NeedsInfo') {
              <button (click)="claim(a.id)" class="btn-primary" [disabled]="busy()"><lucide-icon name="list-checks" class="w-4 h-4" /> {{ lang.t().officer.claim }}</button>
            }
            @if (a.status === 'UnderReview') {
              <button (click)="toggle('requestInfo')" class="btn-secondary"><lucide-icon name="message-square" class="w-4 h-4" /> {{ lang.t().officer.requestInfo }}</button>
              <button (click)="toggle('approve')" class="btn-primary"><lucide-icon name="check" class="w-4 h-4" /> {{ lang.t().officer.approve }}</button>
              <button (click)="toggle('reject')" class="btn-danger"><lucide-icon name="ban" class="w-4 h-4" /> {{ lang.t().officer.reject }}</button>
            }
            @if (auth.isSupervisor() && a.status !== 'Approved' && a.status !== 'Rejected') {
              <div class="flex items-center gap-2 ml-auto">
                <select class="input w-auto py-2 text-sm" [(ngModel)]="assignTo">
                  <option value="">{{ lang.t().officer.assignTo }}…</option>
                  @for (s of staff(); track s.id) { <option [value]="s.id">{{ s.fullName }}{{ s.department ? ' · ' + s.department : '' }}</option> }
                </select>
                <button (click)="assign(a.id)" class="btn-secondary" [disabled]="!assignTo || busy()"><lucide-icon name="user-cog" class="w-4 h-4" /> {{ lang.t().officer.assign }}</button>
              </div>
            }
          </div>

          <!-- request-info panel -->
          @if (panel() === 'requestInfo') {
            <div class="mt-4 pt-4 border-t border-ink-100 space-y-3">
              <p class="font-bold text-sm">{{ lang.t().officer.requestInfoTitle }}</p>
              <div><label class="label">{{ lang.t().officer.messageEn }}</label><textarea class="input" rows="2" [(ngModel)]="msgEn"></textarea></div>
              <div><label class="label">{{ lang.t().officer.messageEs }}</label><textarea class="input" rows="2" [(ngModel)]="msgEs"></textarea></div>
              <div class="flex gap-2"><button (click)="requestInfo(a.id)" class="btn-primary" [disabled]="busy()">{{ lang.t().officer.confirm }}</button><button (click)="toggle('none')" class="btn-secondary">{{ lang.t().common.cancel }}</button></div>
            </div>
          }
          @if (panel() === 'approve') {
            <div class="mt-4 pt-4 border-t border-ink-100 space-y-3">
              <p class="font-bold text-sm">{{ lang.t().officer.approveTitle }}</p>
              <div><label class="label">{{ lang.t().officer.noteEnOptional }}</label><input class="input" [(ngModel)]="noteEn" /></div>
              <div><label class="label">{{ lang.t().officer.noteEsOptional }}</label><input class="input" [(ngModel)]="noteEs" /></div>
              <div class="flex gap-2"><button (click)="approve(a.id)" class="btn-primary" [disabled]="busy()">{{ lang.t().officer.confirm }}</button><button (click)="toggle('none')" class="btn-secondary">{{ lang.t().common.cancel }}</button></div>
            </div>
          }
          @if (panel() === 'reject') {
            <div class="mt-4 pt-4 border-t border-ink-100 space-y-3">
              <p class="font-bold text-sm">{{ lang.t().officer.rejectTitle }}</p>
              <div><label class="label">{{ lang.t().officer.reasonEn }}</label><textarea class="input" rows="2" [(ngModel)]="reasonEn"></textarea></div>
              <div><label class="label">{{ lang.t().officer.reasonEs }}</label><textarea class="input" rows="2" [(ngModel)]="reasonEs"></textarea></div>
              <div class="flex gap-2"><button (click)="reject(a.id)" class="btn-danger" [disabled]="busy()">{{ lang.t().officer.confirm }}</button><button (click)="toggle('none')" class="btn-secondary">{{ lang.t().common.cancel }}</button></div>
            </div>
          }
        </div>

        <div class="grid md:grid-cols-5 gap-6">
          <!-- left: details + documents -->
          <div class="md:col-span-2 space-y-6">
            <div class="card p-6">
              <h2 class="font-bold text-ink-900 mb-3">{{ lang.t().detail.details }}</h2>
              <dl class="space-y-2.5 text-sm">
                @for (f of a.fields; track f.key) {
                  <div><dt class="text-ink-500">{{ lang.pick(f.labelEn, f.labelEs) }}</dt><dd class="font-semibold text-ink-900">{{ f.value }}</dd></div>
                }
              </dl>
            </div>
            <div class="card p-6">
              <h2 class="font-bold text-ink-900 mb-3">{{ lang.t().detail.documents }}</h2>
              <ul class="space-y-2.5">
                @for (d of a.documents; track d.id) {
                  <li class="flex items-center gap-2 text-sm">
                    <lucide-icon name="paperclip" class="w-4 h-4 text-ink-500 shrink-0" />
                    <a [href]="api.officerDocumentUrl(a.id, d.id)" target="_blank" rel="noopener" class="text-civic-700 hover:underline truncate flex-1">{{ d.fileName }}</a>
                    @if (d.status === 'Verified') { <lucide-icon name="badge-check" class="w-4 h-4 text-ok-700" /> }
                    @else if (d.status === 'Pending') {
                      <button (click)="verifyDoc(a.id, d.id, true)" class="text-xs font-bold text-ok-700 hover:underline">{{ lang.t().officer.verify }}</button>
                    }
                  </li>
                }
              </ul>
            </div>
          </div>

          <!-- right: timeline + notes -->
          <div class="md:col-span-3 space-y-6">
            <div class="card p-6">
              <h2 class="font-bold text-ink-900 mb-5">{{ lang.t().detail.timeline }}</h2>
              <app-timeline [events]="a.timeline" />
            </div>

            <div class="card p-6">
              <h2 class="font-bold text-ink-900 mb-3">{{ lang.t().detail.messages }}</h2>
              @if (a.comments.length) {
                <ul class="space-y-3 mb-4">
                  @for (c of a.comments; track c.id) {
                    <li class="text-sm rounded-lg p-3" [class.bg-warn-100]="c.isInternal" [class.bg-ink-50]="!c.isInternal">
                      <p class="text-xs text-ink-500">{{ c.authorName }} · {{ lang.role(c.authorRole) }} · {{ c.createdAtUtc | date:'short':undefined:lang.dateLocale() }}
                        @if (c.isInternal) { · <span class="font-bold text-warn-700">{{ lang.isEs() ? 'interna' : 'internal' }}</span> }</p>
                      <p class="text-ink-900">{{ c.body }}</p>
                    </li>
                  }
                </ul>
              }
              <textarea class="input mb-2" rows="2" [(ngModel)]="comment" [placeholder]="lang.t().officer.addComment"></textarea>
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                  <input type="checkbox" class="w-4 h-4 accent-civic-800" [(ngModel)]="internal" /> {{ lang.t().officer.internalNote }}
                </label>
                <button (click)="addComment(a.id)" class="btn-secondary px-4 py-2 min-h-0" [disabled]="!comment.trim() || busy()">
                  <lucide-icon name="send" class="w-4 h-4" /> {{ lang.t().officer.postComment }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </section>
  `
})
export class OfficerDetailComponent {
  readonly lang = inject(LanguageService);
  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();
  readonly app = signal<ApplicationDetailDto | null>(null);
  readonly staff = signal<StaffDto[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly errors = signal<string[]>([]);
  readonly panel = signal<Panel>('none');

  msgEn = ''; msgEs = ''; noteEn = ''; noteEs = ''; reasonEn = ''; reasonEs = '';
  comment = ''; internal = true; assignTo = '';

  constructor() {
    queueMicrotask(() => this.load());
    if (this.auth.isSupervisor()) this.api.getStaff().then(s => this.staff.set(s)).catch(() => {});
  }

  toggle(p: Panel): void { this.panel.set(this.panel() === p ? 'none' : p); }

  private async load(): Promise<void> {
    this.loading.set(true);
    try { this.app.set(await this.api.getOfficerApplication(this.id())); }
    catch (e) { this.errors.set(parseApiError(e, 'Not found.', this.lang.lang())); }
    finally { this.loading.set(false); }
  }

  private apply(p: Promise<ApplicationDetailDto>, successMsg: string): void {
    this.busy.set(true); this.errors.set([]);
    p.then(updated => { this.app.set(updated); this.panel.set('none'); this.toast.success(successMsg); })
      .catch(e => this.errors.set(parseApiError(e, this.lang.isEs() ? 'No se pudo completar la acción.' : 'Could not complete the action.', this.lang.lang())))
      .finally(() => this.busy.set(false));
  }

  claim(id: string) { this.apply(this.api.claim(id), this.lang.isEs() ? 'Caso tomado.' : 'Case taken.'); }
  requestInfo(id: string) { this.apply(this.api.requestInfo(id, this.msgEn.trim(), this.msgEs.trim()), this.lang.isEs() ? 'Cambios solicitados.' : 'Changes requested.'); }
  approve(id: string) { this.apply(this.api.approve(id, this.noteEn.trim() || undefined, this.noteEs.trim() || undefined), this.lang.isEs() ? 'Aprobada.' : 'Approved.'); }
  reject(id: string) { this.apply(this.api.reject(id, this.reasonEn.trim(), this.reasonEs.trim()), this.lang.isEs() ? 'Rechazada.' : 'Rejected.'); }
  assign(id: string) { this.apply(this.api.assign(id, this.assignTo), this.lang.isEs() ? 'Asignada.' : 'Assigned.'); }
  verifyDoc(id: string, docId: string, approve: boolean) { this.apply(this.api.reviewDocument(id, docId, approve), this.lang.isEs() ? 'Documento verificado.' : 'Document verified.'); }
  addComment(id: string) {
    const body = this.comment.trim(); if (!body) return;
    this.apply(this.api.addComment(id, body, this.internal), this.lang.isEs() ? 'Nota agregada.' : 'Note added.');
    this.comment = '';
  }
}
