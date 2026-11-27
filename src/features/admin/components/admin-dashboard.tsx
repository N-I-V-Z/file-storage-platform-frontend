"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { RefreshIcon } from "@/src/components/ui/refresh-icon";
import { formatBytes } from "@/src/features/projects/usage-format";
import {
  useAdminAuditEvents,
  useAdminOverview,
  useAdminProjects,
} from "../hooks/use-admin-reports";
import type { AuditEvent } from "@/src/features/audit/schemas/audit.schemas";

const actionLabels: Record<AuditEvent["action"], string> = {
  PROJECT_CREATED: "Tạo project",
  PROJECT_RENAMED: "Đổi tên project",
  PROJECT_DELETED: "Xóa project",
  API_KEY_ISSUED: "Cấp API key",
  API_KEY_REVOKED: "Thu hồi API key",
  FILE_UPLOADED: "Tải tệp lên",
  FILE_TRASHED: "Chuyển vào thùng rác",
  FILE_RESTORED: "Khôi phục tệp",
  FILE_PURGE_REQUESTED: "Yêu cầu xóa vĩnh viễn",
  FILE_PURGED: "Đã xóa vĩnh viễn",
  SHARE_LINK_CREATED: "Tạo link chia sẻ",
  SHARE_LINK_REVOKED: "Thu hồi link chia sẻ",
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function reportError(retry: () => void) {
  return (
    <div className="admin-message">
      <p role="alert">Không thể tải báo cáo lúc này.</p>
      <button type="button" className="text-action" onClick={retry}>
        Thử lại
      </button>
    </div>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  pending,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  pending: boolean;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="audit-pagination">
      <span>
        Trang {page}/{pages} · {total} mục
      </span>
      <div>
        <button
          type="button"
          className="text-action"
          disabled={page <= 1 || pending}
          onClick={() => onPage(page - 1)}
        >
          Trước
        </button>
        <button
          type="button"
          className="text-action"
          disabled={page >= pages || pending}
          onClick={() => onPage(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}

function AdminReports({ userId }: { userId: string }) {
  const [projectPage, setProjectPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const overview = useAdminOverview(userId, true);
  const projects = useAdminProjects(userId, projectPage, true);
  const audit = useAdminAuditEvents(userId, auditPage, true);

  return (
    <>
      <section
        className="admin-section"
        aria-labelledby="admin-overview-heading"
      >
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">BÁO CÁO / TỔNG QUAN</span>
            <h2 id="admin-overview-heading">Toàn hệ thống</h2>
          </div>
          <button
            type="button"
            className="icon-action"
            aria-label="Làm mới tổng quan"
            title="Làm mới tổng quan"
            onClick={() => void overview.refetch()}
            disabled={overview.isFetching}
          >
            <RefreshIcon />
          </button>
        </div>
        {overview.isPending ? (
          <p role="status" className="admin-message">
            Đang tải tổng quan...
          </p>
        ) : null}
        {overview.isError ? reportError(() => void overview.refetch()) : null}
        {overview.data && !overview.isError ? (
          <div className="admin-metrics">
            <div>
              <span>Tài khoản</span>
              <strong>{overview.data.userCount.toLocaleString("vi-VN")}</strong>
            </div>
            <div>
              <span>Project</span>
              <strong>
                {overview.data.projectCount.toLocaleString("vi-VN")}
              </strong>
            </div>
            <div>
              <span>Tệp sẵn sàng</span>
              <strong>{overview.data.fileCount.toLocaleString("vi-VN")}</strong>
            </div>
            <div>
              <span>Đã sử dụng</span>
              <strong>{formatBytes(BigInt(overview.data.usedBytes))}</strong>
            </div>
            <div>
              <span>Đang giữ chỗ</span>
              <strong>
                {formatBytes(BigInt(overview.data.reservedBytes))}
              </strong>
            </div>
            <div>
              <span>Hạn mức cộng dồn</span>
              <strong>{formatBytes(BigInt(overview.data.quotaBytes))}</strong>
            </div>
          </div>
        ) : null}
      </section>

      <section
        className="admin-section"
        aria-labelledby="admin-projects-heading"
      >
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">BÁO CÁO / PROJECT</span>
            <h2 id="admin-projects-heading">Danh sách project</h2>
          </div>
          <button
            type="button"
            className="icon-action"
            aria-label="Làm mới projects"
            title="Làm mới projects"
            onClick={() => void projects.refetch()}
            disabled={projects.isFetching}
          >
            <RefreshIcon />
          </button>
        </div>
        {projects.isPending ? (
          <p role="status" className="admin-message">
            Đang tải project...
          </p>
        ) : null}
        {projects.isError ? reportError(() => void projects.refetch()) : null}
        {projects.data && !projects.isError ? (
          projects.data.total === 0 ? (
            <p className="admin-message">Chưa có project nào.</p>
          ) : (
            <>
              <div className="audit-table-wrap">
                <table className="audit-table admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Project</th>
                      <th scope="col">Chủ sở hữu</th>
                      <th scope="col">Đã dùng</th>
                      <th scope="col">Hạn mức</th>
                      <th scope="col">Tạo lúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.data.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                          <small>{item.id}</small>
                        </td>
                        <td className="audit-resource">{item.ownerId}</td>
                        <td>{formatBytes(BigInt(item.usedBytes))}</td>
                        <td>{formatBytes(BigInt(item.quotaBytes))}</td>
                        <td>
                          <time dateTime={item.createdAt}>
                            {dateLabel(item.createdAt)}
                          </time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={projectPage}
                total={projects.data.total}
                pageSize={projects.data.pageSize}
                pending={projects.isFetching}
                onPage={setProjectPage}
              />
            </>
          )
        ) : null}
      </section>

      <section className="admin-section" aria-labelledby="admin-audit-heading">
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">BÁO CÁO / NHẬT KÝ</span>
            <h2 id="admin-audit-heading">Hoạt động gần đây</h2>
          </div>
          <button
            type="button"
            className="icon-action"
            aria-label="Làm mới hoạt động"
            title="Làm mới hoạt động"
            onClick={() => void audit.refetch()}
            disabled={audit.isFetching}
          >
            <RefreshIcon />
          </button>
        </div>
        {audit.isPending ? (
          <p role="status" className="admin-message">
            Đang tải nhật ký...
          </p>
        ) : null}
        {audit.isError ? reportError(() => void audit.refetch()) : null}
        {audit.data && !audit.isError ? (
          audit.data.total === 0 ? (
            <p className="admin-message">Chưa có hoạt động nào.</p>
          ) : (
            <>
              <div className="audit-table-wrap">
                <table className="audit-table admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Thời điểm</th>
                      <th scope="col">Hoạt động</th>
                      <th scope="col">Project</th>
                      <th scope="col">Thực hiện bởi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.data.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <time dateTime={item.occurredAt}>
                            {dateLabel(item.occurredAt)}
                          </time>
                        </td>
                        <td>{actionLabels[item.action]}</td>
                        <td className="audit-resource">{item.projectId}</td>
                        <td className="audit-resource">
                          {item.actorType}
                          {item.actorId ? ` · ${item.actorId.slice(0, 8)}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={auditPage}
                total={audit.data.total}
                pageSize={audit.data.pageSize}
                pending={audit.isFetching}
                onPage={setAuditPage}
              />
            </>
          )
        ) : null}
      </section>
    </>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const { user, pending } = useAuth();

  useEffect(() => {
    if (!pending && !user) router.replace("/login");
  }, [pending, user, router]);

  if (pending || !user)
    return (
      <main className="dashboard-loading" role="status">
        Đang kiểm tra quyền truy cập...
      </main>
    );
  if (user.role !== "ADMIN")
    return (
      <main className="dashboard-error">
        <div className="dashboard-error-card">
          <h1>Không có quyền truy cập</h1>
          <p>Tài khoản này không có quyền xem báo cáo quản trị.</p>
          <Link className="button button-primary" href="/dashboard">
            Về workspace
          </Link>
        </div>
      </main>
    );

  return (
    <main className="dashboard-shell">
      <header className="site-header">
        <Link className="brand" href="/dashboard">
          <span className="brand-symbol">F</span>
          <span>
            file<span className="brand-muted">stack</span>
          </span>
        </Link>
        <Link className="text-link" href="/dashboard">
          Về workspace
        </Link>
      </header>
      <div className="dashboard-content admin-content">
        <span className="eyebrow">QUẢN TRỊ / BÁO CÁO</span>
        <h1>Tổng quan hệ thống.</h1>
        <p>Báo cáo chỉ đọc về dung lượng, project và hoạt động.</p>
        <AdminReports userId={user.id} />
      </div>
    </main>
  );
}
