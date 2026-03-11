'use client';

import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { Badge, Button, Empty, List, Popover, Spin, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const { Text } = Typography;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notificationsData, isLoading } = useNotifications(1, 15);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const router = useRouter();

  const notifications = notificationsData?.data || [];

  const handleClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.notificationId);
    }
    if (notification.link) {
      router.push(notification.link);
      setOpen(false);
    }
  };

  const content = (
    <div className="w-80 max-h-96 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => markAllAsRead.mutate()}
            loading={markAllAsRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spin /></div>
        ) : notifications.length === 0 ? (
          <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-8" />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item: any) => (
              <List.Item
                className={`!px-3 !py-2 cursor-pointer hover:bg-gray-50 ${!item.isRead ? 'bg-blue-50/50' : ''}`}
                onClick={() => handleClick(item)}
              >
                <div className="w-full">
                  <div className="flex items-start justify-between gap-2">
                    <Text strong={!item.isRead} className="text-sm leading-tight">
                      {item.title}
                    </Text>
                    {!item.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    )}
                  </div>
                  <Text type="secondary" className="text-xs line-clamp-2 mt-0.5">
                    {item.message}
                  </Text>
                  <Text type="secondary" className="text-xs mt-1 block">
                    {timeAgo(item.createdAt)}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      overlayInnerStyle={{ padding: 0 }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          size="small"
          icon={<BellOutlined className="text-lg" />}
          className="flex items-center justify-center"
        />
      </Badge>
    </Popover>
  );
}
