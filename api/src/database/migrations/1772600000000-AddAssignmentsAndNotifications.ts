import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignmentsAndNotifications1772600000000 implements MigrationInterface {
	name = 'AddAssignmentsAndNotifications1772600000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Create assignment_status enum
		await queryRunner.query(`
			CREATE TYPE "assignment_status_enum" AS ENUM ('draft', 'published', 'archived')
		`);

		// Create submission_status enum
		await queryRunner.query(`
			CREATE TYPE "submission_status_enum" AS ENUM ('pending', 'submitted', 'reviewed', 'revision_requested')
		`);

		// Create notification_type enum
		await queryRunner.query(`
			CREATE TYPE "notification_type_enum" AS ENUM (
				'assignment_posted', 'assignment_due_soon', 'assignment_overdue',
				'assignment_submitted', 'assignment_reviewed', 'assignment_revision_requested',
				'session_reminder_24h', 'session_reminder_1h', 'session_cancelled', 'session_rescheduled',
				'enrollment_approved', 'enrollment_confirmed', 'module_progress_updated',
				'payment_received', 'general'
			)
		`);

		// Create assignments table
		await queryRunner.query(`
			CREATE TABLE "assignments" (
				"assignment_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
				"enrollment_id" UUID NOT NULL,
				"cohort_id" UUID,
				"module_id" UUID,
				"title" VARCHAR NOT NULL,
				"description" TEXT,
				"links" JSONB NOT NULL DEFAULT '[]',
				"attachment_urls" JSONB NOT NULL DEFAULT '[]',
				"due_date" TIMESTAMPTZ,
				"status" "assignment_status_enum" NOT NULL DEFAULT 'published',
				"created_by_employee_id" UUID NOT NULL,
				"order_index" INT NOT NULL DEFAULT 0,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMPTZ,
				CONSTRAINT "PK_assignments" PRIMARY KEY ("assignment_id"),
				CONSTRAINT "FK_assignments_enrollment" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("enrollment_id") ON DELETE CASCADE
			)
		`);

		// Create assignment_submissions table
		await queryRunner.query(`
			CREATE TABLE "assignment_submissions" (
				"submission_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
				"assignment_id" UUID NOT NULL,
				"client_id" UUID NOT NULL,
				"notes" TEXT,
				"attachment_urls" JSONB NOT NULL DEFAULT '[]',
				"status" "submission_status_enum" NOT NULL DEFAULT 'pending',
				"submitted_at" TIMESTAMPTZ,
				"reviewed_at" TIMESTAMPTZ,
				"reviewed_by_employee_id" UUID,
				"reviewer_feedback" TEXT,
				"score" DECIMAL(5,2),
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMPTZ,
				CONSTRAINT "PK_assignment_submissions" PRIMARY KEY ("submission_id"),
				CONSTRAINT "FK_assignment_submissions_assignment" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("assignment_id") ON DELETE CASCADE
			)
		`);

		// Create notifications table
		await queryRunner.query(`
			CREATE TABLE "notifications" (
				"notification_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
				"recipient_user_id" UUID NOT NULL,
				"title" VARCHAR NOT NULL,
				"message" TEXT NOT NULL,
				"type" "notification_type_enum" NOT NULL DEFAULT 'general',
				"is_read" BOOLEAN NOT NULL DEFAULT false,
				"read_at" TIMESTAMPTZ,
				"link" VARCHAR,
				"metadata" JSONB,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMPTZ,
				CONSTRAINT "PK_notifications" PRIMARY KEY ("notification_id"),
				CONSTRAINT "FK_notifications_user" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
			)
		`);

		// Add indexes
		await queryRunner.query(`CREATE INDEX "IDX_assignments_enrollment_id" ON "assignments" ("enrollment_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_assignments_cohort_id" ON "assignments" ("cohort_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_assignment_submissions_assignment_id" ON "assignment_submissions" ("assignment_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_assignment_submissions_client_id" ON "assignment_submissions" ("client_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_notifications_recipient" ON "notifications" ("recipient_user_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("recipient_user_id", "is_read")`);

		// Add new values to audit_logs_action_enum
		await queryRunner.query(`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'assignment_created'`);
		await queryRunner.query(`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'assignment_updated'`);
		await queryRunner.query(`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'assignment_deleted'`);
		await queryRunner.query(`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'assignment_submitted'`);
		await queryRunner.query(`ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'assignment_reviewed'`);

		// Add new values to audit_logs_targettype_enum
		await queryRunner.query(`ALTER TYPE "audit_logs_targettype_enum" ADD VALUE IF NOT EXISTS 'assignment'`);
		await queryRunner.query(`ALTER TYPE "audit_logs_targettype_enum" ADD VALUE IF NOT EXISTS 'notification'`);

		// Add session reminder tracking columns
		await queryRunner.query(`ALTER TABLE "sessions" ADD COLUMN "reminder_24h_sent_at" TIMESTAMPTZ`);
		await queryRunner.query(`ALTER TABLE "sessions" ADD COLUMN "reminder_1h_sent_at" TIMESTAMPTZ`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Remove session columns
		await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "reminder_1h_sent_at"`);
		await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "reminder_24h_sent_at"`);

		// Drop indexes
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_is_read"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_recipient"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assignment_submissions_client_id"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assignment_submissions_assignment_id"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assignments_cohort_id"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assignments_enrollment_id"`);

		// Drop tables
		await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "assignment_submissions"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "assignments"`);

		// Drop enums
		await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
		await queryRunner.query(`DROP TYPE IF EXISTS "submission_status_enum"`);
		await queryRunner.query(`DROP TYPE IF EXISTS "assignment_status_enum"`);
	}
}
