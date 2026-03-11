import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { MpesaController } from './mpesa.controller';
import { MpesaService } from './mpesa.service';

@Module({
	imports: [InvoicesModule, AuditModule],
	controllers: [MpesaController],
	providers: [MpesaService],
	exports: [MpesaService],
})
export class MpesaModule {}
