"use client";

import { useState } from "react";
import { useAuditEvents } from "../hooks/use-audit-events";
import type { AuditEvent } from "../schemas/audit.schemas";

const actionLabels: Record<AuditEvent["action"], string> = {
  PROJECT_CREATED: "Tạo project",
  PROJECT_RENAMED: "Đổi tên project",
  PROJECT_DELETED: "Xóa project",
  API_KEY_ISSUED: "Cấp API key",
  API_KEY_REVOKED: "Thu hồi API key",
  FILE_UPLOADED: "Tải tệp lên",
  FILE_TRASHED: "Chuyển tệp vào thùng rác",
  FILE_RESTORED: "Khôi phục tệp",
  FILE_PURGE_REQUESTED: "Yêu cầu xóa vĩnh viễn",
  FILE_PURGED: "Đã xóa vĩnh viễn",
};

function actorLabel(event: AuditEvent): string {
  if (event.actorType === "SYSTEM") return "Hệ thống";
  const kind = event.actorType === "API_KEY" ? "API key" : "Tài khoản";
  return event.actorId ? `${kind} ${event.actorId.slice(0, 8)}` : kind;
}

export function AuditPanel({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) {
  const [page, setPage] = useState(1);
  const audit = useAuditEvents(userId, projectId, page);
  const pageSize = audit.data?.pageSize ?? 10;
  const totalPages = Math.max(
    1,
    Math.ceil((audit.data?.total ?? 0) / pageSize),
  );

  return (
    <section className="audit-section" aria-labelledby="audit-heading">
      <div className="audit-heading">
        <div>
          <span className="eyebrow">DẤU VẾT</span>
          <h3 id="audit-heading">Lịch sử hoạt động</h3>
        </div>
        <button
          type="button"
          className="text-action"
          onClick={() => void audit.refetch()}
          disabled={audit.isFetching}
        >
          Làm mới
        </button>
      </div>
      <p className="audit-intro">
        Thay đổi project, API key và tệp được ghi theo thời gian.
      </p>
      {audit.isPending ? (
        <p className="audit-message" role="status">
          Đang tải lịch sử...
        </p>
      ) : null}
      {audit.isError ? (
        <div className="audit-message">
          <p role="alert">Không thể tải lịch sử hoạt động.</p>
          <button
            type="button"
            className="text-action"
            onClick={() => void audit.refetch()}
          >
            Thử lại
          </button>
        </div>
      ) : null}
      {audit.data?.total === 0 ? (
        <p className="audit-message">Chưa có hoạt động nào.</p>
      ) : null}
      {audit.data && audit.data.items.length > 0 ? (
        <>
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th scope="col">Thời điểm</th>
                  <th scope="col">Hoạt động</th>
                  <th scope="col">Thực hiện bởi</th>
                  <th scope="col">Tài nguyên</th>
                </tr>
              </thead>
              <tbody>
                {audit.data.items.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <time dateTime={event.occurredAt}>
                        {new Intl.DateTimeFormat("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(event.occurredAt))}
                      </time>
                    </td>
                    <td>{actionLabels[event.action]}</td>
                    <td>{actorLabel(event)}</td>
                    <td
                      className="audit-resource"
                      title={event.resourceId ?? undefined}
                    >
                      {event.resourceId ? event.resourceId.slice(0, 8) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="audit-pagination">
            <span>
              Trang {page}/{totalPages} · {audit.data.total} hoạt động
            </span>
            <div>
              <button
                type="button"
                className="text-action"
                disabled={page === 1 || audit.isFetching}
                onClick={() => setPage((current) => current - 1)}
              >
                Trước
              </button>
              <button
                type="button"
                className="text-action"
                disabled={page >= totalPages || audit.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
