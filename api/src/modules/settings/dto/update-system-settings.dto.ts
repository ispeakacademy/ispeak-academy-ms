import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class UpdateSystemSettingsDto {
  // General Settings
  @ApiPropertyOptional({ description: 'Platform name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  platformName?: string;

  @ApiPropertyOptional({ description: 'Support email address' })
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiPropertyOptional({ description: 'Website URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  websiteUrl?: string;

  // Branding Settings
  @ApiPropertyOptional({ description: 'App logo URL', maxLength: 500 })
  @IsOptional()
  @MaxLength(500)
  appLogo?: string;

  @ApiPropertyOptional({ description: 'App favicon URL', maxLength: 500 })
  @IsOptional()
  @MaxLength(500)
  appFavicon?: string;

  @ApiPropertyOptional({ description: 'Invoice/receipt logo URL', maxLength: 500 })
  @IsOptional()
  @MaxLength(500)
  invoiceLogo?: string;

  @ApiPropertyOptional({ description: 'Primary brand color hex code', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color hex code', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  secondaryColor?: string;

  // Contact Information
  @ApiPropertyOptional({ description: 'Contact phone number', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Contact address' })
  @IsOptional()
  @IsString()
  contactAddress?: string;

  // Social Media Links
  @ApiPropertyOptional({ description: 'Facebook page URL', maxLength: 200 })
  @IsOptional()
  @IsUrl()
  @MaxLength(200)
  socialFacebook?: string;

  @ApiPropertyOptional({ description: 'Twitter profile URL', maxLength: 200 })
  @IsOptional()
  @IsUrl()
  @MaxLength(200)
  socialTwitter?: string;

  @ApiPropertyOptional({ description: 'LinkedIn profile URL', maxLength: 200 })
  @IsOptional()
  @IsUrl()
  @MaxLength(200)
  socialLinkedin?: string;

  @ApiPropertyOptional({ description: 'Instagram profile URL', maxLength: 200 })
  @IsOptional()
  @IsUrl()
  @MaxLength(200)
  socialInstagram?: string;

  // File Upload Settings
  @ApiPropertyOptional({ description: 'Maximum file upload size in MB', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  maxFileUploadSize?: number;

  @ApiPropertyOptional({ description: 'Allowed file types for upload', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  // User Settings
  @ApiPropertyOptional({ description: 'Allow user signup' })
  @IsOptional()
  @IsBoolean()
  allowSignup?: boolean;

  @ApiPropertyOptional({ description: 'Require email verification for new users' })
  @IsOptional()
  @IsBoolean()
  requireVerification?: boolean;

  // Notification Settings
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS notifications' })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable admin alerts' })
  @IsOptional()
  @IsBoolean()
  adminAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Enable WhatsApp notifications' })
  @IsOptional()
  @IsBoolean()
  whatsappNotifications?: boolean;
}
