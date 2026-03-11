import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCohortIdNullable1772366000000 implements MigrationInterface {
    name = 'MakeCohortIdNullable1772366000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Convert program_id from varchar to uuid in-place (preserving data)
        await queryRunner.query(`ALTER TABLE "enrollments" ALTER COLUMN "program_id" TYPE uuid USING "program_id"::uuid`);

        // Add FK from enrollments.program_id to programs
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_46cbd5f5fcd422a898bfdf8aabb" FOREIGN KEY ("program_id") REFERENCES "programs"("program_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Normalize employee constraints
        await queryRunner.query(`ALTER TABLE "trainer_availability_blocks" DROP CONSTRAINT "FK_availability_blocks_employee"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_employees_linked_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_employees_email"`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "UQ_9bf95a85a72d78b81852ff4b3f8" UNIQUE ("linked_user_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_765bc1ac8967533a04c74a9f6a" ON "employees" ("email") `);
        await queryRunner.query(`ALTER TABLE "trainer_availability_blocks" ADD CONSTRAINT "FK_e534f80680afe7882a45bae933b" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_9bf95a85a72d78b81852ff4b3f8" FOREIGN KEY ("linked_user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_46cbd5f5fcd422a898bfdf8aabb"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_9bf95a85a72d78b81852ff4b3f8"`);
        await queryRunner.query(`ALTER TABLE "trainer_availability_blocks" DROP CONSTRAINT "FK_e534f80680afe7882a45bae933b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_765bc1ac8967533a04c74a9f6a"`);

        // Convert program_id back to varchar
        await queryRunner.query(`ALTER TABLE "enrollments" ALTER COLUMN "program_id" TYPE character varying USING "program_id"::text`);

        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "UQ_9bf95a85a72d78b81852ff4b3f8"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_employees_email" ON "employees" ("email") `);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_employees_linked_user" FOREIGN KEY ("linked_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trainer_availability_blocks" ADD CONSTRAINT "FK_availability_blocks_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
