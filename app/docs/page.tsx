import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/src/features/auth/components/public-header";
import { PublicStartLink } from "@/src/features/auth/components/public-start-link";
import { readEnvironment } from "@/src/lib/env";

const title = "Hướng dẫn sử dụng | File Storage Platform";
const description =
  "Tạo project, tải tệp lên, quản lý API key và tích hợp API lưu trữ riêng tư với File Storage Platform.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/docs" },
  openGraph: {
    title,
    description,
    url: "/docs",
    siteName: "File Storage Platform",
    locale: "vi_VN",
    type: "article",
    images: ["/og"],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og"] },
};

export default function DocsPage() {
  const apiBaseUrl = readEnvironment(process.env).publicApiBaseUrl;

  return (
    <main className="site-shell">
      <PublicHeader />
      <div className="docs-layout">
        <aside className="docs-nav" aria-label="Mục lục hướng dẫn">
          <span className="eyebrow">HƯỚNG DẪN</span>
          <a href="#start">Bắt đầu</a>
          <a href="#organize">Quản lý tệp</a>
          <a href="#api">Tích hợp API</a>
          <a href="#security">Quyền truy cập</a>
          <a href="#sharing">Chia sẻ tệp</a>
        </aside>
        <article className="docs-content">
          <div className="docs-intro">
            <span className="eyebrow">FILE STORAGE PLATFORM / DOCS</span>
            <h1>Lưu trữ có cấu trúc. Bắt đầu dễ dàng.</h1>
            <p>
              Làm quen với workspace, sau đó kết nối ứng dụng của bạn qua API.
              Tất cả tệp đều riêng tư và thuộc về một project.
            </p>
            <PublicStartLink label="Bắt đầu sử dụng" />
          </div>
          <section id="start">
            <span className="docs-step">01 / WORKSPACE</span>
            <h2>Tạo project đầu tiên</h2>
            <p>
              <Link href="/register">Tạo tài khoản</Link> hoặc đăng nhập, mở
              dashboard rồi chọn <strong>Tạo project</strong>. Mỗi project có
              danh sách tệp, dung lượng, API key và lịch sử hoạt động riêng.
            </p>
            <p>
              Chọn project trong thanh bên để xem và quản lý dữ liệu của project
              đó. Dung lượng mặc định là 10 GiB/project; giới hạn có thể thay
              đổi theo cấu hình máy chủ.
            </p>
          </section>
          <section id="organize">
            <span className="docs-step">02 / FILES</span>
            <h2>Tải lên, tìm kiếm và khôi phục</h2>
            <p>
              Trong tab <strong>Tệp</strong>, chọn hoặc kéo thả tệp để tải lên.
              Có thể tạo thư mục, lọc theo loại tệp và tìm theo tên. Mỗi tệp mặc
              định giới hạn 512 MiB theo cấu hình máy chủ.
            </p>
            <p>
              Tệp đã xóa nằm trong tab <strong>Thùng rác</strong> tối đa 30
              ngày. Bạn có thể khôi phục trước khi hết hạn hoặc xóa vĩnh viễn;
              tệp trong thùng rác vẫn tính vào dung lượng project.
            </p>
          </section>
          <section id="api">
            <span className="docs-step">03 / API</span>
            <h2>Kết nối ứng dụng của bạn</h2>
            <p>
              Trong tab <strong>API key</strong>, tạo khóa với phạm vi{" "}
              <code>files:write</code> để tải lên hoặc <code>files:read</code>{" "}
              để tải xuống. Sao chép khóa ngay khi tạo; hệ thống chỉ hiển thị
              giá trị này một lần.
            </p>
            <div className="docs-code">
              <span>Ví dụ tải lên một tệp</span>
              <pre>
                <code>{`curl -X POST "${apiBaseUrl}/projects/<project-id>/files" \\
  -H "Authorization: ApiKey <your-key>" \\
  -F "file=@./example.pdf"`}</code>
              </pre>
            </div>
            <p>
              Để tải xuống, gọi{" "}
              <code>
                GET /api/v1/projects/:projectId/files/:fileId/download
              </code>{" "}
              với khóa có quyền <code>files:read</code>. Phản hồi là luồng tệp;
              ứng dụng có thể gửi HTTP Range khi phát video.
            </p>
          </section>
          <section id="security">
            <span className="docs-step">04 / ACCESS</span>
            <h2>Giữ quyền truy cập trong tầm kiểm soát</h2>
            <p>
              Chỉ lưu API key ở phía server hoặc secret manager, không đưa vào
              URL, repository hay JavaScript công khai. Chọn ít quyền nhất cần
              thiết và thu hồi khóa trong dashboard khi không còn dùng.
            </p>
            <p>
              Tệp được quét trước khi sẵn sàng tải xuống. Bạn có thể xem dung
              lượng trong tab <strong>Dung lượng</strong> và kiểm tra thao tác
              gần đây trong tab <strong>Hoạt động</strong>.
            </p>
          </section>
          <section id="sharing">
            <span className="docs-step">05 / SHARE</span>
            <h2>Gửi tệp bằng link có thời hạn</h2>
            <p>
              Trong tab <strong>Tệp</strong>, chọn <strong>Chia sẻ</strong> ở
              tệp đã quét và sẵn sàng. Chọn thời hạn 1 giờ, 24 giờ hoặc 7 ngày,
              rồi tạo và sao chép link ngay. Link chỉ hiển thị một lần.
            </p>
            <p>
              Người nhận mở link để tải tệp mà không cần đăng nhập. Bạn có thể
              thu hồi link trong danh sách chia sẻ; chuyển tệp vào thùng rác
              cũng thu hồi mọi link của tệp đó.
            </p>
          </section>
          <div className="docs-end">
            <span>Cần bắt đầu ngay?</span>
            <PublicStartLink label="Bắt đầu sử dụng" />
          </div>
        </article>
      </div>
    </main>
  );
}
