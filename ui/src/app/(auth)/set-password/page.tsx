'use client';

import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/lib/api/user.api';
import { getRedirectPath } from '@/lib/utils/permissions';
import { useUserStore } from '@/stores/user.store';
import { LockOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface SetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export default function SetPasswordPage() {
  const [form] = Form.useForm<SetPasswordFormValues>();
  const { user, loading, isAuthenticated, fetchUserData } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // If user doesn't need to change password, redirect to appropriate page
  useEffect(() => {
    if (!loading && isAuthenticated && user && !user.mustChangePassword) {
      router.push(getRedirectPath(user));
    }
  }, [loading, isAuthenticated, user, router]);

  const onFinish = async (values: SetPasswordFormValues) => {
    setSubmitting(true);
    try {
      await userApi.setPassword(values.newPassword);
      toast.success('Password set successfully!');

      // Refresh user data so mustChangePassword is now false
      await fetchUserData();

      const currentUser = useUserStore.getState().user;
      router.push(getRedirectPath(currentUser));
    } catch (error) {
      console.error('Set password error:', error);
      let errorMessage = 'Failed to set password. Please try again.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-md shadow-md p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Set Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome to iSpeak Academy! Please set a new password to secure your account.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your new password"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your password' },
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
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm your new password"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
            >
              Set Password
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
