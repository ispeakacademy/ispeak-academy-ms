import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { CommunicationsModule } from '../communications/communications.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { SettingsModule } from '../settings/settings.module';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLineItem } from './entities/invoice-line-item.entity';
import { Payment } from './entities/payment.entity';
import { InvoicesController, PaymentsController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './services/invoice-pdf.service';
import { InvoicesRepository } from './repositories/invoices.repository';
import { InvoiceLineItemsRepository } from './repositories/invoice-line-items.repository';
import { PaymentsRepository } from './repositories/payments.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([Invoice, InvoiceLineItem, Payment]),
		AuditModule,
		CommunicationsModule,
		forwardRef(() => EnrollmentsModule),
		SettingsModule,
	],
	controllers: [InvoicesController, PaymentsController],
	providers: [
		InvoicesService,
		InvoicePdfService,
		InvoicesRepository,
		InvoiceLineItemsRepository,
		PaymentsRepository,
	],
	exports: [InvoicesService, PaymentsRepository],
})
export class InvoicesModule {}
