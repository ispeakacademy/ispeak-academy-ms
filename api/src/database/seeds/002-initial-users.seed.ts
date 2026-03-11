import { UserRole } from '@/common/enums/user-role.enum';
import { Role } from '@/modules/permissions/entities/role.entity';
import { User } from '@/modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

export class InitialUsersSeed {
	async run(dataSource: DataSource): Promise<void> {
		console.log('Seeding initial users...');

		const userRepo = dataSource.getRepository(User);
		const roleRepo = dataSource.getRepository(Role);

		// Find the super admin role
		const superAdminRole = await roleRepo.findOne({
			where: { name: UserRole.SUPER_ADMIN },
		});

		if (!superAdminRole) {
			console.error('  Super Admin role not found. Run permissions seed first.');
			return;
		}

		// Check if super admin user already exists
		const existingSuperAdmin = await userRepo.findOne({
			where: { email: 'admin@ispeakacademy.org' },
		});

		if (!existingSuperAdmin) {
			const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe@2025!';
			const passwordHash = await bcrypt.hash(defaultPassword, 10);

			const superAdmin = userRepo.create({
				email: 'admin@ispeakacademy.org',
				passwordHash,
				firstName: 'Super',
				lastName: 'Admin',
				roleId: superAdminRole.roleId,
				isActive: true,
				mustChangePassword: true,
			});

			await userRepo.save(superAdmin);
			console.log('  Super Admin user created (admin@ispeakacademy.org)');
		} else {
			console.log('  Super Admin user already exists, skipping.');
		}
	}
}
