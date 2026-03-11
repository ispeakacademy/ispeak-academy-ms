import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixForeignKeyTypes1772480000000 implements MigrationInterface {
	name = 'FixForeignKeyTypes1772480000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Fix enrollments.program_id: varchar → uuid
		await queryRunner.query(
			`ALTER TABLE "enrollments" ALTER COLUMN "program_id" TYPE uuid USING "program_id"::uuid`,
		);

		// Fix invoices.enrollment_id: varchar → uuid
		await queryRunner.query(
			`ALTER TABLE "invoices" ALTER COLUMN "enrollment_id" TYPE uuid USING "enrollment_id"::uuid`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "invoices" ALTER COLUMN "enrollment_id" TYPE character varying`,
		);
		await queryRunner.query(
			`ALTER TABLE "enrollments" ALTER COLUMN "program_id" TYPE character varying`,
		);
	}
}
