import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceLineItem } from '../entities/invoice-line-item.entity';

@Injectable()
export class InvoiceLineItemsRepository extends AbstractRepository<InvoiceLineItem> {
	constructor(
		@InjectRepository(InvoiceLineItem)
		private readonly lineItemRepository: Repository<InvoiceLineItem>,
	) {
		super(lineItemRepository);
	}

	createQueryBuilder(alias: string) {
		return this.lineItemRepository.createQueryBuilder(alias);
	}
}
