import Link from "next/link";

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
            <span className="status-dot" /> LƯU TRỮ TỆP CHO ĐỘI NGŨ XÂY DỰNG
          </span>
          <h1 id="hero-title">
            Dữ liệu của bạn.
            <br />
            <span>Trong tầm kiểm soát.</span>
          </h1>
          <p>
            Quản lý tệp và quyền truy cập trên hạ tầng riêng. Một nền tảng rõ
            ràng cho sản phẩm cần lưu trữ đáng tin cậy.
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
            <span>STORAGE / WORKSPACE</span>
            <span>● LIVE</span>
          </div>
          <div className="diagram-line">
            <span className="folder-icon">▣</span>
            <span>workspace</span>
            <span>01</span>
          </div>
          <div className="diagram-line nested">
            <span>╰─</span>
            <span>documents</span>
            <span>12 files</span>
          </div>
          <div className="diagram-line nested">
            <span>╰─</span>
            <span>media</span>
            <span>08 files</span>
          </div>
          <div className="diagram-card">
            <span>PRIVATE BY DEFAULT</span>
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
        <span>Built for control. Ready to grow.</span>
      </footer>
    </main>
  );
}
