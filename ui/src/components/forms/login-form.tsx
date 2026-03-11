'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getRedirectPath } from '@/lib/utils/permissions';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface Props {
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function LoginForm({ onSuccess, isModal = false }: Props) {
  const [form] = Form.useForm<LoginFormValues>();
  const { user: currentUser, login, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const result = await login(values.email, values.password, !isModal);

      if (result.success) {
        toast.success('Login successful! Redirecting...');
        onSuccess?.();
      } else {
        toast.error(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      router.replace(getRedirectPath(currentUser));
    }
  }, [currentUser, router]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      className="mt-8"
      initialValues={{ rememberMe: false }}
      size="large"
    >
      <Form.Item
        name="email"
        label="Email address"
        rules={[
          { required: true, message: 'Please enter your email' },
          { type: 'email', message: 'Please enter a valid email address' },
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="Enter your email"
          autoComplete="email"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[
          { required: true, message: 'Please enter your password' },
          { min: 6, message: 'Password must be at least 6 characters' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </Form.Item>

      <Form.Item>
        <div className="flex items-center justify-between">
          <Form.Item name="rememberMe" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            Forgot your password?
          </Link>
        </div>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting || loading}
          block
        >
          Sign in
        </Button>
      </Form.Item>
    </Form>
  );
}
