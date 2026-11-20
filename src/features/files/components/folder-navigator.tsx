"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/src/lib/http/api-client";
import { createFolder, deleteFolder, renameFolder } from "../api/folders.api";
import { folderKeys } from "../api/folders.keys";
import { useFolders } from "../hooks/use-folders";
import {
  folderFormSchema,
  type FolderFormValues,
} from "../schemas/folders.schemas";

type FolderSelection = string | undefined;

export function FolderNavigator({
  userId,
  projectId,
  selectedId,
  onSelect,
}: {
  userId: string;
  projectId: string;
  selectedId: FolderSelection;
  onSelect: (id: FolderSelection) => void;
}) {
  const queryClient = useQueryClient();
  const foldersQuery = useFolders(userId, projectId);
  const [mode, setMode] = useState<"create" | "rename" | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FolderFormValues>({
    resolver: zodResolver(folderFormSchema),
    defaultValues: { name: "" },
  });
  const saveMutation = useMutation({
    mutationFn: (values: FolderFormValues) =>
      mode === "rename" && targetId
        ? renameFolder(projectId, targetId, values)
        : createFolder(projectId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: folderKeys.list(userId, projectId),
      });
      setMode(null);
      setTargetId(null);
      reset();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (folderId: string) => deleteFolder(projectId, folderId),
    onSuccess: async (_, folderId) => {
      if (selectedId === folderId) onSelect("root");
      setConfirmId(null);
      await queryClient.invalidateQueries({
        queryKey: folderKeys.list(userId, projectId),
      });
    },
  });

  function start(mode: "create" | "rename", id?: string, name = "") {
    setActionError("");
    setConfirmId(null);
    setMode(mode);
    setTargetId(id ?? null);
    reset({ name });
  }

  async function save(values: FolderFormValues) {
    setActionError("");
    try {
      await saveMutation.mutateAsync(values);
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Không thể lưu folder. Vui lòng thử lại.",
      );
    }
  }

  async function remove(id: string) {
    setActionError("");
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      setActionError(
        error instanceof ApiError && error.status === 409
          ? "Folder còn tệp nên chưa thể xóa."
          : error instanceof ApiError
            ? error.message
            : "Không thể xóa folder. Vui lòng thử lại.",
      );
    }
  }

  return (
    <div className="folders-block">
      <div className="folders-heading">
        <h4>Folder</h4>
        <button
          type="button"
          className="text-action"
          onClick={() => start("create")}
        >
          + Tạo folder
        </button>
      </div>
      <nav aria-label="Lọc theo folder" className="folders-nav">
        <button
          type="button"
          aria-current={selectedId === undefined ? "page" : undefined}
          onClick={() => onSelect(undefined)}
        >
          Tất cả
        </button>
        <button
          type="button"
          aria-current={selectedId === "root" ? "page" : undefined}
          onClick={() => onSelect("root")}
        >
          Chưa phân loại
        </button>
        {foldersQuery.data?.map((folder) => (
          <span className="folder-entry" key={folder.id}>
            <button
              type="button"
              aria-current={selectedId === folder.id ? "page" : undefined}
              onClick={() => onSelect(folder.id)}
            >
              {folder.name}
            </button>
            <button
              type="button"
              className="folder-action"
              aria-label={`Đổi tên ${folder.name}`}
              onClick={() => start("rename", folder.id, folder.name)}
            >
              Đổi tên
            </button>
            <button
              type="button"
              className="folder-action"
              aria-label={`Xóa ${folder.name}`}
              onClick={() => {
                setMode(null);
                setActionError("");
                setConfirmId(folder.id);
              }}
            >
              Xóa
            </button>
          </span>
        ))}
      </nav>
      {foldersQuery.isPending ? <p role="status">Đang tải folder...</p> : null}
      {foldersQuery.isError ? (
        <p role="alert">
          Không thể tải folder.{" "}
          <button
            type="button"
            className="text-action"
            onClick={() => void foldersQuery.refetch()}
          >
            Thử lại
          </button>
        </p>
      ) : null}
      {mode ? (
        <form className="folder-form" noValidate onSubmit={handleSubmit(save)}>
          <label htmlFor="folder-name">
            {mode === "create" ? "Tên folder mới" : "Tên folder"}
          </label>
          <input
            id="folder-name"
            autoFocus
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "folder-name-error" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p id="folder-name-error" role="alert" className="field-error">
              {errors.name.message}
            </p>
          ) : null}
          <button
            type="submit"
            className="button button-primary"
            disabled={saveMutation.isPending}
          >
            Lưu folder
          </button>
          <button
            type="button"
            className="button button-outline"
            onClick={() => {
              setMode(null);
              setActionError("");
            }}
          >
            Hủy
          </button>
        </form>
      ) : null}
      {confirmId ? (
        <div className="folder-confirm">
          <p>
            Xóa folder “
            {foldersQuery.data?.find((folder) => folder.id === confirmId)?.name}
            ”? Chỉ folder trống mới xóa được.
          </p>
          <button
            type="button"
            className="button button-outline"
            onClick={() => setConfirmId(null)}
          >
            Hủy xóa
          </button>
          <button
            type="button"
            className="button button-primary"
            disabled={deleteMutation.isPending}
            onClick={() => void remove(confirmId)}
          >
            Xác nhận xóa
          </button>
        </div>
      ) : null}
      {actionError ? (
        <p role="alert" className="form-error">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}
