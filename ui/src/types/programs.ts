import { ProgramType } from './enums';

export interface PricingTier {
  currency: string;
  amount: number;
  label: string;
  validUntil?: string;
}

export interface ProgramModule {
  moduleId: string;
  programId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  learningObjectives: string[];
  estimatedHours?: number | null;
  isOptional: boolean;
  materials?: string | null;
}

export interface Program {
  programId: string;
  code: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  type: ProgramType;
  durationWeeks?: number | null;
  durationLabel?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  targetAudience: string[];
  keyOutcomes: string[];
  isActive: boolean;
  isFeatured: boolean;
  bannerImageUrl?: string | null;
  pricingTiers: PricingTier[];
  trainerIds?: string[];
  modules?: ProgramModule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramDto {
  code: string;
  name: string;
  description: string;
  shortDescription?: string;
  type: ProgramType;
  durationWeeks?: number;
  durationLabel?: string;
  minAge?: number;
  maxAge?: number;
  targetAudience?: string[];
  keyOutcomes?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  pricingTiers?: PricingTier[];
}

export interface UpdateProgramDto extends Partial<CreateProgramDto> {}

export interface CreateProgramModuleDto {
  title: string;
  description?: string;
  orderIndex: number;
  learningObjectives?: string[];
  estimatedHours?: number;
  isOptional?: boolean;
  materials?: string;
}

export interface UpdateProgramModuleDto extends Partial<CreateProgramModuleDto> {}

export interface QueryProgramsDto {
  page?: number;
  limit?: number;
  search?: string;
  type?: ProgramType;
  isActive?: boolean;
}
