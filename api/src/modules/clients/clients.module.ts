import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { CommunicationsModule } from '../communications/communications.module';
import { UsersModule } from '../users/users.module';
import { Client } from './entities/client.entity';
import { ClientInteraction } from './entities/client-interaction.entity';
import { ClientsController } from './clients.controller';
import { ClientsRepository } from './clients.repository';
import { InteractionsRepository } from './interactions.repository';
import { ClientsService } from './clients.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Client, ClientInteraction]),
		AuditModule,
		UsersModule,
		forwardRef(() => CommunicationsModule),
	],
	controllers: [ClientsController],
	providers: [ClientsService, ClientsRepository, InteractionsRepository],
	exports: [ClientsService, ClientsRepository],
})
export class ClientsModule {}
