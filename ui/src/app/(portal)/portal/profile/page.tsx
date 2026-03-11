'use client';

import PageHeader from '@/components/admin/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useChangeMyPassword, useUpdateMyProfile } from '@/hooks/usePortal';
import {
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Card, Divider, Form, Input, Tabs, Typography } from 'antd';
import { useEffect } from 'react';

const { Text, Title } = Typography;

export default function ProfilePage() {
  const { user, fetchUserData } = useAuth();
  const updateProfile = useUpdateMyProfile();
  const changePassword = useChangeMyPassword();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, profileForm]);

  const handleUpdateProfile = async (values: { firstName: string; lastName: string; phone?: string }) => {
    await updateProfile.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
    });
    fetchUserData();
  };

  const handleChangePassword = async (values: { currentPassword: string; newPassword: string }) => {
    await changePassword.mutateAsync(values);
    passwordForm.resetFields();
  };

  const tabItems = [
    {
      key: 'personal',
      label: 'Personal Information',
      children: (
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          className="max-w-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
              <Input prefix={<UserOutlined className="text-gray-400" />} />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
              <Input prefix={<UserOutlined className="text-gray-400" />} />
            </Form.Item>
          </div>
          <Form.Item name="email" label="Email">
            <Input prefix={<MailOutlined className="text-gray-400" />} disabled />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="+254712345678" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updateProfile.isPending}>
            Save Changes
          </Button>
        </Form>
      ),
    },
    {
      key: 'security',
      label: 'Change Password',
      children: (
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          className="max-w-lg"
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Required' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Required' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={changePassword.isPending}>
            Change Password
          </Button>
        </Form>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account settings"
      />

      {/* Profile Header */}
      <Card size="small" className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar size={72} icon={<UserOutlined />} className="bg-blue-600 flex-shrink-0" />
          <div>
            <Title level={4} className="!mb-0">
              {user?.firstName} {user?.lastName}
            </Title>
            <Text type="secondary">{user?.email}</Text>
            {user?.phone && (
              <Text type="secondary" className="block text-sm">
                <PhoneOutlined className="mr-1" />
                {user.phone}
              </Text>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </>
  );
}
