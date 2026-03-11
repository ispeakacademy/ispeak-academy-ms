'use client';

import PageHeader from '@/components/admin/PageHeader';
import { useAllRoles, usePermissions, useUpdateRolePermissions } from '@/hooks/usePermissions';
import type { Permission, Role } from '@/types/permissions';
import { CheckOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Skeleton, Tag, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

const { Text, Title } = Typography;

const RESOURCE_LABELS: Record<string, string> = {
  users: 'Users',
  clients: 'Clients',
  organisations: 'Organisations',
  programs: 'Programs',
  cohorts: 'Cohorts',
  enrollments: 'Enrollments',
  invoices: 'Invoices',
  payments: 'Payments',
  communications: 'Communications',
  templates: 'Templates',
  settings: 'Settings',
  reports: 'Reports',
  dashboard: 'Dashboard',
  employees: 'Employees',
  partners: 'Partners',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export',
  send: 'Send',
  void: 'Void',
};

export default function PermissionsPage() {
  const { data: roles, isLoading: loadingRoles } = useAllRoles();
  const { data: permissions, isLoading: loadingPermissions } = usePermissions();
  const updateRolePermissions = useUpdateRolePermissions();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  const selectedRole = useMemo(
    () => roles?.find((r) => r.roleId === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const isSuperAdmin = selectedRole?.name === 'super_admin';

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    if (!permissions) return {};
    const groups: Record<string, Permission[]> = {};
    for (const perm of permissions) {
      if (!groups[perm.resource]) groups[perm.resource] = [];
      groups[perm.resource].push(perm);
    }
    // Sort actions within each group
    for (const resource of Object.keys(groups)) {
      groups[resource].sort((a, b) => a.action.localeCompare(b.action));
    }
    return groups;
  }, [permissions]);

  const sortedResources = useMemo(
    () => Object.keys(groupedPermissions).sort((a, b) =>
      (RESOURCE_LABELS[a] || a).localeCompare(RESOURCE_LABELS[b] || b),
    ),
    [groupedPermissions],
  );

  // When selecting a role, populate selected permissions
  useEffect(() => {
    if (selectedRole) {
      setSelectedPermissionIds(new Set(selectedRole.permissions.map((p) => p.permissionId)));
      setIsDirty(false);
    }
  }, [selectedRole]);

  // Auto-select first role when roles load
  useEffect(() => {
    if (roles?.length && !selectedRoleId) {
      setSelectedRoleId(roles[0].roleId);
    }
  }, [roles, selectedRoleId]);

  const togglePermission = useCallback((permissionId: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
    setIsDirty(true);
  }, []);

  const toggleResourceAll = useCallback((resource: string, checked: boolean) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      const perms = groupedPermissions[resource] || [];
      for (const p of perms) {
        if (checked) {
          next.add(p.permissionId);
        } else {
          next.delete(p.permissionId);
        }
      }
      return next;
    });
    setIsDirty(true);
  }, [groupedPermissions]);

  const isResourceAllSelected = useCallback(
    (resource: string) => {
      const perms = groupedPermissions[resource] || [];
      return perms.length > 0 && perms.every((p) => selectedPermissionIds.has(p.permissionId));
    },
    [groupedPermissions, selectedPermissionIds],
  );

  const isResourcePartial = useCallback(
    (resource: string) => {
      const perms = groupedPermissions[resource] || [];
      const selected = perms.filter((p) => selectedPermissionIds.has(p.permissionId));
      return selected.length > 0 && selected.length < perms.length;
    },
    [groupedPermissions, selectedPermissionIds],
  );

  const handleSave = async () => {
    if (!selectedRoleId) return;
    await updateRolePermissions.mutateAsync({
      roleId: selectedRoleId,
      permissionIds: Array.from(selectedPermissionIds),
    });
    setIsDirty(false);
  };

  const handleReset = () => {
    if (selectedRole) {
      setSelectedPermissionIds(new Set(selectedRole.permissions.map((p) => p.permissionId)));
      setIsDirty(false);
    }
  };

  if (loadingRoles || loadingPermissions) {
    return (
      <div>
        <PageHeader
          title="Roles & Permissions"
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Settings', href: '/admin/settings' },
            { label: 'Roles & Permissions' },
          ]}
        />
        <Card><Skeleton active paragraph={{ rows: 12 }} /></Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage what each role can access in the system"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Roles & Permissions' },
        ]}
        actions={
          selectedRoleId && !isSuperAdmin ? (
            <div className="flex gap-2">
              <Button onClick={handleReset} disabled={!isDirty}>
                Reset
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleSave}
                loading={updateRolePermissions.isPending}
                disabled={!isDirty}
              >
                Save Changes
              </Button>
            </div>
          ) : null
        }
      />

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left panel: Role list */}
        <div className="lg:w-64 flex-shrink-0">
          <Card size="small" title="Roles" className="sticky top-4">
            <div className="space-y-1">
              {roles?.map((role) => (
                <div
                  key={role.roleId}
                  onClick={() => setSelectedRoleId(role.roleId)}
                  className={`
                    px-3 py-2 rounded-md cursor-pointer transition-colors flex items-center justify-between
                    ${selectedRoleId === role.roleId
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                    }
                  `}
                >
                  <div>
                    <Text strong={selectedRoleId === role.roleId} className="text-sm capitalize block">
                      {role.name.replace(/_/g, ' ')}
                    </Text>
                    {role.description && (
                      <Text type="secondary" className="text-xs block truncate" style={{ maxWidth: 160 }}>
                        {role.description}
                      </Text>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {role.isSystemRole && (
                      <LockOutlined className="text-gray-400 text-xs" title="System role" />
                    )}
                    <Tag className="!text-xs !px-1 !m-0">{role.permissions.length}</Tag>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right panel: Permissions grid */}
        <div className="flex-1 min-w-0">
          {selectedRole ? (
            <Card
              size="small"
              title={
                <div className="flex items-center gap-2">
                  <SafetyCertificateOutlined />
                  <span className="capitalize">{selectedRole.name.replace(/_/g, ' ')}</span>
                  {isSuperAdmin && (
                    <Tag color="gold">Read-only — Full access</Tag>
                  )}
                </div>
              }
            >
              {isSuperAdmin ? (
                <div className="text-center py-8">
                  <LockOutlined className="text-4xl text-gray-300 mb-3" />
                  <Title level={5} type="secondary">Super Admin has all permissions</Title>
                  <Text type="secondary">This role cannot be modified. It always has full access to every resource.</Text>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedResources.map((resource) => {
                    const perms = groupedPermissions[resource];
                    const allSelected = isResourceAllSelected(resource);
                    const partial = isResourcePartial(resource);

                    return (
                      <div key={resource} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox
                            checked={allSelected}
                            indeterminate={partial}
                            onChange={(e) => toggleResourceAll(resource, e.target.checked)}
                          />
                          <Text strong className="text-sm">
                            {RESOURCE_LABELS[resource] || resource}
                          </Text>
                          <Text type="secondary" className="text-xs">
                            ({perms.filter((p) => selectedPermissionIds.has(p.permissionId)).length}/{perms.length})
                          </Text>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 ml-6">
                          {perms.map((perm) => (
                            <Checkbox
                              key={perm.permissionId}
                              checked={selectedPermissionIds.has(perm.permissionId)}
                              onChange={() => togglePermission(perm.permissionId)}
                            >
                              <span className="text-sm">{ACTION_LABELS[perm.action] || perm.action}</span>
                            </Checkbox>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ) : (
            <Card size="small">
              <div className="text-center py-12">
                <SafetyCertificateOutlined className="text-4xl text-gray-300 mb-3" />
                <Title level={5} type="secondary">Select a role</Title>
                <Text type="secondary">Choose a role from the left panel to view and edit its permissions.</Text>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
