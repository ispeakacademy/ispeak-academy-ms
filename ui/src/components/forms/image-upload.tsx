"use client";

import { uploadImage } from '@/lib/api/upload.api';
import { DeleteOutlined, InboxOutlined, LinkOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Input, Space } from 'antd';
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';

interface ImageUploadProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  accept?: string;
  maxSize?: number;
}

export function ImageUpload({
  value,
  onChange,
  label,
  description,
  placeholder = "https://example.com/image.jpg",
  accept = "image/*",
  maxSize = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerChange = (val: string) => {
    onChange?.(val);
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size should be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadImage(file);

      if (response && response.url) {
        triggerChange(response.fullUrl);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeImage = () => {
    triggerChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasImage = !!value && value.length > 0;

  return (
    <div className="space-y-3 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900">{label}</div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Space>
          <Button
            type={inputMode === 'upload' ? 'primary' : 'default'}
            size="small"
            icon={<UploadOutlined />}
            onClick={() => setInputMode('upload')}
          >
            Upload
          </Button>
          <Button
            type={inputMode === 'url' ? 'primary' : 'default'}
            size="small"
            icon={<LinkOutlined />}
            onClick={() => setInputMode('url')}
          >
            URL
          </Button>
        </Space>
      </div>

      {inputMode === 'upload' ? (
        <div className="space-y-3">
          {hasImage ? (
            <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="relative w-full max-w-xs mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt="Uploaded image"
                  className="max-h-40 w-auto mx-auto rounded object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex justify-center mt-3">
                <Button
                  type="primary"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={removeImage}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <InboxOutlined className="text-3xl text-blue-500 animate-pulse" />
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <InboxOutlined className="text-3xl text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Drop an image here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum file size: {maxSize}MB
                  </p>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            type="url"
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => triggerChange(e.target.value)}
          />
          {hasImage && (
            <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="relative w-full max-w-xs mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt="Image preview"
                  className="max-h-40 w-auto mx-auto rounded object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex justify-center mt-3">
                <Button
                  type="primary"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={removeImage}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
