import { ClientSegment, ClientStatus, ClientType, InteractionDirection, InteractionType, LeadSource } from './enums';

export interface Client {
  clientId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  profilePhotoUrl?: string | null;
  clientType: ClientType;
  segment?: ClientSegment | null;
  isCorporate: boolean;
  organisationId?: string | null;
  country?: string | null;
  county?: string | null;
  city?: string | null;
  timezone?: string | null;
  leadSource: LeadSource;
  referredById?: string | null;
  referralCode?: string | null;
  status: ClientStatus;
  tags: string[];
  preferredCurrency?: string | null;
  kraPin?: string | null;
  gdprConsent: boolean;
  gdprConsentAt?: string | null;
  marketingOptIn: boolean;
  notes?: string | null;
  assignedToEmployeeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientInteraction {
  interactionId: string;
  clientId: string;
  type: InteractionType;
  direction: InteractionDirection;
  summary: string;
  outcome?: string | null;
  followUpDate?: string | null;
  followUpNote?: string | null;
  createdByEmployeeId: string;
  linkedCommunicationId?: string | null;
  createdAt: string;
}

export interface Organisation {
  organisationId: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  kraPin?: string | null;
  billingEmail?: string | null;
  billingPhone?: string | null;
  billingAddress?: string | null;
  country?: string | null;
  primaryContactId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  clientType: ClientType;
  segment?: ClientSegment;
  isCorporate?: boolean;
  organisationId?: string;
  country?: string;
  county?: string;
  city?: string;
  timezone?: string;
  leadSource: LeadSource;
  referredById?: string;
  status?: ClientStatus;
  tags?: string[];
  preferredCurrency?: string;
  notes?: string;
  gdprConsent?: boolean;
  marketingOptIn?: boolean;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface CreateInteractionDto {
  type: InteractionType;
  direction: InteractionDirection;
  summary: string;
  outcome?: string;
  followUpDate?: string;
  followUpNote?: string;
}

export interface QueryClientsDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClientStatus;
  clientType?: ClientType;
  country?: string;
  leadSource?: LeadSource;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
