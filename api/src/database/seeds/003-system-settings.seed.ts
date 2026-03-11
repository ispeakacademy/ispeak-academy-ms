import { SystemSetting } from '@/modules/settings/entities/system-setting.entity';
import { DataSource } from 'typeorm';

export class SystemSettingsSeed {
	async run(dataSource: DataSource): Promise<void> {
		console.log('Seeding system settings...');

		const settingsRepo = dataSource.getRepository(SystemSetting);

		// Only create if no settings record exists
		const existingSettings = await settingsRepo.find();

		if (existingSettings.length === 0) {
			const settings = settingsRepo.create({
				platformName: 'iSpeak Academy BMS',
				supportEmail: 'support@ispeakacademy.org',
				contactPhone: '+254700000000',
				contactAddress: 'Nairobi, Kenya',
				maxFileUploadSize: 10,
				allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
				allowSignup: false,
				requireVerification: false,
				emailNotifications: true,
				smsNotifications: false,
				adminAlerts: true,
			});

			await settingsRepo.save(settings);
			console.log('  System settings created with defaults.');
		} else {
			console.log('  System settings already exist, skipping.');
		}
	}
}
