'use client';

import PageHeader from '@/components/admin/PageHeader';
import { ImageUpload } from '@/components/forms/image-upload';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import {
  BgColorsOutlined,
  BellOutlined,
  FacebookOutlined,
  GlobalOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  SettingOutlined,
  XOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  ColorPicker,
  Divider,
  Form,
  Input,
  Row,
  Skeleton,
  Switch,
  Tabs,
  Typography,
} from 'antd';
import { useEffect } from 'react';

const { Text, Title } = Typography;

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-8 py-4 border-b border-gray-100 last:border-b-0">
      <div className="sm:w-64 flex-shrink-0">
        <Text strong className="text-sm">{label}</Text>
        {description && (
          <Text type="secondary" className="block text-xs mt-0.5">{description}</Text>
        )}
      </div>
      <div className="flex-1 max-w-md">{children}</div>
    </div>
  );
}

function NotificationToggle({
  name,
  label,
  description,
  icon,
}: {
  name: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="text-lg text-gray-500">{icon}</div>
        <div>
          <Text strong className="text-sm">{label}</Text>
          <Text type="secondary" className="block text-xs">{description}</Text>
        </div>
      </div>
      <Form.Item name={name} valuePropName="checked" className="!mb-0">
        <Switch />
      </Form.Item>
    </div>
  );
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [form] = Form.useForm();

  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings);
    }
  }, [settings, form]);

  const handleSave = async () => {
    const values = form.getFieldsValue(true);
    // Strip read-only and metadata fields the API doesn't accept
    const readOnlyFields = ['systemSettingId', 'createdAt', 'updatedAt', 'deletedAt'];
    const payload: Record<string, any> = {};
    for (const [key, value] of Object.entries(values)) {
      if (!readOnlyFields.includes(key) && value !== undefined && value !== null) {
        payload[key] = value;
      }
    }
    await updateSettings.mutateAsync(payload);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Settings" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Settings' }]} />
        <Card><Skeleton active paragraph={{ rows: 10 }} /></Card>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'general',
      label: (
        <span className="flex items-center gap-2">
          <SettingOutlined /> General
        </span>
      ),
      children: (
        <div>
          <div className="mb-2">
            <Title level={5} className="!mb-1">General Information</Title>
            <Text type="secondary" className="text-xs">Basic details about your organisation</Text>
          </div>
          <Divider className="!mt-2 !mb-0" />

          <SettingRow label="Platform Name" description="The name displayed across the system">
            <Form.Item name="platformName" className="!mb-0">
              <Input placeholder="iSpeak Academy" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="Support Email" description="Primary email for support and notifications">
            <Form.Item name="supportEmail" className="!mb-0">
              <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="support@ispeakacademy.org" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="Contact Phone" description="Phone number shown on invoices and communications">
            <Form.Item name="contactPhone" className="!mb-0">
              <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="+254 700 000 000" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="Contact Address" description="Physical address for invoices and receipts">
            <Form.Item name="contactAddress" className="!mb-0">
              <Input.TextArea rows={2} placeholder="Nairobi, Kenya" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="Website URL" description="Your public-facing website">
            <Form.Item name="websiteUrl" className="!mb-0">
              <Input prefix={<GlobalOutlined className="text-gray-400" />} placeholder="https://ispeakacademy.org" />
            </Form.Item>
          </SettingRow>

          <div className="mt-8 mb-2">
            <Title level={5} className="!mb-1">Social Media</Title>
            <Text type="secondary" className="text-xs">Links to your social media profiles</Text>
          </div>
          <Divider className="!mt-2 !mb-0" />

          <SettingRow label="Facebook">
            <Form.Item name="socialFacebook" className="!mb-0">
              <Input prefix={<FacebookOutlined className="text-gray-400" />} placeholder="https://facebook.com/ispeakacademy" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="Instagram">
            <Form.Item name="socialInstagram" className="!mb-0">
              <Input prefix={<InstagramOutlined className="text-gray-400" />} placeholder="https://instagram.com/ispeakacademy" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="LinkedIn">
            <Form.Item name="socialLinkedin" className="!mb-0">
              <Input prefix={<LinkedinOutlined className="text-gray-400" />} placeholder="https://linkedin.com/company/ispeakacademy" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="X (Twitter)">
            <Form.Item name="socialTwitter" className="!mb-0">
              <Input prefix={<XOutlined className="text-gray-400" />} placeholder="https://x.com/ispeakacademy" />
            </Form.Item>
          </SettingRow>
        </div>
      ),
    },
    {
      key: 'branding',
      label: (
        <span className="flex items-center gap-2">
          <BgColorsOutlined /> Branding
        </span>
      ),
      children: (
        <div>
          <div className="mb-2">
            <Title level={5} className="!mb-1">Logos</Title>
            <Text type="secondary" className="text-xs">Upload logos used across the platform and on documents</Text>
          </div>
          <Divider className="!mt-2 !mb-0" />

          <Row gutter={[24, 24]} className="mt-6">
            <Col xs={24} md={12}>
              <Card
                size="small"
                title={<Text strong className="text-sm">App Logo</Text>}
                className="h-full"
              >
                <Text type="secondary" className="text-xs block mb-3">
                  Displayed in the sidebar and login page
                </Text>
                <Form.Item name="appLogo" className="!mb-0">
                  <ImageUpload
                    description="Recommended: 200x60px, PNG or SVG"
                    accept="image/png,image/svg+xml,image/jpeg"
                    maxSize={2}
                  />
                </Form.Item>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                size="small"
                title={<Text strong className="text-sm">Invoice & Receipt Logo</Text>}
                className="h-full"
              >
                <Text type="secondary" className="text-xs block mb-3">
                  Appears on all invoices, receipts, and certificates
                </Text>
                <Form.Item name="invoiceLogo" className="!mb-0">
                  <ImageUpload
                    description="Recommended: 300x100px, PNG with transparent background"
                    accept="image/png,image/svg+xml,image/jpeg"
                    maxSize={2}
                  />
                </Form.Item>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                size="small"
                title={<Text strong className="text-sm">Favicon</Text>}
                className="h-full"
              >
                <Text type="secondary" className="text-xs block mb-3">
                  Browser tab icon
                </Text>
                <Form.Item name="appFavicon" className="!mb-0">
                  <ImageUpload
                    description="Recommended: 32x32px or 64x64px, PNG or ICO"
                    accept="image/png,image/x-icon,image/svg+xml"
                    maxSize={1}
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <div className="mt-8 mb-2">
            <Title level={5} className="!mb-1">Brand Colors</Title>
            <Text type="secondary" className="text-xs">
              Used on invoices, receipts, certificates, and PDF exports
            </Text>
          </div>
          <Divider className="!mt-2 !mb-0" />

          <Row gutter={[24, 16]} className="mt-6">
            <Col xs={24} sm={12}>
              <Card size="small" className="text-center">
                <Text strong className="text-sm block mb-3">Primary Color</Text>
                <Form.Item name="primaryColor" className="!mb-2"
                  getValueFromEvent={(color) => {
                    return typeof color === 'string' ? color : color?.toHexString?.() || '#000000';
                  }}
                >
                  <ColorPicker
                    size="large"
                    showText
                    format="hex"
                    presets={[
                      {
                        label: 'Recommended',
                        colors: ['#000000', '#1A1A2E', '#16213E', '#0F3460', '#1B1B2F', '#162447', '#1F4068'],
                      },
                    ]}
                  />
                </Form.Item>
                <Text type="secondary" className="text-xs">Headings, borders, and accents</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small" className="text-center">
                <Text strong className="text-sm block mb-3">Secondary Color</Text>
                <Form.Item name="secondaryColor" className="!mb-2"
                  getValueFromEvent={(color) => {
                    return typeof color === 'string' ? color : color?.toHexString?.() || '#D4A843';
                  }}
                >
                  <ColorPicker
                    size="large"
                    showText
                    format="hex"
                    presets={[
                      {
                        label: 'Recommended',
                        colors: ['#D4A843', '#C9A84C', '#B8860B', '#DAA520', '#E5A100', '#FFB347', '#F0C040'],
                      },
                    ]}
                  />
                </Form.Item>
                <Text type="secondary" className="text-xs">Highlights, buttons, and badges</Text>
              </Card>
            </Col>
          </Row>

          <div className="mt-6">
            <Card size="small">
              <Text strong className="text-sm block mb-3">Preview</Text>
              <div
                className="rounded-lg p-4 flex items-center gap-4"
                style={{ backgroundColor: form.getFieldValue('primaryColor') || '#000000' }}
              >
                <div
                  className="px-4 py-1.5 rounded font-semibold text-sm"
                  style={{
                    backgroundColor: form.getFieldValue('secondaryColor') || '#D4A843',
                    color: form.getFieldValue('primaryColor') || '#000000',
                  }}
                >
                  iSpeak Academy
                </div>
                <Text style={{ color: form.getFieldValue('secondaryColor') || '#D4A843' }} className="text-sm">
                  Invoice #ISP-2025-0001
                </Text>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span className="flex items-center gap-2">
          <BellOutlined /> Notifications
        </span>
      ),
      children: (
        <div>
          <div className="mb-2">
            <Title level={5} className="!mb-1">Notification Channels</Title>
            <Text type="secondary" className="text-xs">
              Control which communication channels are active for system notifications
            </Text>
          </div>
          <Divider className="!mt-2 !mb-4" />

          <div className="space-y-3 max-w-2xl">
            <NotificationToggle
              name="emailNotifications"
              label="Email Notifications"
              description="Transactional emails via Resend (invoices, enrollment confirmations, password resets)"
              icon={<MailOutlined />}
            />
            <NotificationToggle
              name="smsNotifications"
              label="SMS Notifications"
              description="Text messages via Africa's Talking (session reminders, payment alerts)"
              icon={<PhoneOutlined />}
            />
            <NotificationToggle
              name="whatsappNotifications"
              label="WhatsApp Notifications"
              description="WhatsApp messages via Africa's Talking (primary client communication)"
              icon={<GlobalOutlined />}
            />
            <NotificationToggle
              name="adminAlerts"
              label="Admin Alerts"
              description="Internal notifications for admins (new enrollments, overdue payments, errors)"
              icon={<BellOutlined />}
            />
          </div>

          <div className="mt-8 mb-2">
            <Title level={5} className="!mb-1">User Registration</Title>
            <Text type="secondary" className="text-xs">
              Control how new users can access the system
            </Text>
          </div>
          <Divider className="!mt-2 !mb-4" />

          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-lg">
              <div>
                <Text strong className="text-sm">Allow Public Signup</Text>
                <Text type="secondary" className="block text-xs">Allow new clients to register themselves via the portal</Text>
              </div>
              <Form.Item name="allowSignup" valuePropName="checked" className="!mb-0">
                <Switch />
              </Form.Item>
            </div>
            <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-lg">
              <div>
                <Text strong className="text-sm">Require Email Verification</Text>
                <Text type="secondary" className="block text-xs">New users must verify their email before accessing the portal</Text>
              </div>
              <Form.Item name="requireVerification" valuePropName="checked" className="!mb-0">
                <Switch />
              </Form.Item>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your organisation's system configuration"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Settings' }]}
        actions={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={updateSettings.isPending}
            size="large"
          >
            Save Changes
          </Button>
        }
      />

      <Card className="!rounded-lg">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Tabs
            items={tabItems}
            tabBarStyle={{ marginBottom: 24 }}
            size="large"
          />
        </Form>
      </Card>
    </>
  );
}
