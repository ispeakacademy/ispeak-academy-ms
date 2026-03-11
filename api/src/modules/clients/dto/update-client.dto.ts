import { ClientStatus } from '@/common/enums/client-status.enum';
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {
	@IsOptional()
	@IsEnum(ClientStatus)
	status?: ClientStatus;
}
