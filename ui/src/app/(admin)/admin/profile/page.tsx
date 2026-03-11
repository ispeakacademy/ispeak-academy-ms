'use client';

import PageHeader from '@/components/admin/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { getMyEmployeeProfile, updateMyEmployeeProfile } from '@/lib/api/employees.api';
import { useChangeMyPassword, useUpdateMyProfile } from '@/hooks/usePortal';
import {
  EmployeeRoleLabels,
  EmployeeStatusLabels,
  EmployeeStatusColors,
  EmploymentTypeLabels,
} from '@/types/enums';
import type { Employee } from '@/types/employees';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Card, Checkbox, Col, Descriptions, Form, Input, Row, Spin, Tabs, Tag, TimePicker, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const { Text, Title } = Typography;
const { TextArea } = Input;

const ALL_DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export default function AdminProfilePage() {
  const { user, fetchUserData } = useAuth();
  const updateProfile = useUpdateMyProfile();
  const changePassword = useChangeMyPassword();
  const [profileForm] = Form.useForm();
  const [employeeForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [savingEmployee, setSavingEmployee] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, profileForm]);

  const fetchEmployee = async () => {
    try {
      const data = await getMyEmployeeProfile();
      setEmployee(data);
      if (data) {
        employeeForm.setFieldsValue({
          specialization: data.specialization || '',
          bio: data.bio || '',
          certifications: data.certifications?.join(', ') || '',
          availableDays: data.availableDays || [],
          availableHoursStart: data.availableHours?.start ? dayjs(data.availableHours.start, 'HH:mm') : null,
          availableHoursEnd: data.availableHours?.end ? dayjs(data.availableHours.end, 'HH:mm') : null,
        });
      }
    } catch {
      // User may not have a linked employee record
    } finally {
      setLoadingEmployee(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  const handleUpdateProfile = async (values: { firstName: string; lastName: string; phone?: string }) => {
    await updateProfile.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
    });
    fetchUserData();
  };

  const handleUpdateEmployee = async (values: any) => {
    setSavingEmployee(true);
    try {
      const certifications = values.certifications
        ? values.certifications.split(',').map((c: string) => c.trim()).filter(Boolean)
        : [];

      const availableHours = values.availableHoursStart && values.availableHoursEnd
        ? {
            start: values.availableHoursStart.format('HH:mm'),
            end: values.availableHoursEnd.format('HH:mm'),
          }
        : undefined;

      await updateMyEmployeeProfile({
        specialization: values.specialization || undefined,
        bio: values.bio || undefined,
        certifications,
        availableDays: values.availableDays || [],
        availableHours,
      });

      toast.success('Employee details updated');
      await fetchEmployee();
    } catch {
      toast.error('Failed to update employee details');
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleChangePassword = async (values: { currentPassword: string; newPassword: string }) => {
    await changePassword.mutateAsync(values);
    passwordForm.resetFields();
  };

  const tabItems = [
    {
      key: 'personal',
      label: 'Personal Information',
      children: (
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          className="max-w-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
              <Input prefix={<UserOutlined className="text-gray-400" />} />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
              <Input prefix={<UserOutlined className="text-gray-400" />} />
            </Form.Item>
          </div>
          <Form.Item name="email" label="Email">
            <Input prefix={<MailOutlined className="text-gray-400" />} disabled />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="+254712345678" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updateProfile.isPending}>
            Save Changes
          </Button>
        </Form>
      ),
    },
    ...(employee ? [{
      key: 'employee',
      label: 'Employee Details',
      children: loadingEmployee ? (
        <div className="flex justify-center py-8"><Spin /></div>
      ) : (
        <div>
          {/* Read-only info */}
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small" className="mb-6">
            <Descriptions.Item label="Role">
              <Tag color="blue">
                {EmployeeRoleLabels[employee.role] || employee.role}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge
                status={employee.status === 'active' ? 'success' : employee.status === 'on_leave' ? 'warning' : 'default'}
                text={EmployeeStatusLabels[employee.status] || employee.status}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Employment Type">
              {EmploymentTypeLabels[employee.employmentType] || employee.employmentType}
            </Descriptions.Item>
            <Descriptions.Item label="Start Date">
              {employee.startDate ? (
                <span><CalendarOutlined className="mr-1" />{new Date(employee.startDate).toLocaleDateString()}</span>
              ) : (
                <Text type="secondary">Not set</Text>
              )}
            </Descriptions.Item>
            {employee.hourlyRate != null && (
              <Descriptions.Item label="Hourly Rate">
                {`${employee.rateCurrency || 'KES'} ${Number(employee.hourlyRate).toLocaleString()}`}
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Editable fields */}
          <Title level={5} className="!mb-4">Update Your Details</Title>
          <Form
            form={employeeForm}
            layout="vertical"
            onFinish={handleUpdateEmployee}
            className="max-w-xl"
          >
            <Form.Item name="specialization" label="Specialization">
              <Input placeholder="e.g., Public Speaking, Leadership" />
            </Form.Item>

            <Form.Item name="bio" label="Bio">
              <TextArea rows={4} placeholder="Tell us about yourself..." />
            </Form.Item>

            <Form.Item
              name="certifications"
              label="Certifications"
              extra="Separate multiple certifications with commas"
            >
              <Input placeholder="e.g., TESOL, Public Speaking Coach, NLP Practitioner" />
            </Form.Item>

            <Form.Item name="availableDays" label="Available Days">
              <Checkbox.Group>
                <Row gutter={[8, 8]}>
                  {ALL_DAYS.map((day) => (
                    <Col key={day.value} xs={12} sm={8} md={6}>
                      <Checkbox value={day.value}>{day.label}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Form.Item name="availableHoursStart" label="Available From">
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
              <Form.Item name="availableHoursEnd" label="Available Until">
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
            </div>

            <Button type="primary" htmlType="submit" loading={savingEmployee}>
              Save Employee Details
            </Button>
          </Form>
        </div>
      ),
    }] : []),
    {
      key: 'security',
      label: 'Change Password',
      children: (
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          className="max-w-lg"
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Required' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Required' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={changePassword.isPending}>
            Change Password
          </Button>
        </Form>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account settings"
      />

      <Card size="small" className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar size={72} icon={<UserOutlined />} className="bg-blue-600 flex-shrink-0" />
          <div>
            <Title level={4} className="!mb-0">
              {user?.firstName} {user?.lastName}
            </Title>
            <Text type="secondary">{user?.email}</Text>
            {user?.phone && (
              <Text type="secondary" className="block text-sm">
                <PhoneOutlined className="mr-1" />
                {user.phone}
              </Text>
            )}
            {employee && (
              <div className="mt-1">
                <Tag color="blue">{EmployeeRoleLabels[employee.role] || employee.role}</Tag>
                <Tag color={EmployeeStatusColors[employee.status] || 'default'}>
                  {EmployeeStatusLabels[employee.status] || employee.status}
                </Tag>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </>
  );
}
