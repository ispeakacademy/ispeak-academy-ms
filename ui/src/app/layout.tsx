import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from '@/components/providers';

import 'react-toastify/dist/ReactToastify.css';
import "./globals.css";
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "iSpeak Academy - Business Management System",
  description: "iSpeak Academy BMS - Manage programs, enrollments, clients, communications, invoicing, and more. Built for iSpeak Academy by Mcdorcis Solutions.",
  keywords: "iSpeak Academy, business management, enrollment management, program management, communication hub",
  authors: [{ name: "Mcdorcis Solutions" }],
  creator: "Mcdorcis Solutions",
  publisher: "iSpeak Academy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://bms.ispeakacademy.org"),
  openGraph: {
    title: "iSpeak Academy - Business Management System",
    description: "Comprehensive business management system for iSpeak Academy.",
    url: "https://bms.ispeakacademy.org",
    siteName: "iSpeak Academy BMS",
    locale: "en_KE",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('light', inter.variable)} suppressContentEditableWarning suppressHydrationWarning>
      <body
        suppressContentEditableWarning
        suppressHydrationWarning
        className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
