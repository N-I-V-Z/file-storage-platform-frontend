"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatBytes } from "@/src/features/projects/usage-format";
import { projectKeys } from "@/src/features/projects/api/projects.keys";
import { ApiError } from "@/src/lib/http/api-client";
import { StorageIcon } from "@/src/components/ui/storage-icon";
import { listTrash, purgeTrash, restoreTrash } from "../api/trash.api";
import { trashKeys } from "../api/trash.keys";

export function TrashPanel({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const params = { page, pageSize: 20, search: "", sort: "newest" as const };
  const trashQuery = useQuery({
    queryKey: trashKeys.list(userId, projectId, params),
    queryFn: () => listTrash(projectId, params),
  });
  const restoreMutation = useMutation({
    mutationFn: (fileId: string) => restoreTrash(projectId, fileId),
  });
  const purgeMutation = useMutation({
    mutationFn: (fileId: string) => purgeTrash(projectId, fileId),
  });
  const busy = restoreMutation.isPending || purgeMutation.isPending;

  async function refresh() {
    setConfirmId(null);
    const total = trashQuery.data?.total ?? 0;
    if (page > 1 && total <= (page - 1) * params.pageSize + 1)
      setPage(page - 1);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: trashKeys.project(userId, projectId),
      }),
      queryClient.invalidateQueries({
        queryKey: ["files", "list", userId, projectId],
      }),
      queryClient.invalidateQueries({
        queryKey: projectKeys.usage(userId, projectId),
      }),
    ]);
  }

  async function action(fileId: string, kind: "restore" | "purge") {
    setActionError("");
    try {
      if (kind === "restore") await restoreMutation.mutateAsync(fileId);
      else await purgeMutation.mutateAsync(fileId);
      await refresh();
    } catch (error) {
      if (
        kind === "purge" &&
        error instanceof ApiError &&
        error.status === 503
      ) {
        await refresh();
        setActionError(
          "Đã nhận yêu cầu xóa. Hệ thống sẽ tự thử lại; dung lượng được cập nhật sau khi xóa xong.",
        );
        return;
      }
      if (
        kind === "restore" &&
        error instanceof ApiError &&
        error.status === 409
      ) {
        setActionError("Tệp đã quá hạn khôi phục. Bạn có thể xóa vĩnh viễn.");
      } else {
        setActionError(
          error instanceof ApiError
            ? error.message
            : kind === "purge"
              ? "Không thể xóa vĩnh viễn. Vui lòng thử lại."
              : "Không thể khôi phục tệp. Vui lòng thử lại.",
        );
      }
    }
  }

  return (
    <section
      className="files-section trash-section"
      aria-labelledby="trash-heading"
    >
      <div className="files-heading">
        <div>
          <span className="eyebrow">LƯU GIỮ 30 NGÀY</span>
          <h3 id="trash-heading">Thùng rác</h3>
        </div>
        {trashQuery.data ? (
          <span className="files-count">{trashQuery.data.total} tệp</span>
        ) : null}
      </div>
      <p className="trash-intro">
        Tệp trong thùng rác vẫn tính vào dung lượng project cho đến khi bị xóa
        vĩnh viễn.
      </p>
      <div className="files-results" aria-busy={trashQuery.isPending}>
        {trashQuery.isPending ? (
          <p className="files-message" role="status">
            Đang tải thùng rác...
          </p>
        ) : null}
        {trashQuery.isError ? (
          <div className="files-message">
            <p role="alert">Không thể tải thùng rác.</p>
            <button
              type="button"
              className="text-action"
              onClick={() => void trashQuery.refetch()}
            >
              Thử lại
            </button>
          </div>
        ) : null}
        {trashQuery.data?.items.length === 0 ? (
          <p className="files-message">Thùng rác trống</p>
        ) : null}
        {trashQuery.data?.items.length ? (
          <ul className="files-list">
            {trashQuery.data.items.map((file) => (
              <li key={file.id} className="files-item">
                <span className="files-icon" aria-hidden="true">
                  <StorageIcon kind="file" />
                </span>
                <div className="files-item-name">
                  <strong>{file.originalName}</strong>
                  <span>
                    {file.contentType} · Xóa sau{" "}
                    {new Intl.DateTimeFormat("vi-VN", {
                      timeZone: "Asia/Ho_Chi_Minh",
                    }).format(new Date(file.purgeAfter))}
                  </span>
                </div>
                <span className="files-item-size">
                  {formatBytes(BigInt(file.sizeBytes))}
                </span>
                <div className="files-item-actions">
                  <button
                    type="button"
                    className="text-action"
                    aria-label={`Khôi phục ${file.originalName}`}
                    disabled={busy}
                    onClick={() => void action(file.id, "restore")}
                  >
                    Khôi phục
                  </button>
                  <button
                    type="button"
                    className="text-action"
                    disabled={busy}
                    aria-label={`Xóa vĩnh viễn ${file.originalName}`}
                    aria-expanded={confirmId === file.id}
                    onClick={() => {
                      setActionError("");
                      setConfirmId(file.id);
                    }}
                  >
                    Xóa vĩnh viễn
                  </button>
                </div>
                {confirmId === file.id ? (
                  <div className="files-inline-confirm">
                    <p>
                      Xóa vĩnh viễn {file.originalName}? Bạn sẽ không thể khôi
                      phục tệp này.
                    </p>
                    <button
                      type="button"
                      className="button button-outline"
                      disabled={busy}
                      onClick={() => {
                        setConfirmId(null);
                        setActionError("");
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="button button-danger"
                      disabled={busy}
                      onClick={() => void action(file.id, "purge")}
                    >
                      Xóa vĩnh viễn
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {actionError ? (
        <p role="alert" className="form-error">
          {actionError}
        </p>
      ) : null}
      {trashQuery.data && trashQuery.data.total > params.pageSize ? (
        <div className="files-pagination" aria-label="Phân trang thùng rác">
          <span>
            Trang {page} / {Math.ceil(trashQuery.data.total / params.pageSize)}
          </span>
          <div>
            <button
              type="button"
              className="button button-outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Trang trước
            </button>
            <button
              type="button"
              className="button button-outline"
              disabled={page * params.pageSize >= trashQuery.data.total}
              onClick={() => setPage(page + 1)}
            >
              Trang sau
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
