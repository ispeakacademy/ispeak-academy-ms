import { Permission, PermissionAction, PermissionResource } from '@/modules/permissions/entities/permission.entity';
import { Role } from '@/modules/permissions/entities/role.entity';
import {
	ADMIN_PERMISSIONS,
	FINANCE_PERMISSIONS,
	SUPER_ADMIN_PERMISSIONS,
	SYSTEM_PERMISSIONS,
	TRAINER_PERMISSIONS,
} from '@/modules/permissions/constants/permissions.constant';
import { UserRole } from '@/common/enums/user-role.enum';
import { DataSource } from 'typeorm';

export class PermissionsSeed {
	async run(dataSource: DataSource): Promise<void> {
		console.log('Seeding permissions...');

		const permissionRepo = dataSource.getRepository(Permission);
		const roleRepo = dataSource.getRepository(Role);

		// Upsert all system permissions
		for (const def of SYSTEM_PERMISSIONS) {
			const existing = await permissionRepo.findOne({
				where: { resource: def.resource, action: def.action },
			});

			if (!existing) {
				await permissionRepo.save(
					permissionRepo.create({
						resource: def.resource,
						action: def.action,
						name: def.name,
						description: def.description,
					}),
				);
			}
		}

		console.log(`  Permissions seeded: ${SYSTEM_PERMISSIONS.length}`);

		// Load all permissions for role assignment
		const allPermissions = await permissionRepo.find();

		const getPermissionEntities = (permStrings: string[]): Permission[] => {
			return allPermissions.filter((p) =>
				permStrings.includes(`${p.resource}:${p.action}`),
			);
		};

		// Define roles
		const roleDefs = [
			{
				name: UserRole.SUPER_ADMIN,
				description: 'Full system access',
				isSystemRole: true,
				isAdminRole: true,
				permissions: SUPER_ADMIN_PERMISSIONS,
			},
			{
				name: UserRole.ADMIN,
				description: 'Day-to-day operations management',
				isSystemRole: false,
				isAdminRole: true,
				permissions: ADMIN_PERMISSIONS,
			},
			{
				name: UserRole.FINANCE,
				description: 'Invoicing and revenue management',
				isSystemRole: true,
				isAdminRole: true,
				permissions: FINANCE_PERMISSIONS,
			},
			{
				name: UserRole.TRAINER,
				description: 'Cohort and session management',
				isSystemRole: true,
				isAdminRole: true,
				permissions: TRAINER_PERMISSIONS,
			},
			{
				name: UserRole.PARTNER,
				description: 'Partner portal access',
				isSystemRole: true,
				isAdminRole: false,
				permissions: [
					`${PermissionResource.PARTNERS}:${PermissionAction.READ}`,
					`${PermissionResource.DASHBOARD}:${PermissionAction.READ}`,
				],
			},
			{
				name: UserRole.CLIENT,
				description: 'Client self-service portal',
				isSystemRole: true,
				isAdminRole: false,
				permissions: [
					`${PermissionResource.ENROLLMENTS}:${PermissionAction.READ}`,
					`${PermissionResource.INVOICES}:${PermissionAction.READ}`,
					`${PermissionResource.PROGRAMS}:${PermissionAction.READ}`,
				],
			},
		];

		for (const def of roleDefs) {
			let role = await roleRepo.findOne({ where: { name: def.name } });

			if (!role) {
				role = roleRepo.create({
					name: def.name,
					description: def.description,
					isSystemRole: def.isSystemRole,
					isAdminRole: def.isAdminRole,
				});
			} else {
				role.description = def.description;
				role.isSystemRole = def.isSystemRole;
				role.isAdminRole = def.isAdminRole;
			}

			role.permissions = getPermissionEntities(def.permissions);
			await roleRepo.save(role);
		}

		console.log(`  Roles seeded: ${roleDefs.length}`);
	}
}
