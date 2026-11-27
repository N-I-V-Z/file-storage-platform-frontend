"use client";

import Link from "next/link";
import { useAuth } from "../hooks/use-auth";

export function PublicHeroActions() {
  const { user, pending } = useAuth();

  return (
    <div className="hero-actions">
      {pending ? (
        <Link className="button button-outline" href="/docs">
          Xem hướng dẫn
        </Link>
      ) : (
        <>
          {user ? (
            <Link className="button button-primary" href="/dashboard">
              Vào dashboard <span aria-hidden="true">↗</span>
            </Link>
          ) : (
            <Link className="button button-primary" href="/register">
              Tạo tài khoản <span aria-hidden="true">↗</span>
            </Link>
          )}
          <Link
            className="button button-outline"
            href={user ? "/docs" : "/login"}
          >
            {user ? "Xem hướng dẫn" : "Đăng nhập"}
          </Link>
        </>
      )}
    </div>
  );
}
