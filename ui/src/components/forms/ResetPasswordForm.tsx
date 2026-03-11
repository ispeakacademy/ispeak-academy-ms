'use client';

import { authApi } from '@/lib/api/auth.api';
import { LockOutlined } from '@ant-design/icons';
import { Button, Form, Input, Result } from 'antd';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'react-toastify';

interface ResetPasswordValues {
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [form] = Form.useForm<ResetPasswordValues>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onFinish = async (values: ResetPasswordValues) => {
    setIsLoading(true);
    try {
      const result = await authApi.resetPassword({
        token,
        newPassword: values.newPassword,
      });

      setIsSubmitted(true);
      toast.success(result.message || 'Password reset successfully!');
    } catch (error) {
      console.error('Reset password error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message || 'Failed to reset password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Result
        status="success"
        title="Password reset successful!"
        subTitle="Your password has been successfully reset. You can now sign in with your new password."
        extra={
          <Link href="/login">
            <Button type="primary" block>
              Continue to sign in
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
        <p className="text-gray-600">Please enter your new password below.</p>
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
            { required: true, message: 'Password is required' },
            { min: 8, message: 'Password must be at least 8 characters' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
              message:
                'Must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            },
          ]}
          extra="Must contain at least 8 characters with uppercase, lowercase, number, and special character."
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Enter your new password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm New Password"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords don't match"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm your new password"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Reset password
          </Button>
        </Form.Item>

        <div className="text-center">
          <Link href="/login">
            <Button type="link">Back to sign in</Button>
          </Link>
        </div>
      </Form>
    </div>
  );
}
