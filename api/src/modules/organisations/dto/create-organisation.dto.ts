import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateOrganisationDto {
	@IsNotEmpty()
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	industry?: string;

	@IsOptional()
	@IsUrl()
	website?: string;

	@IsOptional()
	@IsString()
	kraPin?: string;

	@IsOptional()
	@IsEmail()
	billingEmail?: string;

	@IsOptional()
	@IsString()
	billingPhone?: string;

	@IsOptional()
	@IsString()
	billingAddress?: string;

	@IsOptional()
	@IsString()
	country?: string;

	@IsOptional()
	@IsString()
	primaryContactId?: string;
}
