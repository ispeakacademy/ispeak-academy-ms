import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrainerIdsToPrograms1772500000000 implements MigrationInterface {
	name = 'AddTrainerIdsToPrograms1772500000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "programs" ADD COLUMN "trainer_ids" jsonb NOT NULL DEFAULT '[]'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "programs" DROP COLUMN "trainer_ids"`,
		);
	}
}
