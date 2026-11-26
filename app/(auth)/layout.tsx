import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-layout">
      <div className="auth-side">
        <Link className="brand brand-light" href="/">
          <span className="brand-symbol">F</span>
          <span>
            file<span className="brand-muted">stack</span>
          </span>
        </Link>
        <div className="auth-side-copy">
          <span className="eyebrow">MỘT WORKSPACE, MỌI PROJECT</span>
          <h2>Mọi tệp tin, một nơi để bắt đầu.</h2>
          <p>
            Một không gian lưu trữ có cấu trúc, được thiết kế để bạn kiểm soát
            từng quyền truy cập.
          </p>
        </div>
        <div className="auth-side-footer">
          FILE STORAGE PLATFORM <span>© 2026</span>
        </div>
      </div>
      <div className="auth-main">{children}</div>
    </main>
  );
}
