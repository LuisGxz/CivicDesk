import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './config';
import {
  ApplicationDetailDto, ApplicationSummaryDto, AuditEntryDto, DocumentDto, InboxItemDto, InboxStatsDto,
  PagedResult, ServiceDetailDto, ServiceSummaryDto, StaffDto
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private get<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== '') p = p.set(k, String(v));
    return firstValueFrom(this.http.get<T>(`${API_URL}${url}`, { params: p }));
  }
  private post<T>(url: string, body?: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(`${API_URL}${url}`, body ?? {}));
  }

  // ── Catalog (public) ──
  getServices(category?: string, search?: string) {
    return this.get<ServiceSummaryDto[]>('/services', { category, search });
  }
  getService(slug: string) { return this.get<ServiceDetailDto>(`/services/${slug}`); }

  // ── Citizen applications ──
  getMyApplications() { return this.get<ApplicationSummaryDto[]>('/applications'); }
  getApplication(id: string) { return this.get<ApplicationDetailDto>(`/applications/${id}`); }
  createApplication(serviceSlug: string, values: Record<string, string>) {
    return this.post<ApplicationSummaryDto>('/applications', { serviceSlug, values });
  }
  uploadDocument(id: string, slotKey: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    form.append('slotKey', slotKey);
    return firstValueFrom(this.http.post<DocumentDto>(`${API_URL}/applications/${id}/documents`, form));
  }
  submitApplication(id: string) { return this.post<ApplicationSummaryDto>(`/applications/${id}/submit`); }
  resubmitApplication(id: string, note?: string) { return this.post<ApplicationSummaryDto>(`/applications/${id}/resubmit`, { note }); }
  documentUrl(id: string, docId: string) { return `${API_URL}/applications/${id}/documents/${docId}`; }

  // ── Officer ──
  getInbox(opts: { status?: string; mine?: boolean; service?: string; search?: string; page?: number; pageSize?: number }) {
    return this.get<PagedResult<InboxItemDto>>('/officer/applications', opts);
  }
  getOfficerApplication(id: string) { return this.get<ApplicationDetailDto>(`/officer/applications/${id}`); }
  getStats() { return this.get<InboxStatsDto>('/officer/stats'); }
  claim(id: string) { return this.post<ApplicationDetailDto>(`/officer/applications/${id}/claim`); }
  requestInfo(id: string, messageEn: string, messageEs: string) {
    return this.post<ApplicationDetailDto>(`/officer/applications/${id}/request-info`, { messageEn, messageEs });
  }
  approve(id: string, noteEn?: string, noteEs?: string) {
    return this.post<ApplicationDetailDto>(`/officer/applications/${id}/approve`, { noteEn, noteEs });
  }
  reject(id: string, reasonEn: string, reasonEs: string) {
    return this.post<ApplicationDetailDto>(`/officer/applications/${id}/reject`, { reasonEn, reasonEs });
  }
  addComment(id: string, body: string, isInternal: boolean) {
    return this.post<ApplicationDetailDto>(`/officer/applications/${id}/comments`, { body, isInternal });
  }
  reviewDocument(id: string, docId: string, approve: boolean) {
    return this.post<ApplicationDetailDto>(`/officer/applications/${id}/documents/${docId}/review`, { approve });
  }
  officerDocumentUrl(id: string, docId: string) { return `${API_URL}/officer/applications/${id}/documents/${docId}`; }

  // ── Supervisor ──
  assign(id: string, officerId: string) { return this.post<ApplicationDetailDto>(`/officer/applications/${id}/assign`, { officerId }); }
  getStaff() { return this.get<StaffDto[]>('/officer/staff'); }
  getAudit(take = 50) { return this.get<AuditEntryDto[]>('/officer/audit', { take }); }
}
