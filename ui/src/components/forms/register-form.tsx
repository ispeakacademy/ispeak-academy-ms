'use client';

import { authApi } from '@/lib/api/auth.api';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface Props {
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function RegisterForm({ onSuccess, isModal = false }: Props) {
  const [form] = Form.useForm<RegisterFormValues>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({
        lastName: values.lastName,
        firstName: values.firstName,
        email: values.email,
        password: values.password,
      });

      toast.success(response.message || 'Account created successfully!');

      if (isModal) {
        onSuccess?.();
      } else {
        router.push('/login?registered=true');
      }
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Failed to create account. Please try again.';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      className="mt-8"
      size="large"
    >
      <div className="flex gap-4 flex-col md:flex-row">
        <Form.Item
          name="firstName"
          label="First Name"
          className="flex-1"
          rules={[{ required: true, message: 'First name is required' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Enter your first name"
            autoComplete="given-name"
          />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last Name"
          className="flex-1"
          rules={[{ required: true, message: 'Last name is required' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Enter your last name"
            autoComplete="family-name"
          />
        </Form.Item>
      </div>

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

      <div className="flex gap-4 flex-col md:flex-row">
        <Form.Item
          name="password"
          label="Password"
          className="flex-1"
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Create a password"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          className="flex-1"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords don't match"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
        </Form.Item>
      </div>

      <Form.Item
        name="agreeToTerms"
        valuePropName="checked"
        rules={[
          {
            validator: (_, value) =>
              value
                ? Promise.resolve()
                : Promise.reject(new Error('You must agree to the terms and conditions')),
          },
        ]}
      >
        <Checkbox>
          I agree to the{' '}
          <Link href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy" target="_blank" className="text-blue-600 hover:text-blue-500">
            Privacy Policy
          </Link>
        </Checkbox>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isLoading} block>
          Create account
        </Button>
      </Form.Item>
    </Form>
  );
}
