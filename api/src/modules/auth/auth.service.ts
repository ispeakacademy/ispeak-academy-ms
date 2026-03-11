import { UserStatus } from '@/common/enums/user-status.enum';
import authConfig from '@/config/auth.config';
import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { EmailService } from '../communications/services/email.service';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('No password set for this account.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active.');
    }

    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.roleId,
      isAdminUser: user.userRole?.isAdminRole,
      linkedEmployeeId: user.linkedEmployeeId || undefined,
      linkedClientId: user.linkedClientId || undefined,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    await this.usersService.updateLastLogin(user.userId);

    return {
      user,
      accessToken,
      refreshToken,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create(registerDto);

    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.roleId,
      isAdminUser: user.userRole?.isAdminRole,
      linkedEmployeeId: user.linkedEmployeeId || undefined,
      linkedClientId: user.linkedClientId || undefined,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(user: JwtPayload): Promise<{ accessToken: string }> {
    const payload: JwtPayload = {
      sub: user.sub,
      email: user.email,
      role: user.role,
      isAdminUser: user.isAdminUser,
      linkedEmployeeId: user.linkedEmployeeId,
      linkedClientId: user.linkedClientId,
    };

    const accessToken = this.generateAccessToken(payload);
    return { accessToken };
  }

  private generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: authConfig.jwtSecret,
      expiresIn: authConfig.jwtExpiresIn,
    });
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: authConfig.jwtRefreshSecret,
      expiresIn: authConfig.jwtRefreshExpiresIn,
    });
  }

  async getCurrentUser(id: string) {
    return this.usersService.findOne(id);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Account is not active.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await this.usersService.updateResetToken(user.userId, resetTokenHash, resetTokenExpires);

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.emailService.sendEmail(
        email,
        'Reset Your Password — iSpeak Academy',
        this.buildResetEmailHtml(user.firstName || 'there', resetUrl),
      );
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
    }

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByResetToken(tokenHash);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.usersService.updatePassword(user.userId, newPassword);
    await this.usersService.clearResetToken(user.userId);

    return { message: 'Password has been reset successfully' };
  }

  async setPassword(userId: string, newPassword: string): Promise<void> {
    await this.usersService.setPassword(userId, newPassword);
  }

  private buildResetEmailHtml(firstName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#1a365d;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">iSpeak Academy</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1a365d;font-size:20px;">Reset Your Password</h2>
              <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
                Hi ${firstName}, we received a request to reset your password. Click the button below to set a new password.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:24px auto;">
                <tr>
                  <td style="background-color:#2b6cb0;border-radius:6px;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#a0aec0;font-size:13px;line-height:1.6;">
                This link will expire in 15 minutes. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f7fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#a0aec0;font-size:13px;line-height:1.5;">
                <a href="mailto:info@ispeakacademy.org" style="color:#2b6cb0;text-decoration:none;">info@ispeakacademy.org</a>
              </p>
              <p style="margin:8px 0 0;color:#cbd5e0;font-size:12px;">&copy; ${new Date().getFullYear()} iSpeak Academy. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
  }
}
