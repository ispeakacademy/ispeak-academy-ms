import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeesTable1772365000000 implements MigrationInterface {
	name = 'AddEmployeesTable1772365000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Create enum types
		await queryRunner.query(
			`CREATE TYPE "public"."employees_role_enum" AS ENUM('director', 'admin', 'trainer', 'finance', 'sales', 'operations')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."employees_status_enum" AS ENUM('active', 'inactive', 'on_leave')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."employees_employment_type_enum" AS ENUM('full_time', 'part_time', 'freelance', 'volunteer')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."trainer_availability_blocks_type_enum" AS ENUM('leave', 'unavailable', 'training')`,
		);

		// Create employees table
		await queryRunner.query(`
			CREATE TABLE "employees" (
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"employee_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"first_name" character varying NOT NULL,
				"last_name" character varying NOT NULL,
				"email" character varying NOT NULL,
				"phone" character varying,
				"profile_photo_url" character varying,
				"role" "public"."employees_role_enum" NOT NULL,
				"status" "public"."employees_status_enum" NOT NULL DEFAULT 'active',
				"employment_type" "public"."employees_employment_type_enum" NOT NULL,
				"specialization" character varying,
				"certifications" jsonb NOT NULL DEFAULT '[]',
				"bio" text,
				"linked_user_id" uuid,
				"start_date" date,
				"end_date" date,
				"hourly_rate" numeric(10,2),
				"rate_currency" character varying(3),
				"available_days" jsonb NOT NULL DEFAULT '[]',
				"available_hours" jsonb,
				CONSTRAINT "UQ_employees_email" UNIQUE ("email"),
				CONSTRAINT "PK_employees" PRIMARY KEY ("employee_id")
			)
		`);

		// Create unique index on email
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_employees_email" ON "employees" ("email")`,
		);

		// Create FK from employees.linked_user_id → users.user_id
		await queryRunner.query(
			`ALTER TABLE "employees" ADD CONSTRAINT "FK_employees_linked_user" FOREIGN KEY ("linked_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);

		// Create trainer_availability_blocks table
		await queryRunner.query(`
			CREATE TABLE "trainer_availability_blocks" (
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"block_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"employee_id" uuid NOT NULL,
				"start_date" date NOT NULL,
				"end_date" date NOT NULL,
				"type" "public"."trainer_availability_blocks_type_enum" NOT NULL,
				"reason" character varying,
				CONSTRAINT "PK_trainer_availability_blocks" PRIMARY KEY ("block_id")
			)
		`);

		// Create FK from trainer_availability_blocks.employee_id → employees.employee_id
		await queryRunner.query(
			`ALTER TABLE "trainer_availability_blocks" ADD CONSTRAINT "FK_availability_blocks_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);

		// Add employee audit actions to the audit_logs_action_enum
		await queryRunner.query(
			`ALTER TYPE "public"."audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'employee_created'`,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'employee_updated'`,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'employee_deleted'`,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'employee_deactivated'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop FKs
		await queryRunner.query(
			`ALTER TABLE "trainer_availability_blocks" DROP CONSTRAINT "FK_availability_blocks_employee"`,
		);
		await queryRunner.query(
			`ALTER TABLE "employees" DROP CONSTRAINT "FK_employees_linked_user"`,
		);

		// Drop index
		await queryRunner.query(`DROP INDEX "public"."IDX_employees_email"`);

		// Drop tables
		await queryRunner.query(`DROP TABLE "trainer_availability_blocks"`);
		await queryRunner.query(`DROP TABLE "employees"`);

		// Drop enum types
		await queryRunner.query(`DROP TYPE "public"."trainer_availability_blocks_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."employees_employment_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."employees_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."employees_role_enum"`);

		// Note: Cannot remove values from PostgreSQL enums, so audit_logs_action_enum changes are not reverted
	}
}
