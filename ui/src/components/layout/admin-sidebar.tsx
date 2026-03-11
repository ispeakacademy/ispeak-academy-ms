"use client";

import NotificationBell from "@/components/NotificationBell";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/utils/permissions";
import { useUserStore } from "@/stores/user.store";
import {
  BarChartOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileTextOutlined,
  IdcardOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { Button, Menu } from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

interface MenuItemDef {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  requiredPermission?: { resource: string; action: string };
}

const allMenuItems: MenuItemDef[] = [
  {
    key: "/admin",
    icon: <DashboardOutlined />,
    label: <Link href="/admin">Dashboard</Link>,
    requiredPermission: { resource: "dashboard", action: "read" },
  },
  {
    key: "/admin/clients",
    icon: <TeamOutlined />,
    label: <Link href="/admin/clients">Clients</Link>,
    requiredPermission: { resource: "clients", action: "read" },
  },
  {
    key: "/admin/programs",
    icon: <SolutionOutlined />,
    label: <Link href="/admin/programs">Programs</Link>,
    requiredPermission: { resource: "programs", action: "read" },
  },
  {
    key: "/admin/enrollments",
    icon: <FileTextOutlined />,
    label: <Link href="/admin/enrollments">Enrollments</Link>,
    requiredPermission: { resource: "enrollments", action: "read" },
  },
  {
    key: "/admin/communication",
    icon: <MessageOutlined />,
    label: <Link href="/admin/communication">Communication</Link>,
    requiredPermission: { resource: "communications", action: "read" },
  },
  {
    key: "/admin/invoices",
    icon: <DollarOutlined />,
    label: <Link href="/admin/invoices">Invoices</Link>,
    requiredPermission: { resource: "invoices", action: "read" },
  },
  {
    key: "/admin/revenue",
    icon: <BarChartOutlined />,
    label: <Link href="/admin/revenue">Revenue</Link>,
    requiredPermission: { resource: "reports", action: "read" },
  },
  {
    key: "/admin/employees",
    icon: <UserOutlined />,
    label: <Link href="/admin/employees">Employees</Link>,
    requiredPermission: { resource: "employees", action: "read" },
  },
  {
    key: "/admin/partners",
    icon: <UsergroupAddOutlined />,
    label: <Link href="/admin/partners">Partners</Link>,
    requiredPermission: { resource: "partners", action: "read" },
  },
  {
    key: "/admin/settings",
    icon: <SettingOutlined />,
    label: <Link href="/admin/settings">Settings</Link>,
    requiredPermission: { resource: "settings", action: "read" },
  },
  {
    key: "/admin/settings/permissions",
    icon: <LockOutlined />,
    label: <Link href="/admin/settings/permissions">Roles & Permissions</Link>,
    requiredPermission: { resource: "settings", action: "update" },
  },
  {
    key: "/admin/profile",
    icon: <IdcardOutlined />,
    label: <Link href="/admin/profile">My Profile</Link>,
  },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  const user = useUserStore((state) => state.user);
  useNotificationSocket();

  const menuItems: MenuProps["items"] = useMemo(() => {
    return allMenuItems
      .filter((item) =>
        !item.requiredPermission ||
        hasPermission(user, item.requiredPermission.resource, item.requiredPermission.action)
      )
      .map(({ requiredPermission, ...item }) => item);
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  const selectedKey = useMemo(() => {
    // Sort by key length descending so longer (more specific) paths match first
    const sorted = [...(menuItems || [])].sort(
      (a, b) => (b?.key as string).length - (a?.key as string).length,
    );
    const match = sorted.find((item) => {
      const key = item?.key as string;
      if (key === "/admin") return pathname === "/admin";
      return pathname.startsWith(key);
    });
    return (match?.key as string) || "/admin";
  }, [menuItems, pathname]);

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
              <p className="text-xs text-gray-500">Business Management</p>
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
              <Link
                href="/admin/profile"
                className="flex items-center min-w-0 hover:opacity-80 transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-8 h-8 bg-blue-600 shrink-0 rounded-full flex items-center justify-center">
                  <UserOutlined className="text-white text-sm" />
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </Link>
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
