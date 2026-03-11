import { CommChannel, CommDirection, CommStatus } from './enums';

export interface Communication {
  communicationId: string;
  clientId?: string | null;
  employeeId?: string | null;
  channel: CommChannel;
  direction: CommDirection;
  status: CommStatus;
  subject?: string | null;
  body: string;
  toAddress?: string | null;
  fromAddress?: string | null;
  externalMessageId?: string | null;
  templateId?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failureReason?: string | null;
  sentByEmployeeId?: string | null;
  parentMessageId?: string | null;
  attachmentUrls: string[];
  createdAt: string;
  client?: { clientId: string; firstName: string; lastName: string; email?: string };
}

export interface MessageTemplate {
  templateId: string;
  name: string;
  category: string;
  channel: CommChannel;
  subject?: string | null;
  body: string;
  variables: string[];
  whatsappTemplateName?: string | null;
  isActive: boolean;
  lastTestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageDto {
  clientId: string;
  channel: CommChannel;
  subject?: string;
  body: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

export interface CreateTemplateDto {
  name: string;
  category: string;
  channel: CommChannel;
  subject?: string;
  body: string;
  variables?: string[];
  whatsappTemplateName?: string;
}

export interface UpdateTemplateDto extends Partial<CreateTemplateDto> {}

export interface QueryCommunicationsDto {
  page?: number;
  limit?: number;
  channel?: CommChannel;
  clientId?: string;
  direction?: CommDirection;
}

// ─── Bulk Messaging Types ───────────────────────────────────────────

export type MessageMode = 'individual' | 'group' | 'category' | 'broadcast';

export interface AudienceFilters {
  statuses?: string[];
  clientTypes?: string[];
  segments?: string[];
  countries?: string[];
  tags?: string[];
  programIds?: string[];
  marketingOptInOnly?: boolean;
}

export interface SendBulkMessageDto {
  clientIds?: string[];
  filters?: AudienceFilters;
  channel: CommChannel;
  subject?: string;
  body: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

export interface PreviewAudienceDto {
  clientIds?: string[];
  filters?: AudienceFilters;
}

export interface BulkSendResult {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  communicationIds: string[];
}

export interface AudiencePreviewResult {
  count: number;
  clientIds: string[];
}
