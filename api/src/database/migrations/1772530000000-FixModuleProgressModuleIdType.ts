import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixModuleProgressModuleIdType1772530000000 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "module_progress" ALTER COLUMN "module_id" TYPE uuid USING "module_id"::uuid`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "module_progress" ALTER COLUMN "module_id" TYPE character varying USING "module_id"::character varying`,
		);
	}
}
