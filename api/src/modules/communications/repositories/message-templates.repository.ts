import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplate } from '../entities/message-template.entity';

@Injectable()
export class MessageTemplatesRepository extends AbstractRepository<MessageTemplate> {
	constructor(
		@InjectRepository(MessageTemplate)
		private readonly messageTemplateRepository: Repository<MessageTemplate>,
	) {
		super(messageTemplateRepository);
	}

	createQueryBuilder(alias: string) {
		return this.messageTemplateRepository.createQueryBuilder(alias);
	}
}
