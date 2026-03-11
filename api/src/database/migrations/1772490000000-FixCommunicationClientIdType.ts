import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCommunicationClientIdType1772490000000 implements MigrationInterface {
	name = 'FixCommunicationClientIdType1772490000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "communications" ALTER COLUMN "client_id" TYPE uuid USING "client_id"::uuid`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "communications" ALTER COLUMN "client_id" TYPE character varying`,
		);
	}
}
