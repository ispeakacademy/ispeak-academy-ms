export interface SystemSetting {
  systemSettingId: string;
  platformName: string;
  supportEmail: string;
  websiteUrl?: string;

  // Branding Settings
  appLogo?: string;
  appFavicon?: string;
  invoiceLogo?: string;
  primaryColor: string;
  secondaryColor: string;

  // Contact Information
  contactPhone?: string;
  contactAddress?: string;

  // Social Media Links
  socialFacebook?: string;
  socialTwitter?: string;
  socialLinkedin?: string;
  socialInstagram?: string;

  // File Upload Settings
  maxFileUploadSize: number;
  allowedFileTypes?: string[];

  // User Settings
  allowSignup: boolean;
  requireVerification: boolean;

  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  adminAlerts: boolean;
  whatsappNotifications: boolean;

  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface GetSettingsResponse {
  success: boolean;
  message: string;
  data: SystemSetting;
}

export interface UpdateSettingsResponse {
  success: boolean;
  message: string;
  data: SystemSetting;
}
