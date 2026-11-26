import Link from "next/link";
import type { Metadata } from "next";

const homeTitle = "Lưu trữ tệp và kiểm soát truy cập | File Storage Platform";
const homeDescription =
  "Tổ chức tệp theo project, quản lý API key và theo dõi dung lượng trong một workspace lưu trữ dành cho nhà phát triển.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: "/",
    siteName: "File Storage Platform",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "File Storage Platform — Tệp của bạn. Quyền của bạn.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: ["/og"],
  },
};

export default function Home() {
  return (
    <main className="site-shell">
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
        <nav aria-label="Tài khoản" className="header-actions">
          <Link className="text-link" href="/login">
            Đăng nhập
          </Link>
          <Link className="button button-small" href="/register">
            Bắt đầu
          </Link>
        </nav>
      </header>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" /> KHÔNG GIAN LƯU TRỮ CHO NHÀ PHÁT
            TRIỂN
          </span>
          <h1 id="hero-title">
            Tệp của bạn.
            <br />
            <span>Quyền của bạn.</span>
          </h1>
          <p>
            Tổ chức tệp theo project, kiểm soát khóa truy cập và theo dõi dung
            lượng trong một workspace rõ ràng.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/register">
              Tạo tài khoản <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button button-outline" href="/login">
              Đăng nhập
            </Link>
          </div>
        </div>
        <div className="hero-diagram" aria-hidden="true">
          <div className="diagram-top">
            <span>PROJECT / FILE INDEX</span>
            <span>PRIVATE</span>
          </div>
          <div className="diagram-line">
            <span className="folder-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 6.5h6l2 2h10v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>workspace</span>
            <span>01</span>
          </div>
          <div className="diagram-line nested">
            <span>╰─</span>
            <span>documents</span>
            <span>12 tệp</span>
          </div>
          <div className="diagram-line nested">
            <span>╰─</span>
            <span>media</span>
            <span>08 tệp</span>
          </div>
          <div className="diagram-card">
            <span>QUYỀN TRUY CẬP THEO PROJECT</span>
            <strong>
              Quyền truy cập
              <br />
              thuộc về bạn.
            </strong>
            <span className="diagram-arrow">↗</span>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <span>FILE STORAGE PLATFORM</span>
        <span>Lưu trữ có cấu trúc. Truy cập có kiểm soát.</span>
      </footer>
    </main>
  );
}
