'use client';

import ResetPasswordForm from '@/components/forms/ResetPasswordForm';
import { Button, Result } from 'antd';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Result
        status="error"
        title="Invalid Reset Link"
        subTitle="The password reset link is invalid or has expired. Please request a new password reset."
        extra={
          <div className="space-y-3">
            <Link href="/forgot-password">
              <Button type="primary" block>
                Request New Reset Link
              </Button>
            </Link>
            <Link href="/login">
              <Button block>Back to Sign In</Button>
            </Link>
          </div>
        }
      />
    );
  }

  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-md shadow-md p-6">
        <Suspense
          fallback={
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
