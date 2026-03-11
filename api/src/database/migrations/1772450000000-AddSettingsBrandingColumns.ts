import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsBrandingColumns1772450000000 implements MigrationInterface {
	name = 'AddSettingsBrandingColumns1772450000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "system_settings" ADD "website_url" varchar(500)`,
		);
		await queryRunner.query(
			`ALTER TABLE "system_settings" ADD "invoice_logo" varchar(500)`,
		);
		await queryRunner.query(
			`ALTER TABLE "system_settings" ADD "primary_color" varchar(20) NOT NULL DEFAULT '#000000'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system_settings" ADD "secondary_color" varchar(20) NOT NULL DEFAULT '#D4A843'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system_settings" ADD "whatsapp_notifications" boolean NOT NULL DEFAULT false`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "system_settings" DROP COLUMN "whatsapp_notifications"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system_settings" DROP COLUMN "secondary_color"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system_settings" DROP COLUMN "primary_color"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system_settings" DROP COLUMN "invoice_logo"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system_settings" DROP COLUMN "website_url"`,
		);
	}
}
