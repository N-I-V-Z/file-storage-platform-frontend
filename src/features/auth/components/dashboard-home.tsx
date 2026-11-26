"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { ProjectWorkspace } from "@/src/features/projects/components/project-workspace";

export function DashboardHome() {
  const router = useRouter();
  const { user, pending, logout } = useAuth();
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!pending && !user) router.replace("/login");
  }, [pending, user, router]);

  if (pending || !user)
    return (
      <main className="dashboard-loading" role="status">
        Đang kiểm tra phiên đăng nhập...
      </main>
    );

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    setError("");
    try {
      await logout();
      router.replace("/login");
    } catch {
      setError("Không thể đăng xuất lúc này. Vui lòng thử lại.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-symbol">F</span>
          <span>
            file<span className="brand-muted">stack</span>
          </span>
        </Link>
        <div className="dashboard-header-actions">
          <nav className="dashboard-nav" aria-label="Dashboard">
            <a href="#projects">Projects</a>
            <a href="#account">Tài khoản</a>
            {user.role === "ADMIN" ? <Link href="/admin">Quản trị</Link> : null}
          </nav>
          <button
            type="button"
            className="button button-outline"
            onClick={handleLogout}
            disabled={signingOut}
            aria-busy={signingOut}
          >
            {signingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      </header>
      <div className="dashboard-content">
        <span className="eyebrow">WORKSPACE / TỔNG QUAN</span>
        <h1>Chào mừng trở lại.</h1>
        <p>Quản lý project, dung lượng lưu trữ và quyền truy cập tại đây.</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <ProjectWorkspace key={user.id} userId={user.id} />
        <section
          id="account"
          className="account-panel"
          aria-labelledby="account-heading"
        >
          <div>
            <span className="eyebrow">PHIÊN ĐĂNG NHẬP</span>
            <h2 id="account-heading">Tài khoản</h2>
          </div>
          <p>{user.email}</p>
        </section>
      </div>
    </main>
  );
}
