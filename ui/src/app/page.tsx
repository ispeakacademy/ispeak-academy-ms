"use client";

import { getRedirectPath } from "@/lib/utils/permissions";
import { useUserStore } from "@/stores/user.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (token && user) {
      router.replace(getRedirectPath(user));
    } else if (!token) {
      router.replace("/login");
    }
  }, [router, user]);

  return null;
}
