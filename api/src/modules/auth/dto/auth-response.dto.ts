import { User } from '@/modules/users/entities/user.entity';

export class AuthResponseDto {
  user: User;
  accessToken: string;
  refreshToken: string;
  mustChangePassword?: boolean;
}
