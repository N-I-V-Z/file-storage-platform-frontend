"use client";

import Link from "next/link";
import { useAuth } from "../hooks/use-auth";

export function PublicHeader() {
  const { user, pending } = useAuth();

  return (
    <header className="site-header">
      <Link
        className="brand"
        href="/"
        aria-label="File Storage Platform, trang chủ"
      >
        <span className="brand-symbol">F</span>
        <span>
          file<span className="brand-muted">stack</span>
        </span>
      </Link>
      <nav aria-label="Điều hướng chính" className="header-actions">
        <Link className="text-link" href="/docs">
          Hướng dẫn
        </Link>
        {!pending &&
          (user ? (
            <Link className="button button-small" href="/dashboard">
              Vào dashboard
            </Link>
          ) : (
            <>
              <Link className="text-link guest-login-link" href="/login">
                Đăng nhập
              </Link>
              <Link className="button button-small" href="/register">
                Bắt đầu
              </Link>
            </>
          ))}
      </nav>
    </header>
  );
}
