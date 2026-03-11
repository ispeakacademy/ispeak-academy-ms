import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Organisation } from './entities/organisation.entity';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsRepository } from './organisations.repository';
import { OrganisationsService } from './organisations.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Organisation]),
		AuditModule,
	],
	controllers: [OrganisationsController],
	providers: [OrganisationsService, OrganisationsRepository],
	exports: [OrganisationsService, OrganisationsRepository],
})
export class OrganisationsModule {}
