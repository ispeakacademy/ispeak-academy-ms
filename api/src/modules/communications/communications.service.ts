import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditTargetType } from '@/common/enums/audit-target-type.enum';
import { CommChannel } from '@/common/enums/comm-channel.enum';
import { CommDirection, CommStatus } from '@/common/enums/comm-status.enum';
import { Inject, Injectable, Logger, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ClientsRepository } from '../clients/clients.repository';
import { CreateTemplateDto } from './dto/create-template.dto';
import { PreviewAudienceDto } from './dto/preview-audience.dto';
import { QueryCommunicationsDto } from './dto/query-communications.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AudienceFiltersDto, SendBulkMessageDto } from './dto/send-bulk-message.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CommunicationsRepository } from './repositories/communications.repository';
import { MessageTemplatesRepository } from './repositories/message-templates.repository';
import { AfricasTalkingService } from './services/africas-talking.service';
import { EmailService } from './services/email.service';

@Injectable()
export class CommunicationsService {
	private readonly logger = new Logger(CommunicationsService.name);

	constructor(
		private readonly communicationsRepository: CommunicationsRepository,
		private readonly messageTemplatesRepository: MessageTemplatesRepository,
		private readonly emailService: EmailService,
		private readonly africasTalkingService: AfricasTalkingService,
		private readonly auditService: AuditService,
		@Inject(forwardRef(() => ClientsRepository))
		private readonly clientsRepository: ClientsRepository,
	) {}

	// ─── Communication Methods ──────────────────────────────────────────

	async sendMessage(dto: SendMessageDto, userId: string) {
		// Look up the client to get contact info
		const client = await this.clientsRepository.findOne({
			where: { clientId: dto.clientId },
		});

		if (!client) {
			throw new NotFoundException(`Client with ID ${dto.clientId} not found`);
		}

		// Resolve the recipient address based on channel
		let toAddress: string | undefined;
		if (dto.channel === CommChannel.EMAIL) {
			toAddress = client.email;
			if (!toAddress) {
				throw new BadRequestException('Client does not have an email address');
			}
		} else if (dto.channel === CommChannel.SMS || dto.channel === CommChannel.WHATSAPP) {
			toAddress = client.phone;
			if (!toAddress) {
				throw new BadRequestException('Client does not have a phone number');
			}
		}

		// Personalize body and subject with client data
		const replacements: Record<string, string> = {
			'client.firstName': client.firstName,
			'client.lastName': client.lastName,
			'client.email': client.email || '',
			'client.phone': client.phone || '',
			'client.fullName': `${client.firstName} ${client.lastName}`.trim(),
		};

		let personalizedBody = dto.body;
		let personalizedSubject = dto.subject || undefined;
		for (const [key, value] of Object.entries(replacements)) {
			const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
			personalizedBody = personalizedBody.replace(placeholder, value);
			if (personalizedSubject) {
				personalizedSubject = personalizedSubject.replace(placeholder, value);
			}
		}

		// Create the communication record
		const communication = await this.communicationsRepository.create({
			clientId: dto.clientId,
			channel: dto.channel,
			direction: CommDirection.OUTBOUND,
			status: CommStatus.QUEUED,
			subject: personalizedSubject,
			body: personalizedBody,
			toAddress,
			templateId: dto.templateId,
			templateVariables: dto.templateVariables,
			sentByEmployeeId: userId,
		});

		// Send via the appropriate channel
		try {
			if (dto.channel === CommChannel.EMAIL) {
				const result = await this.emailService.sendEmail(
					toAddress!,
					personalizedSubject || '',
					personalizedBody,
				);
				communication.externalMessageId = result.id;
				communication.status = CommStatus.SENT;
				communication.sentAt = new Date();
			} else if (dto.channel === CommChannel.SMS) {
				const result = await this.africasTalkingService.sendSms(toAddress!, personalizedBody);
				communication.externalMessageId = result.messageId;
				communication.status = CommStatus.SENT;
				communication.sentAt = new Date();
			} else if (dto.channel === CommChannel.WHATSAPP) {
				const result = await this.africasTalkingService.sendWhatsApp(toAddress!, personalizedBody);
				communication.externalMessageId = result.messageId;
				communication.status = CommStatus.SENT;
				communication.sentAt = new Date();
			} else {
				// IN_APP — mark as delivered immediately
				communication.status = CommStatus.DELIVERED;
				communication.sentAt = new Date();
				communication.deliveredAt = new Date();
			}
		} catch (error) {
			this.logger.error(`Failed to send message: ${error.message}`, error.stack);
			communication.status = CommStatus.FAILED;
			communication.failureReason = error.message;
		}

		const savedCommunication = await this.communicationsRepository.save(communication);

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.COMMUNICATION_SENT,
			performedBy: userId,
			targetType: AuditTargetType.COMMUNICATION,
			targetId: savedCommunication.communicationId,
			details: `Message sent via ${dto.channel} to client ${dto.clientId}`,
			metadata: {
				channel: dto.channel,
				status: savedCommunication.status,
				clientId: dto.clientId,
			},
		});

		this.logger.log(
			`Communication ${savedCommunication.communicationId} created via ${dto.channel} — status: ${savedCommunication.status}`,
		);

		return savedCommunication;
	}

	async findAll(query: QueryCommunicationsDto) {
		const { page = 1, limit = 20, channel, status, direction, clientId } = query;
		const skip = (page - 1) * limit;

		const queryBuilder = this.communicationsRepository
			.createQueryBuilder('comm')
			.leftJoinAndSelect('comm.client', 'client')
			.where('comm.deletedAt IS NULL')
			.orderBy('comm.createdAt', 'DESC')
			.skip(skip)
			.take(limit);

		if (channel) {
			queryBuilder.andWhere('comm.channel = :channel', { channel });
		}

		if (status) {
			queryBuilder.andWhere('comm.status = :status', { status });
		}

		if (direction) {
			queryBuilder.andWhere('comm.direction = :direction', { direction });
		}

		if (clientId) {
			queryBuilder.andWhere('comm.clientId = :clientId', { clientId });
		}

		const [data, total] = await queryBuilder.getManyAndCount();

		return {
			data,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(communicationId: string) {
		const communication = await this.communicationsRepository.findOne({
			where: { communicationId },
		});

		if (!communication) {
			throw new NotFoundException(`Communication with ID ${communicationId} not found`);
		}

		return communication;
	}

	async getClientCommunications(clientId: string, page: number = 1, limit: number = 20) {
		const skip = (page - 1) * limit;

		const queryBuilder = this.communicationsRepository
			.createQueryBuilder('comm')
			.where('comm.clientId = :clientId', { clientId })
			.andWhere('comm.deletedAt IS NULL')
			.orderBy('comm.createdAt', 'DESC')
			.skip(skip)
			.take(limit);

		const [data, total] = await queryBuilder.getManyAndCount();

		return {
			data,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async getInbox(page: number = 1, limit: number = 20) {
		const skip = (page - 1) * limit;

		const queryBuilder = this.communicationsRepository
			.createQueryBuilder('comm')
			.leftJoinAndSelect('comm.client', 'client')
			.where('comm.direction = :direction', { direction: CommDirection.INBOUND })
			.andWhere('comm.deletedAt IS NULL')
			.orderBy('comm.createdAt', 'DESC')
			.skip(skip)
			.take(limit);

		const [data, total] = await queryBuilder.getManyAndCount();

		return {
			data,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async replyToMessage(communicationId: string, body: string, userId: string) {
		const parentMessage = await this.findOne(communicationId);

		const reply = await this.communicationsRepository.create({
			clientId: parentMessage.clientId,
			channel: parentMessage.channel,
			direction: CommDirection.OUTBOUND,
			status: CommStatus.QUEUED,
			body,
			toAddress: parentMessage.fromAddress,
			fromAddress: parentMessage.toAddress,
			parentMessageId: parentMessage.communicationId,
			sentByEmployeeId: userId,
		});

		// Attempt to send via the appropriate channel
		try {
			if (parentMessage.channel === CommChannel.EMAIL) {
				const result = await this.emailService.sendEmail(
					reply.toAddress || '',
					`Re: ${parentMessage.subject || ''}`,
					body,
				);
				reply.externalMessageId = result.id;
				reply.status = CommStatus.SENT;
				reply.sentAt = new Date();
				reply.subject = `Re: ${parentMessage.subject || ''}`;
			} else if (parentMessage.channel === CommChannel.SMS) {
				const result = await this.africasTalkingService.sendSms(reply.toAddress || '', body);
				reply.externalMessageId = result.messageId;
				reply.status = CommStatus.SENT;
				reply.sentAt = new Date();
			} else if (parentMessage.channel === CommChannel.WHATSAPP) {
				const result = await this.africasTalkingService.sendWhatsApp(reply.toAddress || '', body);
				reply.externalMessageId = result.messageId;
				reply.status = CommStatus.SENT;
				reply.sentAt = new Date();
			} else {
				// IN_APP
				reply.status = CommStatus.DELIVERED;
				reply.sentAt = new Date();
				reply.deliveredAt = new Date();
			}
		} catch (error) {
			this.logger.error(`Failed to send reply: ${error.message}`, error.stack);
			reply.status = CommStatus.FAILED;
			reply.failureReason = error.message;
		}

		const savedReply = await this.communicationsRepository.save(reply);

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.COMMUNICATION_SENT,
			performedBy: userId,
			targetType: AuditTargetType.COMMUNICATION,
			targetId: savedReply.communicationId,
			details: `Reply sent to communication ${communicationId} via ${parentMessage.channel}`,
			metadata: {
				channel: parentMessage.channel,
				parentMessageId: communicationId,
				status: savedReply.status,
			},
		});

		this.logger.log(
			`Reply ${savedReply.communicationId} sent to ${communicationId} — status: ${savedReply.status}`,
		);

		return savedReply;
	}

	// ─── Bulk Messaging Methods ────────────────────────────────────────

	private async resolveAudience(dto: PreviewAudienceDto): Promise<string[]> {
		const clientIdSet = new Set<string>(dto.clientIds || []);

		if (dto.filters) {
			const qb = this.clientsRepository.createQueryBuilder('client')
				.select('client.client_id', 'clientId')
				.where('client.deletedAt IS NULL');

			if (dto.filters.statuses?.length) {
				qb.andWhere('client.status IN (:...statuses)', { statuses: dto.filters.statuses });
			}

			if (dto.filters.clientTypes?.length) {
				qb.andWhere('client.client_type IN (:...clientTypes)', { clientTypes: dto.filters.clientTypes });
			}

			if (dto.filters.segments?.length) {
				qb.andWhere('client.segment IN (:...segments)', { segments: dto.filters.segments });
			}

			if (dto.filters.countries?.length) {
				qb.andWhere('client.country IN (:...countries)', { countries: dto.filters.countries });
			}

			if (dto.filters.tags?.length) {
				qb.andWhere('client.tags::jsonb ?| ARRAY[:...tags]', { tags: dto.filters.tags });
			}

			if (dto.filters.programIds?.length) {
				qb.innerJoin('enrollments', 'enrollment', 'enrollment.client_id = client.client_id')
					.andWhere('enrollment.program_id IN (:...programIds)', { programIds: dto.filters.programIds });
			}

			if (dto.filters.marketingOptInOnly) {
				qb.andWhere('client.marketing_opt_in = :optIn', { optIn: true });
			}

			const rows = await qb.getRawMany<{ clientId: string }>();
			for (const row of rows) {
				clientIdSet.add(row.clientId);
			}
		}

		return Array.from(clientIdSet);
	}

	async previewAudience(dto: PreviewAudienceDto) {
		if (!dto.clientIds?.length && !dto.filters) {
			throw new BadRequestException('At least one of clientIds or filters must be provided');
		}

		const clientIds = await this.resolveAudience(dto);
		return { count: clientIds.length, clientIds };
	}

	async sendBulkMessage(dto: SendBulkMessageDto, userId: string) {
		if (!dto.clientIds?.length && !dto.filters) {
			throw new BadRequestException('At least one of clientIds or filters must be provided');
		}

		const clientIds = await this.resolveAudience(dto);

		if (clientIds.length === 0) {
			return { totalRecipients: 0, sentCount: 0, failedCount: 0, communicationIds: [] };
		}

		// Fetch client records for personalization and contact info
		const clients = await this.clientsRepository.createQueryBuilder('client')
			.where('client.client_id IN (:...clientIds)', { clientIds })
			.andWhere('client.deletedAt IS NULL')
			.getMany();

		let sentCount = 0;
		let failedCount = 0;
		const communicationIds: string[] = [];

		for (const client of clients) {
			// Skip clients without appropriate contact info
			if (dto.channel === CommChannel.EMAIL && !client.email) continue;
			if ((dto.channel === CommChannel.SMS || dto.channel === CommChannel.WHATSAPP) && !client.phone) continue;

			// Personalize body with client data
			let personalizedBody = dto.body;
			let personalizedSubject = dto.subject || undefined;
			const replacements: Record<string, string> = {
				'client.firstName': client.firstName,
				'client.lastName': client.lastName,
				'client.email': client.email || '',
				'client.phone': client.phone || '',
				'client.fullName': `${client.firstName} ${client.lastName}`.trim(),
			};

			for (const [key, value] of Object.entries(replacements)) {
				const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
				personalizedBody = personalizedBody.replace(placeholder, value);
				if (personalizedSubject) {
					personalizedSubject = personalizedSubject.replace(placeholder, value);
				}
			}

			const toAddress = dto.channel === CommChannel.EMAIL ? client.email : client.phone;

			const communication = await this.communicationsRepository.create({
				clientId: client.clientId,
				channel: dto.channel,
				direction: CommDirection.OUTBOUND,
				status: CommStatus.QUEUED,
				subject: personalizedSubject,
				body: personalizedBody,
				toAddress,
				templateId: dto.templateId,
				templateVariables: dto.templateVariables,
				sentByEmployeeId: userId,
			});

			try {
				if (dto.channel === CommChannel.EMAIL && client.email) {
					const result = await this.emailService.sendEmail(
						client.email,
						personalizedSubject || '',
						personalizedBody,
					);
					communication.externalMessageId = result.id;
					communication.status = CommStatus.SENT;
					communication.sentAt = new Date();
				} else if (dto.channel === CommChannel.SMS && client.phone) {
					const result = await this.africasTalkingService.sendSms(client.phone, personalizedBody);
					communication.externalMessageId = result.messageId;
					communication.status = CommStatus.SENT;
					communication.sentAt = new Date();
				} else if (dto.channel === CommChannel.WHATSAPP && client.phone) {
					const result = await this.africasTalkingService.sendWhatsApp(client.phone, personalizedBody);
					communication.externalMessageId = result.messageId;
					communication.status = CommStatus.SENT;
					communication.sentAt = new Date();
				} else {
					// IN_APP
					communication.status = CommStatus.DELIVERED;
					communication.sentAt = new Date();
					communication.deliveredAt = new Date();
				}
				sentCount++;
			} catch (error) {
				this.logger.error(`Failed to send bulk message to client ${client.clientId}: ${error.message}`);
				communication.status = CommStatus.FAILED;
				communication.failureReason = error.message;
				failedCount++;
			}

			const saved = await this.communicationsRepository.save(communication);
			communicationIds.push(saved.communicationId);
		}

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.BROADCAST_SENT,
			performedBy: userId,
			targetType: AuditTargetType.COMMUNICATION,
			details: `Bulk message sent via ${dto.channel} to ${clients.length} recipients (${sentCount} sent, ${failedCount} failed)`,
			metadata: {
				channel: dto.channel,
				totalRecipients: clients.length,
				sentCount,
				failedCount,
			},
		});

		this.logger.log(
			`Bulk message sent: ${sentCount} sent, ${failedCount} failed out of ${clients.length} recipients`,
		);

		return { totalRecipients: clients.length, sentCount, failedCount, communicationIds };
	}

	// ─── Africa's Talking Webhook Handlers ─────────────────────────────

	async handleAfricasTalkingInbound(payload: any, channel: 'sms' | 'whatsapp') {
		const senderPhone = payload?.from;
		const body = payload?.text || '';
		const toAddress = payload?.to;
		const externalMessageId = payload?.id || null;

		if (!senderPhone) {
			this.logger.warn(`Inbound ${channel} webhook missing sender phone number`);
			return;
		}

		// Look up client by phone number
		let clientId: string | undefined;
		const client = await this.clientsRepository
			.createQueryBuilder('client')
			.where('client.phone = :phone', { phone: senderPhone })
			.andWhere('client.deletedAt IS NULL')
			.getOne();

		if (client) {
			clientId = client.clientId;
		}

		const commChannel = channel === 'sms' ? CommChannel.SMS : CommChannel.WHATSAPP;

		const communication = await this.communicationsRepository.create({
			clientId,
			channel: commChannel,
			direction: CommDirection.INBOUND,
			status: CommStatus.DELIVERED,
			body,
			fromAddress: senderPhone,
			toAddress,
			externalMessageId,
		});

		await this.auditService.createLog({
			action: AuditAction.COMMUNICATION_RECEIVED,
			performedBy: 'system',
			targetType: AuditTargetType.COMMUNICATION,
			targetId: communication.communicationId,
			details: `Inbound ${channel.toUpperCase()} received from ${senderPhone}${client ? ` (client: ${client.firstName} ${client.lastName})` : ' (unknown sender)'}`,
			metadata: {
				channel: commChannel,
				senderPhone,
				clientId: clientId || null,
				externalMessageId,
			},
		});

		this.logger.log(
			`Inbound ${channel} recorded: ${communication.communicationId} from ${senderPhone}${clientId ? ` (client ${clientId})` : ' (unknown sender)'}`,
		);
	}

	async handleAfricasTalkingDeliveryReport(payload: any) {
		const messageId = payload?.id;
		const status = payload?.status;

		if (!messageId) {
			this.logger.warn('AT delivery report missing message ID');
			return;
		}

		const communication = await this.communicationsRepository
			.createQueryBuilder('comm')
			.where('comm.external_message_id = :messageId', { messageId })
			.getOne();

		if (!communication) {
			this.logger.warn(`No communication found for AT message ID: ${messageId}`);
			return;
		}

		// Map Africa's Talking delivery statuses
		const statusLower = (status || '').toLowerCase();
		if (statusLower === 'success' || statusLower === 'sent') {
			communication.status = CommStatus.DELIVERED;
			communication.deliveredAt = new Date();
		} else if (statusLower === 'failed' || statusLower === 'rejected') {
			communication.status = CommStatus.FAILED;
			communication.failureReason = payload?.failureReason || `Delivery failed: ${status}`;
		}

		await this.communicationsRepository.save(communication);

		this.logger.log(
			`Communication ${communication.communicationId} delivery status: ${status} (AT message ID: ${messageId})`,
		);
	}

	// ─── Resend Webhook Handler ────────────────────────────────────────

	async handleResendWebhook(payload: any) {
		const eventType = payload?.type;

		if (!eventType) {
			this.logger.warn('Resend webhook received with no event type');
			return;
		}

		switch (eventType) {
			case 'email.received':
				await this.handleInboundEmail(payload.data);
				break;
			case 'email.delivered':
				await this.handleDeliveryStatus(payload.data, CommStatus.DELIVERED);
				break;
			case 'email.bounced':
				await this.handleDeliveryStatus(payload.data, CommStatus.BOUNCED);
				break;
			case 'email.complained':
				await this.handleDeliveryStatus(payload.data, CommStatus.FAILED);
				break;
			default:
				this.logger.log(`Ignoring Resend webhook event type: ${eventType}`);
		}
	}

	private async handleInboundEmail(data: any) {
		const senderEmail = data?.from;
		const subject = data?.subject || null;
		const body = data?.html || data?.text || '';
		const toAddress = data?.to;
		const externalMessageId = data?.email_id || null;

		if (!senderEmail) {
			this.logger.warn('Inbound email webhook missing sender address');
			return;
		}

		// Look up client by email (case-insensitive)
		let clientId: string | undefined;
		const client = await this.clientsRepository
			.createQueryBuilder('client')
			.where('LOWER(client.email) = LOWER(:email)', { email: senderEmail })
			.andWhere('client.deletedAt IS NULL')
			.getOne();

		if (client) {
			clientId = client.clientId;
		}

		const communication = await this.communicationsRepository.create({
			clientId,
			channel: CommChannel.EMAIL,
			direction: CommDirection.INBOUND,
			status: CommStatus.DELIVERED,
			subject,
			body,
			fromAddress: senderEmail,
			toAddress: Array.isArray(toAddress) ? toAddress.join(', ') : toAddress,
			externalMessageId,
		});

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.COMMUNICATION_RECEIVED,
			performedBy: 'system',
			targetType: AuditTargetType.COMMUNICATION,
			targetId: communication.communicationId,
			details: `Inbound email received from ${senderEmail}${client ? ` (client: ${client.firstName} ${client.lastName})` : ' (unknown sender)'}`,
			metadata: {
				channel: CommChannel.EMAIL,
				senderEmail,
				clientId: clientId || null,
				externalMessageId,
			},
		});

		this.logger.log(
			`Inbound email recorded: ${communication.communicationId} from ${senderEmail}${clientId ? ` (client ${clientId})` : ' (unknown sender)'}`,
		);
	}

	private async handleDeliveryStatus(data: any, newStatus: CommStatus) {
		const emailId = data?.email_id;
		if (!emailId) {
			this.logger.warn(`Delivery status webhook missing email_id`);
			return;
		}

		const communication = await this.communicationsRepository
			.createQueryBuilder('comm')
			.where('comm.external_message_id = :emailId', { emailId })
			.getOne();

		if (!communication) {
			this.logger.warn(`No communication found for Resend email_id: ${emailId}`);
			return;
		}

		communication.status = newStatus;
		if (newStatus === CommStatus.DELIVERED) {
			communication.deliveredAt = new Date();
		}

		await this.communicationsRepository.save(communication);

		this.logger.log(
			`Communication ${communication.communicationId} status updated to ${newStatus} (Resend email_id: ${emailId})`,
		);
	}

	// ─── Template Methods ───────────────────────────────────────────────

	async createTemplate(dto: CreateTemplateDto, userId: string) {
		const template = await this.messageTemplatesRepository.create({
			name: dto.name,
			category: dto.category,
			channel: dto.channel,
			subject: dto.subject,
			body: dto.body,
			variables: dto.variables || [],
		});

		await this.auditService.createLog({
			action: AuditAction.TEMPLATE_CREATED,
			performedBy: userId,
			targetType: AuditTargetType.TEMPLATE,
			targetId: template.templateId,
			details: `Message template created: ${dto.name}`,
			metadata: { channel: dto.channel, category: dto.category },
		});

		this.logger.log(`Template created: ${template.templateId} — ${dto.name}`);

		return template;
	}

	async updateTemplate(templateId: string, dto: UpdateTemplateDto, userId: string) {
		const template = await this.findTemplateById(templateId);

		const updatedTemplate = await this.messageTemplatesRepository.update(
			{ templateId } as any,
			dto as any,
		);

		await this.auditService.createLog({
			action: AuditAction.TEMPLATE_UPDATED,
			performedBy: userId,
			targetType: AuditTargetType.TEMPLATE,
			targetId: templateId,
			details: `Message template updated: ${template.name}`,
			metadata: { updatedFields: Object.keys(dto) },
		});

		this.logger.log(`Template updated: ${templateId} by user: ${userId}`);

		return updatedTemplate;
	}

	async findAllTemplates() {
		return this.messageTemplatesRepository.findAll({
			where: { deletedAt: undefined },
			order: { createdAt: 'DESC' as any },
		});
	}

	async findTemplateById(templateId: string) {
		const template = await this.messageTemplatesRepository.findOne({
			where: { templateId },
		});

		if (!template) {
			throw new NotFoundException(`Message template with ID ${templateId} not found`);
		}

		return template;
	}

	async deleteTemplate(templateId: string, userId: string) {
		const template = await this.findTemplateById(templateId);

		const queryBuilder = this.messageTemplatesRepository.createQueryBuilder('template');
		await queryBuilder
			.softDelete()
			.where('template_id = :templateId', { templateId })
			.execute();

		await this.auditService.createLog({
			action: AuditAction.TEMPLATE_UPDATED,
			performedBy: userId,
			targetType: AuditTargetType.TEMPLATE,
			targetId: templateId,
			details: `Message template archived: ${template.name}`,
		});

		this.logger.log(`Template soft-deleted: ${templateId} by user: ${userId}`);

		return { message: 'Template archived successfully' };
	}

	async renderTemplate(templateId: string, variables: Record<string, any>): Promise<{ subject?: string; body: string }> {
		const template = await this.findTemplateById(templateId);

		let renderedBody = template.body;
		let renderedSubject = template.subject || undefined;

		// Replace {{variable}} placeholders with actual values
		for (const [key, value] of Object.entries(variables)) {
			const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
			renderedBody = renderedBody.replace(placeholder, String(value));
			if (renderedSubject) {
				renderedSubject = renderedSubject.replace(placeholder, String(value));
			}
		}

		return {
			subject: renderedSubject,
			body: renderedBody,
		};
	}
}
