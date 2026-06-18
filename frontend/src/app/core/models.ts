export type Role = 'Citizen' | 'Officer' | 'Supervisor';

export type ApplicationStatus = 'Draft' | 'Submitted' | 'UnderReview' | 'NeedsInfo' | 'Approved' | 'Rejected';
export type FieldType = 'Text' | 'Textarea' | 'Number' | 'Date' | 'Select' | 'Checkbox';
export type DocStatus = 'Pending' | 'Verified' | 'Rejected';

export interface UserDto { id: string; email: string; fullName: string; role: Role; department: string | null; }
export interface AuthResponse { accessToken: string; refreshToken: string; expiresInSeconds: number; user: UserDto; }

export interface OptionDto { value: string; labelEn: string; labelEs: string; }
export interface FormFieldDto {
  key: string; labelEn: string; labelEs: string; helpTextEn: string | null; helpTextEs: string | null;
  type: FieldType; required: boolean; sortOrder: number; options: OptionDto[];
  maxLength: number | null; min: number | null; max: number | null;
}
export interface RequiredDocumentDto {
  key: string; labelEn: string; labelEs: string; hintEn: string | null; hintEs: string | null;
  required: boolean; sortOrder: number;
}
export interface ServiceSummaryDto {
  id: string; slug: string; nameEn: string; nameEs: string; descriptionEn: string; descriptionEs: string;
  icon: string; category: string; fee: number; processingTimeEn: string; processingTimeEs: string;
}
export interface ServiceDetailDto {
  service: ServiceSummaryDto; fields: FormFieldDto[]; documents: RequiredDocumentDto[];
}

export interface ApplicationSummaryDto {
  id: string; referenceNumber: string; serviceSlug: string; serviceNameEn: string; serviceNameEs: string;
  serviceIcon: string; status: ApplicationStatus; fee: number;
  createdAtUtc: string; submittedAtUtc: string | null; updatedAtUtc: string;
}
export interface FieldValueDto { key: string; labelEn: string; labelEs: string; type: FieldType; value: string; }
export interface DocumentDto {
  id: string; slotKey: string; fileName: string; contentType: string; sizeBytes: number; status: DocStatus; uploadedAtUtc: string;
}
export interface TimelineEventDto {
  status: ApplicationStatus; titleEn: string; titleEs: string; detailEn: string | null; detailEs: string | null; occurredAtUtc: string;
}
export interface CommentDto {
  id: string; authorName: string; authorRole: string; body: string; isInternal: boolean; createdAtUtc: string;
}
export interface ApplicationDetailDto {
  id: string; referenceNumber: string; status: ApplicationStatus; fee: number;
  createdAtUtc: string; submittedAtUtc: string | null; decidedAtUtc: string | null; updatedAtUtc: string;
  service: ServiceSummaryDto;
  assignedOfficerId: string | null; assignedOfficerName: string | null; citizenName: string;
  fields: FieldValueDto[]; requiredDocuments: RequiredDocumentDto[]; documents: DocumentDto[];
  timeline: TimelineEventDto[]; comments: CommentDto[];
}

export interface InboxItemDto {
  id: string; referenceNumber: string; serviceNameEn: string; serviceNameEs: string; serviceIcon: string;
  citizenName: string; status: ApplicationStatus; assignedOfficerId: string | null; assignedOfficerName: string | null;
  submittedAtUtc: string | null; updatedAtUtc: string;
}
export interface PagedResult<T> { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number; }
export interface StaffDto { id: string; fullName: string; role: Role; department: string | null; }
export interface InboxStatsDto {
  submitted: number; underReview: number; needsInfo: number; approved: number; rejected: number; assignedToMe: number;
}
export interface AuditEntryDto {
  id: string; actorEmail: string; actorRole: string; action: string; entityType: string; entityId: string | null;
  metadata: string | null; ipAddress: string | null; occurredAtUtc: string;
}
