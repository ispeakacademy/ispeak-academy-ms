import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientPortalInviteSentAuditAction1772510000000 implements MigrationInterface {
	name = 'AddClientPortalInviteSentAuditAction1772510000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'client_portal_invite_sent'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// PostgreSQL does not support removing values from an enum type.
		// This is a no-op; the value will remain but is harmless if unused.
	}
}
