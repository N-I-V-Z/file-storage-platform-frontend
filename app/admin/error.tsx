"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="dashboard-error">
      <div className="dashboard-error-card">
        <h1>Không thể mở báo cáo</h1>
        <p>Đã xảy ra lỗi khi tải trang. Vui lòng thử lại.</p>
        <button type="button" className="button button-primary" onClick={reset}>
          Thử lại
        </button>
      </div>
    </main>
  );
}
