import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeEstimatedHoursToDecimal1772520000000 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "program_modules" ALTER COLUMN "estimated_hours" TYPE decimal(5,2)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "program_modules" ALTER COLUMN "estimated_hours" TYPE integer USING "estimated_hours"::integer`,
		);
	}
}
