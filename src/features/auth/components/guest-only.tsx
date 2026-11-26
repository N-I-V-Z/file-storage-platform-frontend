"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../hooks/use-auth";

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, pending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!pending && user) router.replace("/dashboard");
  }, [pending, user, router]);

  if (pending || user) {
    return (
      <p className="auth-checking" role="status">
        Đang kiểm tra phiên đăng nhập...
      </p>
    );
  }

  return children;
}
