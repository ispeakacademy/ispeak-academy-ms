import { InvoiceStatus } from '@/common/enums/invoice-status.enum';
import { InvoiceType } from '@/common/enums/invoice-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryInvoicesDto {
	@ApiProperty({ description: 'Page number', default: 1, required: false })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@ApiProperty({ description: 'Items per page', default: 20, required: false })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@ApiProperty({ description: 'Filter by invoice status', enum: InvoiceStatus, required: false })
	@IsOptional()
	@IsEnum(InvoiceStatus)
	status?: InvoiceStatus;

	@ApiProperty({ description: 'Filter by invoice type', enum: InvoiceType, required: false })
	@IsOptional()
	@IsEnum(InvoiceType)
	type?: InvoiceType;

	@ApiProperty({ description: 'Filter by client ID', required: false })
	@IsOptional()
	@IsString()
	clientId?: string;

	@ApiProperty({ description: 'Search by invoice number', required: false })
	@IsOptional()
	@IsString()
	search?: string;

	@ApiProperty({ description: 'Filter to only show own invoices (portal)', required: false })
	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true)
	@IsBoolean()
	own?: boolean;
}
