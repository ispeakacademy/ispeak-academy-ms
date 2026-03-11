"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useUserStore } from "@/stores/user.store";
import NotificationBell from "@/components/NotificationBell";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import {
  CalendarOutlined,
  DashboardOutlined,
  DollarOutlined,
  FormOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  ShareAltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Menu } from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems: MenuProps["items"] = [
  {
    key: "/portal",
    icon: <DashboardOutlined />,
    label: <Link href="/portal">Dashboard</Link>,
  },
  {
    key: "/portal/programs",
    icon: <ReadOutlined />,
    label: <Link href="/portal/programs">My Programs</Link>,
  },
  {
    key: "/portal/sessions",
    icon: <CalendarOutlined />,
    label: <Link href="/portal/sessions">Sessions</Link>,
  },
  {
    key: "/portal/assignments",
    icon: <FormOutlined />,
    label: <Link href="/portal/assignments">Assignments</Link>,
  },
  {
    key: "/portal/invoices",
    icon: <DollarOutlined />,
    label: <Link href="/portal/invoices">Invoices</Link>,
  },
  {
    key: "/portal/certificates",
    icon: <SafetyCertificateOutlined />,
    label: <Link href="/portal/certificates">Certificates</Link>,
  },
  {
    key: "/portal/referrals",
    icon: <ShareAltOutlined />,
    label: <Link href="/portal/referrals">Referrals</Link>,
  },
  {
    key: "/portal/profile",
    icon: <UserOutlined />,
    label: <Link href="/portal/profile">Profile</Link>,
  },
];

export default function UserSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  const user = useUserStore((state) => state.user);
  useNotificationSocket();

  const handleLogout = async () => {
    await logout();
  };

  const selectedKey = menuItems?.find((item) => {
    const key = item?.key as string;
    if (key === "/portal") return pathname === "/portal";
    return pathname.startsWith(key);
  })?.key as string || "/portal";

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          type="default"
          size="small"
          icon={isMobileMenuOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="shadow-md"
        />
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:inset-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
              <span className="text-white font-bold text-sm">iS</span>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">iSpeak Academy</h1>
              <p className="text-xs text-gray-500">Client Portal</p>
            </div>
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-2">
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              style={{ border: 'none' }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center min-w-0">
                <div className="w-8 h-8 bg-blue-600 shrink-0 rounded-full flex items-center justify-center">
                  <UserOutlined className="text-white text-sm" />
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                type="text"
                size="small"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 shrink-0"
                title="Logout"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
