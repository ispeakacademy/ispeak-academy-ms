import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditTargetType } from '@/common/enums/audit-target-type.enum';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationsRepository } from './organisations.repository';

@Injectable()
export class OrganisationsService {
	private readonly logger = new Logger(OrganisationsService.name);

	constructor(
		private readonly organisationsRepository: OrganisationsRepository,
		private readonly auditService: AuditService,
		private readonly dataSource: DataSource,
	) {}

	async create(dto: CreateOrganisationDto, employeeId: string) {
		const organisation = await this.organisationsRepository.create(dto);

		await this.auditService.createLog({
			action: AuditAction.ORGANISATION_CREATED,
			performedBy: employeeId,
			targetType: AuditTargetType.ORGANISATION,
			targetId: organisation.organisationId,
			details: `Organisation created: ${organisation.name}`,
			metadata: { name: organisation.name, country: organisation.country },
		});

		this.logger.log(`Organisation created: ${organisation.organisationId} by employee: ${employeeId}`);

		return organisation;
	}

	async findAll(page: number = 1, limit: number = 20, search?: string) {
		const skip = (page - 1) * limit;

		const queryBuilder = this.organisationsRepository
			.createQueryBuilder('organisation')
			.where('organisation.deletedAt IS NULL')
			.orderBy('organisation.createdAt', 'DESC')
			.skip(skip)
			.take(limit);

		if (search) {
			queryBuilder.andWhere(
				'(organisation.name ILIKE :search OR organisation.industry ILIKE :search OR organisation.billingEmail ILIKE :search)',
				{ search: `%${search}%` },
			);
		}

		const [organisations, total] = await queryBuilder.getManyAndCount();

		return {
			data: organisations,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(organisationId: string) {
		const organisation = await this.organisationsRepository.findOne({
			where: { organisationId },
		});

		if (!organisation) {
			throw new NotFoundException(`Organisation with ID ${organisationId} not found`);
		}

		return organisation;
	}

	async update(organisationId: string, dto: UpdateOrganisationDto, employeeId: string) {
		const organisation = await this.findOne(organisationId);

		const updated = await this.organisationsRepository.update(
			{ organisationId } as any,
			dto as any,
		);

		await this.auditService.createLog({
			action: AuditAction.ORGANISATION_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.ORGANISATION,
			targetId: organisationId,
			details: `Organisation updated: ${organisation.name}`,
			metadata: { updatedFields: Object.keys(dto) },
		});

		this.logger.log(`Organisation updated: ${organisationId} by employee: ${employeeId}`);

		return updated;
	}

	async softDelete(organisationId: string, employeeId: string) {
		const organisation = await this.findOne(organisationId);

		const queryBuilder = this.organisationsRepository.createQueryBuilder('organisation');
		await queryBuilder
			.softDelete()
			.where('organisation_id = :organisationId', { organisationId })
			.execute();

		await this.auditService.createLog({
			action: AuditAction.ORGANISATION_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.ORGANISATION,
			targetId: organisationId,
			details: `Organisation archived: ${organisation.name}`,
		});

		this.logger.log(`Organisation soft-deleted: ${organisationId} by employee: ${employeeId}`);

		return { message: 'Organisation archived successfully' };
	}

	async getContacts(organisationId: string, page: number = 1, limit: number = 20) {
		await this.findOne(organisationId);

		const [contacts, total] = await this.dataSource
			.createQueryBuilder()
			.select('client')
			.from('clients', 'client')
			.where('client.organisation_id = :organisationId', { organisationId })
			.andWhere('client.deleted_at IS NULL')
			.orderBy('client.created_at', 'DESC')
			.skip((page - 1) * limit)
			.take(limit)
			.getManyAndCount();

		return {
			data: contacts,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async getInvoices(organisationId: string, page: number = 1, limit: number = 20) {
		await this.findOne(organisationId);

		const [invoices, total] = await this.dataSource
			.createQueryBuilder()
			.select('invoice')
			.from('invoices', 'invoice')
			.where('invoice.organisation_id = :organisationId', { organisationId })
			.andWhere('invoice.deleted_at IS NULL')
			.orderBy('invoice.created_at', 'DESC')
			.skip((page - 1) * limit)
			.take(limit)
			.getManyAndCount();

		return {
			data: invoices,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}
}
