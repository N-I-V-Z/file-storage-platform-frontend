"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";

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
        <button
          type="button"
          className="button button-outline"
          onClick={handleLogout}
          disabled={signingOut}
          aria-busy={signingOut}
        >
          {signingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </header>
      <div className="dashboard-content">
        <span className="eyebrow">WORKSPACE / TỔNG QUAN</span>
        <h1>Chào mừng trở lại.</h1>
        <p>
          Bạn đang đăng nhập với <strong>{user.email}</strong>.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <section className="coming-soon" aria-labelledby="coming-title">
          <span className="coming-icon">▣</span>
          <div>
            <h2 id="coming-title">Không gian lưu trữ của bạn</h2>
            <p>Quản lý dự án và tệp sẽ có trong giai đoạn tiếp theo.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
