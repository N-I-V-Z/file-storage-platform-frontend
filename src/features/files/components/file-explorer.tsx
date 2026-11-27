"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ApiError } from "@/src/lib/http/api-client";
import { StorageIcon } from "@/src/components/ui/storage-icon";
import { formatBytes } from "@/src/features/projects/usage-format";
import { projectKeys } from "@/src/features/projects/api/projects.keys";
import { moveToTrash } from "../api/trash.api";
import { trashKeys } from "../api/trash.keys";
import { useFiles } from "../hooks/use-files";
import { FolderNavigator } from "./folder-navigator";
import { UploadPanel } from "./upload-panel";
import { FilePreview } from "./file-preview";
import { canPreview, saveDownload } from "../api/download.api";
import type { StoredFile } from "../schemas/files.schemas";
import { SharePanel } from "@/src/features/share-links/components/share-panel";
import {
  explorerFiltersSchema,
  fileListParamsSchema,
  type ExplorerFilters,
  type FileListParams,
} from "../schemas/files.schemas";

const CONTENT_TYPES = [
  ["all", "Tất cả loại"],
  ["image/png", "PNG"],
  ["image/jpeg", "JPEG"],
  ["image/webp", "WebP"],
  ["application/pdf", "PDF"],
  ["video/mp4", "MP4"],
  ["application/zip", "ZIP"],
] as const;

const SORT_OPTIONS = [
  ["newest", "Mới nhất"],
  ["oldest", "Cũ nhất"],
  ["name-asc", "Tên A–Z"],
  ["name-desc", "Tên Z–A"],
  ["size-asc", "Nhỏ nhất"],
  ["size-desc", "Lớn nhất"],
] as const;

export function FileExplorer({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const [confirmTrashId, setConfirmTrashId] = useState<string | null>(null);
  const [trashError, setTrashError] = useState("");
  const [params, setParams] = useState<FileListParams>(() =>
    fileListParamsSchema.parse({}),
  );
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [shareFile, setShareFile] = useState<StoredFile | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const filesQuery = useFiles(userId, projectId, params);
  const trashMutation = useMutation({
    mutationFn: (fileId: string) => moveToTrash(projectId, fileId),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExplorerFilters>({
    resolver: zodResolver(explorerFiltersSchema),
    defaultValues: { search: "", contentType: "all", sort: "newest" },
  });
  const page = filesQuery.data;
  const totalPages = page
    ? Math.max(1, Math.ceil(page.total / params.pageSize))
    : 1;

  function applyFilters(values: ExplorerFilters) {
    setPreviewFile(null);
    setShareFile(null);
    setParams((current) => ({
      ...current,
      page: 1,
      search: values.search.trim(),
      contentType:
        values.contentType === "all" ? undefined : values.contentType,
      sort: values.sort,
    }));
  }

  async function download(file: StoredFile) {
    const controller = new AbortController();
    setDownloadError("");
    setDownloadingId(file.id);
    try {
      await saveDownload(projectId, file, controller.signal);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setDownloadError(
          error instanceof Error ? error.message : "Không thể tải tệp.",
        );
      }
    } finally {
      setDownloadingId(null);
    }
  }

  async function trash(fileId: string) {
    setTrashError("");
    try {
      await trashMutation.mutateAsync(fileId);
      setConfirmTrashId(null);
      setPreviewFile(null);
      setShareFile(null);
      if (
        params.page > 1 &&
        page &&
        page.total <= (params.page - 1) * params.pageSize + 1
      ) {
        setParams((current) => ({ ...current, page: current.page - 1 }));
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["files", "list", userId, projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: trashKeys.project(userId, projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: projectKeys.usage(userId, projectId),
        }),
      ]);
    } catch (error) {
      setTrashError(
        error instanceof ApiError
          ? error.message
          : "Không thể chuyển tệp vào thùng rác. Vui lòng thử lại.",
      );
    }
  }

  return (
    <section className="files-section" aria-labelledby="files-heading">
      <div className="files-heading">
        <div>
          <span className="eyebrow">THƯ VIỆN PROJECT</span>
          <h3 id="files-heading">Tệp của bạn</h3>
        </div>
        {page ? <span className="files-count">{page.total} tệp</span> : null}
      </div>

      <FolderNavigator
        userId={userId}
        projectId={projectId}
        selectedId={params.folderId}
        onSelect={(folderId) => {
          setPreviewFile(null);
          setShareFile(null);
          setParams((current) => ({ ...current, folderId, page: 1 }));
        }}
      />

      <UploadPanel
        userId={userId}
        projectId={projectId}
        folderId={params.folderId}
      />

      <form
        className="files-filters"
        noValidate
        onSubmit={handleSubmit(applyFilters)}
      >
        <div className="files-filter-field files-search">
          <label htmlFor="file-search">Tìm tệp</label>
          <input
            id="file-search"
            type="search"
            placeholder="Tên tệp"
            aria-invalid={Boolean(errors.search)}
            aria-describedby={errors.search ? "file-search-error" : undefined}
            {...register("search")}
          />
          {errors.search ? (
            <p id="file-search-error" role="alert" className="field-error">
              {errors.search.message}
            </p>
          ) : null}
        </div>
        <div className="files-filter-field">
          <label htmlFor="file-type">Loại tệp</label>
          <select id="file-type" {...register("contentType")}>
            {CONTENT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="files-filter-field">
          <label htmlFor="file-sort">Sắp xếp</label>
          <select id="file-sort" {...register("sort")}>
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="button button-outline files-apply">
          Áp dụng
        </button>
      </form>

      <div className="files-results" aria-busy={filesQuery.isPending}>
        {filesQuery.isPending ? (
          <p className="files-message" role="status">
            Đang tải tệp...
          </p>
        ) : null}
        {filesQuery.isError ? (
          <div className="files-message">
            <p role="alert">Không thể tải tệp.</p>
            <button
              type="button"
              className="text-action"
              onClick={() => void filesQuery.refetch()}
            >
              Thử tải tệp
            </button>
          </div>
        ) : null}
        {page && page.items.length === 0 ? (
          <p className="files-message">
            {params.search || params.contentType
              ? "Không tìm thấy tệp phù hợp."
              : "Chưa có tệp nào"}
          </p>
        ) : null}
        {page && page.items.length > 0 ? (
          <ul className="files-list">
            {page.items.map((file) => (
              <li key={file.id} className="files-item">
                <span className="files-icon" aria-hidden="true">
                  <StorageIcon kind="file" />
                </span>
                <div className="files-item-name">
                  <strong>{file.originalName}</strong>
                  <span>{file.contentType}</span>
                </div>
                <span className="files-item-size">
                  {formatBytes(BigInt(file.sizeBytes))}
                </span>
                <div className="files-item-actions">
                  {canPreview(file) ? (
                    <button
                      type="button"
                      className="text-action"
                      aria-label={`Xem ${file.originalName}`}
                      onClick={() => setPreviewFile(file)}
                    >
                      Xem
                    </button>
                  ) : null}
                  {file.contentType === "video/mp4" && !canPreview(file) ? (
                    <span className="files-preview-note">
                      Xem trước tối đa 64 MiB
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="text-action"
                    aria-label={`Chia sẻ ${file.originalName}`}
                    aria-expanded={shareFile?.id === file.id}
                    onClick={() =>
                      setShareFile((current) =>
                        current?.id === file.id ? null : file,
                      )
                    }
                  >
                    Chia sẻ
                  </button>
                  <button
                    type="button"
                    className="text-action"
                    aria-label={`Tải ${file.originalName}`}
                    disabled={downloadingId === file.id}
                    onClick={() => void download(file)}
                  >
                    Tải xuống
                  </button>
                  <button
                    type="button"
                    className="text-action"
                    aria-label={`Chuyển ${file.originalName} vào thùng rác`}
                    aria-expanded={confirmTrashId === file.id}
                    disabled={trashMutation.isPending}
                    onClick={() => {
                      setTrashError("");
                      setConfirmTrashId(file.id);
                    }}
                  >
                    Bỏ vào thùng rác
                  </button>
                </div>
                {confirmTrashId === file.id ? (
                  <div className="files-inline-confirm">
                    <p>
                      Chuyển {file.originalName} vào thùng rác? Tệp vẫn tính vào
                      dung lượng và sẽ bị xóa vĩnh viễn sau 30 ngày.
                    </p>
                    <button
                      type="button"
                      className="button button-outline"
                      disabled={trashMutation.isPending}
                      onClick={() => {
                        setConfirmTrashId(null);
                        setTrashError("");
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="button button-danger"
                      disabled={trashMutation.isPending}
                      onClick={() => void trash(file.id)}
                    >
                      Chuyển vào thùng rác
                    </button>
                    {trashError ? (
                      <p role="alert" className="form-error">
                        {trashError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {downloadError ? (
        <p role="alert" className="form-error">
          {downloadError}
        </p>
      ) : null}
      {previewFile ? (
        <FilePreview
          key={previewFile.id}
          projectId={projectId}
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      ) : null}
      {shareFile ? (
        <SharePanel
          key={shareFile.id}
          userId={userId}
          projectId={projectId}
          file={shareFile}
          onClose={() => setShareFile(null)}
        />
      ) : null}

      {page && page.total > params.pageSize ? (
        <div className="files-pagination" aria-label="Phân trang tệp">
          <span>
            Trang {params.page} / {totalPages}
          </span>
          <div>
            <button
              type="button"
              className="button button-outline"
              disabled={params.page <= 1}
              onClick={() =>
                setParams((current) => ({ ...current, page: current.page - 1 }))
              }
            >
              Trang trước
            </button>
            <button
              type="button"
              className="button button-outline"
              disabled={params.page >= totalPages}
              onClick={() =>
                setParams((current) => ({ ...current, page: current.page + 1 }))
              }
            >
              Trang sau
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
