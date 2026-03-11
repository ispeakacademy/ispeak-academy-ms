import { InvoiceType } from '@/common/enums/invoice-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
	ArrayMinSize,
	IsDate,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	Min,
	ValidateNested,
} from 'class-validator';

export class CreateLineItemDto {
	@ApiProperty({ description: 'Line item description' })
	@IsNotEmpty()
	@IsString()
	description: string;

	@ApiProperty({ description: 'Associated program ID', required: false })
	@IsOptional()
	@IsUUID()
	programId?: string;

	@ApiProperty({ description: 'Unit price', minimum: 0 })
	@IsNumber()
	@Min(0)
	unitPrice: number;

	@ApiProperty({ description: 'Quantity', minimum: 1, default: 1, required: false })
	@IsOptional()
	@IsNumber()
	@Min(1)
	quantity?: number = 1;
}

export class CreateInvoiceDto {
	@ApiProperty({ description: 'Client ID', required: false })
	@IsOptional()
	@IsUUID()
	clientId?: string;

	@ApiProperty({ description: 'Organisation ID for corporate billing', required: false })
	@IsOptional()
	@IsUUID()
	organisationId?: string;

	@ApiProperty({ description: 'Enrollment ID', required: false })
	@IsOptional()
	@IsUUID()
	enrollmentId?: string;

	@ApiProperty({ description: 'Invoice type', enum: InvoiceType })
	@IsEnum(InvoiceType)
	type: InvoiceType;

	@ApiProperty({ description: 'Currency code (ISO 4217)', default: 'KES', required: false })
	@IsOptional()
	@IsString()
	currency?: string = 'KES';

	@ApiProperty({ description: 'Discount percentage', minimum: 0, maximum: 100, required: false })
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(100)
	discountPercent?: number;

	@ApiProperty({ description: 'Tax percentage (e.g., 16 for VAT)', minimum: 0, maximum: 100, required: false })
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(100)
	taxPercent?: number;

	@ApiProperty({ description: 'Invoice due date' })
	@Transform(({ value }) => new Date(value))
	@IsDate()
	dueDate: Date;

	@ApiProperty({ description: 'Additional notes', required: false })
	@IsOptional()
	@IsString()
	notes?: string;

	@ApiProperty({ description: 'Invoice line items', type: [CreateLineItemDto] })
	@ValidateNested({ each: true })
	@Type(() => CreateLineItemDto)
	@ArrayMinSize(1)
	lineItems: CreateLineItemDto[];
}
