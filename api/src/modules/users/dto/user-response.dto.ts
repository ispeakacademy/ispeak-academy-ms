import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  userId: string;

  @Expose()
  email: string;

  @Exclude()
  passwordHash: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  avatarUrl: string;

  @Expose()
  roleId: string;

  @Expose()
  status: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}