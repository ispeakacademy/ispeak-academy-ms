import { ClientSegment } from '@/common/enums/client-segment.enum';
import { ClientType } from '@/common/enums/client-type.enum';
import { LeadSource } from '@/common/enums/lead-source.enum';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
	@IsNotEmpty()
	@IsString()
	firstName: string;

	@IsNotEmpty()
	@IsString()
	lastName: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsString()
	alternatePhone?: string;

	@IsOptional()
	@IsEnum(ClientType)
	clientType?: ClientType;

	@IsOptional()
	@IsEnum(ClientSegment)
	segment?: ClientSegment;

	@IsOptional()
	@IsBoolean()
	isCorporate?: boolean;

	@IsOptional()
	@IsString()
	organisationId?: string;

	@IsOptional()
	@IsString()
	country?: string;

	@IsOptional()
	@IsString()
	county?: string;

	@IsOptional()
	@IsString()
	city?: string;

	@IsOptional()
	@IsString()
	timezone?: string;

	@IsOptional()
	@IsEnum(LeadSource)
	leadSource?: LeadSource;

	@IsOptional()
	@IsString()
	referredById?: string;

	@IsOptional()
	@IsString()
	preferredCurrency?: string;

	@IsOptional()
	@IsString()
	kraPin?: string;

	@IsOptional()
	@IsBoolean()
	gdprConsent?: boolean;

	@IsOptional()
	@IsBoolean()
	marketingOptIn?: boolean;

	@IsOptional()
	@IsString()
	notes?: string;

	@IsOptional()
	@IsString()
	assignedToEmployeeId?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tags?: string[];
}
