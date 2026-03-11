import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixInvoiceClientIdType1772470000000 implements MigrationInterface {
	name = 'FixInvoiceClientIdType1772470000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Change client_id from varchar to uuid so joins with clients table work
		await queryRunner.query(
			`ALTER TABLE "invoices" ALTER COLUMN "client_id" TYPE uuid USING "client_id"::uuid`,
		);

		// Add foreign key constraint
		await queryRunner.query(
			`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_client_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoices" ALTER COLUMN "client_id" TYPE character varying`,
		);
	}
}
