import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/src/features/auth/components/public-header";
import { PublicHeroActions } from "@/src/features/auth/components/public-hero-actions";

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
      <PublicHeader />
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
          <PublicHeroActions />
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
      <section className="landing-section" aria-labelledby="landing-flow-title">
        <div className="section-heading">
          <span className="eyebrow">BẮT ĐẦU TRONG BA BƯỚC</span>
          <h2 id="landing-flow-title">Một nơi rõ ràng cho từng tệp.</h2>
          <p>
            Từ project đầu tiên đến lúc tích hợp ứng dụng, bạn luôn biết tệp
            đang ở đâu và ai được truy cập.
          </p>
        </div>
        <div className="landing-steps">
          <article>
            <span>01 / PROJECT</span>
            <h3>Tạo không gian riêng</h3>
            <p>
              Nhóm tệp theo project và theo dõi dung lượng sử dụng trong cùng
              một workspace.
            </p>
          </article>
          <article>
            <span>02 / FILES</span>
            <h3>Tải lên và sắp xếp</h3>
            <p>
              Đưa tệp vào thư mục, tìm kiếm, xem trước và khôi phục từ thùng rác
              khi cần.
            </p>
          </article>
          <article>
            <span>03 / ACCESS</span>
            <h3>Cấp quyền có chủ đích</h3>
            <p>
              Tạo API key theo phạm vi truy cập để ứng dụng tải lên hoặc đọc tệp
              của project.
            </p>
          </article>
        </div>
      </section>
      <section
        className="landing-integration"
        aria-labelledby="integration-title"
      >
        <div>
          <span className="eyebrow">DÀNH CHO NHÀ PHÁT TRIỂN</span>
          <h2 id="integration-title">
            Đi từ giao diện đến API khi bạn sẵn sàng.
          </h2>
          <p>
            Tệp được giữ riêng tư; API key giới hạn theo project và quyền. Xem
            hướng dẫn để bắt đầu bằng giao diện hoặc tích hợp luồng upload.
          </p>
          <Link className="button button-primary" href="/docs">
            Đọc hướng dẫn <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="integration-card" aria-label="Ví dụ tích hợp">
          <div>
            <span>UPLOAD / API</span>
            <span>PRIVATE</span>
          </div>
          <code>Authorization: ApiKey &lt;your-key&gt;</code>
          <code>POST /api/v1/projects/:id/files</code>
          <p>
            Tải lên theo luồng. Không đưa khóa vào URL hoặc mã client công khai.
          </p>
        </div>
      </section>
      <footer className="site-footer">
        <span>FILE STORAGE PLATFORM</span>
        <span>Lưu trữ có cấu trúc. Truy cập có kiểm soát.</span>
      </footer>
    </main>
  );
}
