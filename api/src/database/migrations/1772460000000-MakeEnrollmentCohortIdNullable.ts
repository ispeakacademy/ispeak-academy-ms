import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeEnrollmentCohortIdNullable1772460000000 implements MigrationInterface {
	name = 'MakeEnrollmentCohortIdNullable1772460000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Drop the existing foreign key constraint first
		await queryRunner.query(
			`ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "FK_66dbba19e66e25c3814f80b6478"`,
		);
		// Make cohort_id nullable
		await queryRunner.query(
			`ALTER TABLE "enrollments" ALTER COLUMN "cohort_id" DROP NOT NULL`,
		);
		// Re-add foreign key constraint
		await queryRunner.query(
			`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_66dbba19e66e25c3814f80b6478" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("cohort_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "enrollments" ALTER COLUMN "cohort_id" SET NOT NULL`,
		);
	}
}
