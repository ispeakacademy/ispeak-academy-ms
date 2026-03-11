'use client';

import { authApi } from '@/lib/api/auth.api';
import { MailOutlined } from '@ant-design/icons';
import { Button, Form, Input, Result } from 'antd';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'react-toastify';

interface ForgotPasswordValues {
  email: string;
}

export default function ForgotPasswordForm() {
  const [form] = Form.useForm<ForgotPasswordValues>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onFinish = async (values: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      const result = await authApi.forgotPassword(values);
      setIsSubmitted(true);
      toast.success(result.message || 'Password reset link sent successfully!');
    } catch (error) {
      console.error('Forgot password error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message || 'Failed to send reset link. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Result
        status="success"
        title="Check your email"
        subTitle="We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password."
        extra={[
          <Button
            key="retry"
            onClick={() => {
              setIsSubmitted(false);
              form.resetFields();
            }}
          >
            Try again
          </Button>,
          <Link key="login" href="/login">
            <Button type="link">Back to sign in</Button>
          </Link>,
        ]}
      />
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
        >
          &larr; Back to sign in
        </Link>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
          name="email"
          label="Email address"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
          help="We'll send you a link to reset your password."
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Enter your email address"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Send reset link
          </Button>
        </Form.Item>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </Form>
    </>
  );
}
