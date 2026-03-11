import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignmentAuditEnumValues1772610000000 implements MigrationInterface {
	name = 'AddAssignmentAuditEnumValues1772610000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add new values to audit_logs_action_enum
		await queryRunner.query(`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'assignment_created'`);
		await queryRunner.query(`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'assignment_updated'`);
		await queryRunner.query(`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'assignment_deleted'`);
		await queryRunner.query(`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'assignment_submitted'`);
		await queryRunner.query(`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'assignment_reviewed'`);

		// Add new values to audit_logs_targettype_enum
		await queryRunner.query(`ALTER TYPE "audit_logs_targettype_enum" ADD VALUE IF NOT EXISTS 'assignment'`);
		await queryRunner.query(`ALTER TYPE "audit_logs_targettype_enum" ADD VALUE IF NOT EXISTS 'notification'`);
	}

	public async down(_queryRunner: QueryRunner): Promise<void> {
		// PostgreSQL does not support removing values from enums
		// These values will remain in the enum types
	}
}
