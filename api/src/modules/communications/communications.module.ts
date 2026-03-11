import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { ClientsModule } from '../clients/clients.module';
import { CommunicationsController, TemplatesController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { AfricasTalkingWebhookController } from './webhooks/africas-talking-webhook.controller';
import { ResendWebhookController } from './webhooks/resend-webhook.controller';
import { Communication } from './entities/communication.entity';
import { MessageTemplate } from './entities/message-template.entity';
import { CommunicationsRepository } from './repositories/communications.repository';
import { MessageTemplatesRepository } from './repositories/message-templates.repository';
import { AfricasTalkingService } from './services/africas-talking.service';
import { EmailService } from './services/email.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Communication, MessageTemplate]),
		AuditModule,
		forwardRef(() => ClientsModule),
	],
	controllers: [CommunicationsController, TemplatesController, ResendWebhookController, AfricasTalkingWebhookController],
	providers: [
		CommunicationsService,
		EmailService,
		AfricasTalkingService,
		CommunicationsRepository,
		MessageTemplatesRepository,
	],
	exports: [CommunicationsService, EmailService, AfricasTalkingService],
})
export class CommunicationsModule {}
