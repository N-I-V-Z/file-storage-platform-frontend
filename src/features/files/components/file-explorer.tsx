"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { formatBytes } from "@/src/features/projects/usage-format";
import { useFiles } from "../hooks/use-files";
import { FolderNavigator } from "./folder-navigator";
import { UploadPanel } from "./upload-panel";
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
  const [params, setParams] = useState<FileListParams>(() =>
    fileListParamsSchema.parse({}),
  );
  const filesQuery = useFiles(userId, projectId, params);
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
    setParams((current) => ({
      ...current,
      page: 1,
      search: values.search.trim(),
      contentType:
        values.contentType === "all" ? undefined : values.contentType,
      sort: values.sort,
    }));
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
        onSelect={(folderId) =>
          setParams((current) => ({ ...current, folderId, page: 1 }))
        }
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
                  ▤
                </span>
                <div className="files-item-name">
                  <strong>{file.originalName}</strong>
                  <span>{file.contentType}</span>
                </div>
                <span className="files-item-size">
                  {formatBytes(BigInt(file.sizeBytes))}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

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
