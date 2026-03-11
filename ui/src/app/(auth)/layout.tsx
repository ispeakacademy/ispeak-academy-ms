import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: 'iSpeak Academy - Business Management System',
    template: '%s | iSpeak Academy BMS'
  },
  description: 'iSpeak Academy Business Management System - Manage programs, enrollments, communications, and more.',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>{children}</main>
    </div>
  );
}
