"use client";

import { ArrowLeftOutlined, HomeOutlined } from "@ant-design/icons";
import { Button, Result } from "antd";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Result
        status="404"
        title="404"
        subTitle="The page you're looking for doesn't exist."
        extra={
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            <Link href="/admin">
              <Button type="primary" icon={<HomeOutlined />}>
                Home
              </Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
