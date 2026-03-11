import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditTargetType } from '@/common/enums/audit-target-type.enum';
import { ClientStatus } from '@/common/enums/client-status.enum';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
	forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../communications/services/email.service';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { UsersService } from '../users/users.service';
import { ClientsRepository } from './clients.repository';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InteractionsRepository } from './interactions.repository';

@Injectable()
export class ClientsService {
	private readonly logger = new Logger(ClientsService.name);

	constructor(
		private readonly clientsRepository: ClientsRepository,
		private readonly interactionsRepository: InteractionsRepository,
		private readonly auditService: AuditService,
		private readonly dataSource: DataSource,
		private readonly usersService: UsersService,
		@Inject(forwardRef(() => EmailService))
		private readonly emailService: EmailService,
		private readonly configService: ConfigService,
	) {}

	async create(dto: CreateClientDto, employeeId: string) {
		// Check for duplicate email
		if (dto.email) {
			const existingByEmail = await this.clientsRepository.findOne({
				where: { email: dto.email },
			});
			if (existingByEmail) {
				throw new ConflictException({
					message: 'A client with this email already exists',
					existingClientId: existingByEmail.clientId,
					field: 'email',
				});
			}
		}

		// Check for duplicate phone
		if (dto.phone) {
			const existingByPhone = await this.clientsRepository.findOne({
				where: { phone: dto.phone },
			});
			if (existingByPhone) {
				throw new ConflictException({
					message: 'A client with this phone number already exists',
					existingClientId: existingByPhone.clientId,
					field: 'phone',
				});
			}
		}

		// Generate unique referral code
		const referralCode = await this.generateReferralCode();

		// Set GDPR consent timestamp if consent is given
		const gdprConsentAt = dto.gdprConsent ? new Date() : undefined;

		const client = await this.clientsRepository.create({
			...dto,
			referralCode,
			gdprConsentAt,
			status: ClientStatus.LEAD,
		});

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.CLIENT_CREATED,
			performedBy: employeeId,
			targetType: AuditTargetType.CLIENT,
			targetId: client.clientId,
			details: `Client created: ${client.firstName} ${client.lastName}`,
			metadata: { email: client.email, phone: client.phone },
		});

		this.logger.log(`Client created: ${client.clientId} by employee: ${employeeId}`);

		return client;
	}

	async findAll(query: QueryClientsDto, currentUser?: JwtPayload) {
		const { page = 1, limit = 20, status, clientType, country, county, search } = query;
		let { assignedToEmployeeId } = query;
		const skip = (page - 1) * limit;

		// Trainers can only see clients assigned to them
		if (currentUser && !currentUser.isAdminUser && currentUser.linkedEmployeeId) {
			assignedToEmployeeId = currentUser.linkedEmployeeId;
		}

		const queryBuilder = this.clientsRepository
			.createQueryBuilder('client')
			.where('client.deletedAt IS NULL')
			.orderBy('client.createdAt', 'DESC')
			.skip(skip)
			.take(limit);

		if (status) {
			queryBuilder.andWhere('client.status = :status', { status });
		}

		if (clientType) {
			queryBuilder.andWhere('client.clientType = :clientType', { clientType });
		}

		if (country) {
			queryBuilder.andWhere('client.country = :country', { country });
		}

		if (county) {
			queryBuilder.andWhere('client.county = :county', { county });
		}

		if (assignedToEmployeeId) {
			queryBuilder.andWhere('client.assignedToEmployeeId = :assignedToEmployeeId', { assignedToEmployeeId });
		}

		if (search) {
			queryBuilder.andWhere(
				'(client.firstName ILIKE :search OR client.lastName ILIKE :search OR client.email ILIKE :search OR client.phone ILIKE :search)',
				{ search: `%${search}%` },
			);
		}

		const [clients, total] = await queryBuilder.getManyAndCount();

		// Compute financial summaries for these clients
		let financials: Record<string, { totalInvoiced: number; totalPaid: number; totalOutstanding: number }> = {};
		const clientIds = clients.map((c) => c.clientId);
		if (clientIds.length > 0) {
			const financialRows = await this.dataSource
				.getRepository(Invoice)
				.createQueryBuilder('invoice')
				.select('invoice.clientId', 'clientId')
				.addSelect('COALESCE(SUM(invoice.totalAmount), 0)', 'totalInvoiced')
				.addSelect('COALESCE(SUM(invoice.amountPaid), 0)', 'totalPaid')
				.addSelect('COALESCE(SUM(invoice.balance), 0)', 'totalOutstanding')
				.where('invoice.clientId IN (:...clientIds)', { clientIds })
				.andWhere('invoice.status != :voidStatus', { voidStatus: 'void' })
				.groupBy('invoice.clientId')
				.getRawMany();

			for (const row of financialRows) {
				financials[row.clientId] = {
					totalInvoiced: parseFloat(row.totalInvoiced),
					totalPaid: parseFloat(row.totalPaid),
					totalOutstanding: parseFloat(row.totalOutstanding),
				};
			}
		}

		return {
			data: clients,
			financials,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(clientId: string) {
		const client = await this.clientsRepository.findOne({
			where: { clientId },
			relations: ['referredBy'],
		});

		if (!client) {
			throw new NotFoundException(`Client with ID ${clientId} not found`);
		}

		return client;
	}

	async update(clientId: string, dto: UpdateClientDto, employeeId: string) {
		const client = await this.findOne(clientId);

		// If updating email, check for duplicates (exclude current client)
		if (dto.email && dto.email !== client.email) {
			const existingByEmail = await this.clientsRepository.findOne({
				where: { email: dto.email },
			});
			if (existingByEmail && existingByEmail.clientId !== clientId) {
				throw new ConflictException({
					message: 'A client with this email already exists',
					existingClientId: existingByEmail.clientId,
					field: 'email',
				});
			}
		}

		// If updating phone, check for duplicates (exclude current client)
		if (dto.phone && dto.phone !== client.phone) {
			const existingByPhone = await this.clientsRepository.findOne({
				where: { phone: dto.phone },
			});
			if (existingByPhone && existingByPhone.clientId !== clientId) {
				throw new ConflictException({
					message: 'A client with this phone number already exists',
					existingClientId: existingByPhone.clientId,
					field: 'phone',
				});
			}
		}

		// If GDPR consent is being set for the first time, record the timestamp
		if (dto.gdprConsent && !client.gdprConsent) {
			(dto as any).gdprConsentAt = new Date();
		}

		const updatedClient = await this.clientsRepository.update(
			{ clientId } as any,
			dto as any,
		);

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.CLIENT_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.CLIENT,
			targetId: clientId,
			details: `Client updated: ${client.firstName} ${client.lastName}`,
			metadata: { updatedFields: Object.keys(dto) },
		});

		this.logger.log(`Client updated: ${clientId} by employee: ${employeeId}`);

		return updatedClient;
	}

	async softDelete(clientId: string, employeeId: string) {
		const client = await this.findOne(clientId);

		// Perform soft delete by setting deletedAt
		const queryBuilder = this.clientsRepository.createQueryBuilder('client');
		await queryBuilder
			.softDelete()
			.where('client_id = :clientId', { clientId })
			.execute();

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.CLIENT_DELETED,
			performedBy: employeeId,
			targetType: AuditTargetType.CLIENT,
			targetId: clientId,
			details: `Client archived: ${client.firstName} ${client.lastName}`,
		});

		this.logger.log(`Client soft-deleted: ${clientId} by employee: ${employeeId}`);

		return { message: 'Client archived successfully' };
	}

	async addInteraction(clientId: string, dto: CreateInteractionDto, employeeId: string) {
		const client = await this.findOne(clientId);

		const interaction = await this.interactionsRepository.create({
			clientId,
			type: dto.type,
			direction: dto.direction,
			summary: dto.summary,
			outcome: dto.outcome,
			followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
			followUpNote: dto.followUpNote,
			createdByEmployeeId: employeeId,
		});

		// Auto-transition LEAD -> PROSPECT on first interaction
		if (client.status === ClientStatus.LEAD) {
			await this.clientsRepository.update(
				{ clientId } as any,
				{ status: ClientStatus.PROSPECT } as any,
			);

			await this.auditService.createLog({
				action: AuditAction.CLIENT_STATUS_CHANGED,
				performedBy: employeeId,
				targetType: AuditTargetType.CLIENT,
				targetId: clientId,
				details: `Client status auto-transitioned from LEAD to PROSPECT on first interaction`,
				metadata: { previousStatus: ClientStatus.LEAD, newStatus: ClientStatus.PROSPECT },
			});

			this.logger.log(`Client ${clientId} auto-transitioned from LEAD to PROSPECT`);
		}

		return interaction;
	}

	async getInteractions(clientId: string, page: number = 1, limit: number = 20) {
		// Verify client exists
		await this.findOne(clientId);

		const skip = (page - 1) * limit;

		const queryBuilder = this.interactionsRepository
			.createQueryBuilder('interaction')
			.where('interaction.clientId = :clientId', { clientId })
			.orderBy('interaction.createdAt', 'DESC')
			.skip(skip)
			.take(limit);

		const [interactions, total] = await queryBuilder.getManyAndCount();

		return {
			data: interactions,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async getTimeline(clientId: string) {
		// Verify client exists
		await this.findOne(clientId);

		const interactions = await this.interactionsRepository
			.createQueryBuilder('interaction')
			.where('interaction.clientId = :clientId', { clientId })
			.orderBy('interaction.createdAt', 'DESC')
			.getMany();

		// Map interactions to timeline entries
		const timeline = interactions.map((interaction) => ({
			id: interaction.interactionId,
			type: 'interaction' as const,
			interactionType: interaction.type,
			direction: interaction.direction,
			summary: interaction.summary,
			outcome: interaction.outcome,
			createdByEmployeeId: interaction.createdByEmployeeId,
			createdAt: interaction.createdAt,
		}));

		return timeline;
	}

	async search(query: string) {
		if (!query || query.trim().length === 0) {
			return { data: [], total: 0 };
		}

		const searchTerm = `%${query.trim()}%`;

		const queryBuilder = this.clientsRepository
			.createQueryBuilder('client')
			.where('client.deletedAt IS NULL')
			.andWhere(
				'(client.firstName ILIKE :search OR client.lastName ILIKE :search OR client.email ILIKE :search OR client.phone ILIKE :search)',
				{ search: searchTerm },
			)
			.orderBy('client.firstName', 'ASC')
			.take(50);

		const [clients, total] = await queryBuilder.getManyAndCount();

		return {
			data: clients,
			total,
		};
	}

	async assignToEmployee(clientId: string, employeeId: string, performedBy: string) {
		const client = await this.findOne(clientId);

		await this.clientsRepository.update(
			{ clientId } as any,
			{ assignedToEmployeeId: employeeId } as any,
		);

		await this.auditService.createLog({
			action: AuditAction.CLIENT_UPDATED,
			performedBy,
			targetType: AuditTargetType.CLIENT,
			targetId: clientId,
			details: `Client assigned to employee: ${employeeId}`,
			metadata: { previousAssignee: client.assignedToEmployeeId, newAssignee: employeeId },
		});

		this.logger.log(`Client ${clientId} assigned to employee ${employeeId}`);

		return { message: 'Client assigned successfully' };
	}

	async getEnrollments(clientId: string, page: number = 1, limit: number = 20) {
		await this.findOne(clientId);

		const [enrollments, total] = await this.dataSource
			.getRepository(Enrollment)
			.createQueryBuilder('enrollment')
			.leftJoinAndSelect('enrollment.program', 'program')
			.leftJoinAndSelect('enrollment.cohort', 'cohort')
			.where('enrollment.clientId = :clientId', { clientId })
			.andWhere('enrollment.deletedAt IS NULL')
			.orderBy('enrollment.createdAt', 'DESC')
			.skip((page - 1) * limit)
			.take(limit)
			.getManyAndCount();

		return {
			data: enrollments,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async getInvoices(clientId: string, page: number = 1, limit: number = 20) {
		await this.findOne(clientId);

		const [invoices, total] = await this.dataSource
			.getRepository(Invoice)
			.createQueryBuilder('invoice')
			.leftJoinAndSelect('invoice.lineItems', 'lineItems')
			.leftJoinAndSelect('invoice.payments', 'payments')
			.where('invoice.clientId = :clientId', { clientId })
			.andWhere('invoice.deletedAt IS NULL')
			.orderBy('invoice.createdAt', 'DESC')
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

	async getReferrals(clientId: string) {
		await this.findOne(clientId);

		const referrals = await this.clientsRepository
			.createQueryBuilder('client')
			.where('client.referred_by_id = :clientId', { clientId })
			.andWhere('client.deletedAt IS NULL')
			.orderBy('client.createdAt', 'DESC')
			.getMany();

		return {
			data: referrals,
			total: referrals.length,
		};
	}

	async convertToProspect(clientId: string, employeeId: string) {
		const client = await this.findOne(clientId);

		if (client.status !== ClientStatus.LEAD) {
			return { message: `Client is already ${client.status}, not a lead` };
		}

		await this.clientsRepository.update(
			{ clientId } as any,
			{ status: ClientStatus.PROSPECT } as any,
		);

		await this.auditService.createLog({
			action: AuditAction.CLIENT_STATUS_CHANGED,
			performedBy: employeeId,
			targetType: AuditTargetType.CLIENT,
			targetId: clientId,
			details: `Client status changed from LEAD to PROSPECT`,
			metadata: { previousStatus: ClientStatus.LEAD, newStatus: ClientStatus.PROSPECT },
		});

		return { message: 'Client converted to prospect successfully' };
	}

	async sendPortalInvite(clientId: string, employeeId: string) {
		const client = await this.findOne(clientId);

		if (!client.email) {
			throw new BadRequestException('Client has no email address');
		}

		const tempPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);

		const existingUser = await this.usersService.findByEmail(client.email);

		if (existingUser) {
			// Reset password and force change on next login
			await this.usersService.updatePassword(existingUser.userId, tempPassword);
			await this.usersService.updateProfile(existingUser.userId, {});
			// Set mustChangePassword via direct repository update
			const userRepo = this.dataSource.getRepository('User');
			await userRepo.update({ userId: existingUser.userId }, { mustChangePassword: true });

			if (!existingUser.linkedClientId) {
				await userRepo.update({ userId: existingUser.userId }, { linkedClientId: client.clientId });
			}

			this.logger.log(`Reset portal credentials for client ${client.email} (userId: ${existingUser.userId})`);
		} else {
			await this.usersService.createClientAccount(client, tempPassword);
			this.logger.log(`Created new portal account for client ${client.email}`);
		}

		// Send welcome email
		const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
		const html = this.buildWelcomeEmailHtml(client.firstName, client.email, tempPassword, frontendUrl);

		await this.emailService.sendEmail(
			client.email,
			'Welcome to iSpeak Academy — Your Portal Access',
			html,
		);

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.CLIENT_PORTAL_INVITE_SENT,
			performedBy: employeeId,
			targetType: AuditTargetType.CLIENT,
			targetId: clientId,
			details: `Portal invite sent to ${client.email}`,
			metadata: { email: client.email, accountExisted: !!existingUser },
		});

		this.logger.log(`Portal invite sent to ${client.email} by employee ${employeeId}`);

		return { message: 'Portal invite sent successfully' };
	}

	private buildWelcomeEmailHtml(
		firstName: string,
		email: string,
		tempPassword: string,
		frontendUrl: string,
	): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a365d;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">iSpeak Academy</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1a365d;font-size:20px;">Welcome, ${firstName}!</h2>
              <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
                You can now access the iSpeak Academy client portal to view your schedule, invoices, and certificates.
              </p>
              <p style="margin:0 0 8px;color:#4a5568;font-size:15px;line-height:1.6;">
                Here are your login credentials:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#edf2f7;border-radius:6px;margin:16px 0 24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#2d3748;font-size:14px;"><strong>Email:</strong> ${email}</p>
                    <p style="margin:0;color:#2d3748;font-size:14px;"><strong>Temporary Password:</strong> ${tempPassword}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;color:#e53e3e;font-size:14px;line-height:1.6;">
                You will be asked to set a new password on your first login.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#2b6cb0;border-radius:6px;">
                    <a href="${frontendUrl}/login" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
                      Log In to Portal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f7fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#a0aec0;font-size:13px;line-height:1.5;">
                If you have any questions, please contact us at
                <a href="mailto:info@ispeakacademy.org" style="color:#2b6cb0;text-decoration:none;">info@ispeakacademy.org</a>
              </p>
              <p style="margin:8px 0 0;color:#cbd5e0;font-size:12px;">&copy; ${new Date().getFullYear()} iSpeak Academy. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
	}

	/**
	 * Generates a unique referral code in format ISP-XXX-XXXX
	 * where X are uppercase alphanumeric characters.
	 */
	private async generateReferralCode(): Promise<string> {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let attempts = 0;
		const maxAttempts = 10;

		while (attempts < maxAttempts) {
			let part1 = '';
			let part2 = '';

			for (let i = 0; i < 3; i++) {
				part1 += chars.charAt(Math.floor(Math.random() * chars.length));
			}
			for (let i = 0; i < 4; i++) {
				part2 += chars.charAt(Math.floor(Math.random() * chars.length));
			}

			const code = `ISP-${part1}-${part2}`;

			// Check uniqueness
			const existing = await this.clientsRepository.findOne({
				where: { referralCode: code },
			});

			if (!existing) {
				return code;
			}

			attempts++;
		}

		// Fallback: use timestamp-based code
		const timestamp = Date.now().toString(36).toUpperCase().slice(-7);
		return `ISP-${timestamp.slice(0, 3)}-${timestamp.slice(3)}`;
	}
}
