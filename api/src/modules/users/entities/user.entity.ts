import { UserStatus } from '@/common/enums/user-status.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Role } from '@/modules/permissions/entities/role.entity';
import { Exclude } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true })
export class User extends AbstractEntity<User> {
	@PrimaryGeneratedColumn('uuid', { name: 'user_id' })
	userId: string;

	@Column({ name: 'role_id', nullable: true })
	roleId: string;

	@Column({ unique: true })
	email: string;

	@Column({ name: 'password_hash', nullable: true })
	@Exclude()
	passwordHash?: string;

	@Column({ nullable: true })
	firstName?: string;

	@Column({ nullable: true })
	lastName?: string;

	@Column({ nullable: true })
	phone?: string;

	@Column({ name: 'avatar_url', nullable: true })
	avatarUrl?: string;

	@Column({
		type: 'enum',
		enum: UserStatus,
		default: UserStatus.ACTIVE,
	})
	status: UserStatus;

	@Column({ name: 'is_active', default: true })
	isActive: boolean;

	@Column({ name: 'must_change_password', default: false })
	mustChangePassword: boolean;

	@Column({ name: 'linked_client_id', nullable: true })
	linkedClientId?: string;

	@Column({ name: 'linked_employee_id', nullable: true })
	linkedEmployeeId?: string;

	@Column({ name: 'linked_partner_id', nullable: true })
	linkedPartnerId?: string;

	@Column({ name: 'reset_password_token', nullable: true })
	resetPasswordToken?: string;

	@Column({ name: 'reset_password_expires', nullable: true })
	resetPasswordExpires?: Date;

	@Column({ name: 'last_login_at', nullable: true })
	lastLoginAt?: Date;

	@Column({ name: 'refresh_token_hash', nullable: true })
	@Exclude()
	refreshTokenHash?: string;

	// Relations
	@ManyToOne(() => Role, (role) => role.users, { eager: true, nullable: true })
	@JoinColumn({ name: 'role_id' })
	userRole: Role;

	get fullName(): string {
		return `${this.firstName || ''} ${this.lastName || ''}`.trim();
	}

	get permissions(): string[] {
		if (!this.userRole?.permissions) return [];
		return this.userRole.permissions.map(p => `${p.resource}:${p.action}`);
	}
}
