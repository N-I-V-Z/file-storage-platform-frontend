"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { projectKeys } from "@/src/features/projects/api/projects.keys";
import { ApiError } from "@/src/lib/http/api-client";
import { uploadFile, validateLocalFile } from "../api/upload.api";

type UploadTask = {
  id: number;
  file: File;
  progress: number;
  state: "queued" | "uploading" | "ready" | "failed" | "cancelled";
  message?: string;
};
type PendingUpload = Pick<UploadTask, "id" | "file"> & { folderId?: string };
const MAX_ACTIVE_UPLOADS = 2;

function errorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError")
    return "Đã hủy tải lên.";
  if (error instanceof ApiError && error.status === 413)
    return "Tệp hoặc project vượt hạn mức dung lượng.";
  if (error instanceof ApiError && error.status === 507)
    return "Ổ đĩa không đủ dung lượng.";
  if (error instanceof ApiError && error.status === 429)
    return "Hệ thống đang bận. Vui lòng thử lại.";
  return error instanceof Error
    ? error.message
    : "Tải lên thất bại. Vui lòng thử lại.";
}

export function UploadPanel({
  userId,
  projectId,
  folderId,
}: {
  userId: string;
  projectId: string;
  folderId?: string;
}) {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [dragging, setDragging] = useState(false);
  const nextId = useRef(0);
  const controllers = useRef(new Map<number, AbortController>());
  const queue = useRef<PendingUpload[]>([]);
  const activeCount = useRef(0);
  const usageRefreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const active = controllers.current;
    return () => {
      mounted.current = false;
      queue.current = [];
      active.forEach((controller) => controller.abort());
      active.clear();
      if (usageRefreshTimer.current) clearInterval(usageRefreshTimer.current);
      usageRefreshTimer.current = null;
    };
  }, []);

  function update(id: number, patch: Partial<UploadTask>) {
    if (!mounted.current) return;
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    );
  }

  function refreshUsage() {
    void queryClient.invalidateQueries({
      queryKey: projectKeys.usage(userId, projectId),
    });
  }

  function startUsageRefresh() {
    if (usageRefreshTimer.current) return;
    refreshUsage();
    usageRefreshTimer.current = setInterval(refreshUsage, 2_000);
  }

  function pump() {
    while (
      mounted.current &&
      activeCount.current < MAX_ACTIVE_UPLOADS &&
      queue.current.length
    ) {
      const next = queue.current.shift();
      if (!next) break;
      activeCount.current += 1;
      void run(next);
    }
  }

  async function run({ id, file, folderId: targetFolderId }: PendingUpload) {
    const controller = new AbortController();
    controllers.current.set(id, controller);
    update(id, { state: "uploading", progress: 0, message: undefined });
    startUsageRefresh();
    try {
      await uploadFile(
        projectId,
        file,
        targetFolderId,
        controller.signal,
        (loaded, total) => {
          update(id, {
            progress: Math.min(100, Math.round((loaded * 100) / total)),
          });
        },
      );
      update(id, { state: "ready", progress: 100 });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["files", "list", userId, projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: projectKeys.usage(userId, projectId),
        }),
      ]);
    } catch (error) {
      update(id, {
        state: controller.signal.aborted ? "cancelled" : "failed",
        message: errorMessage(error),
      });
    } finally {
      controllers.current.delete(id);
      activeCount.current -= 1;
      refreshUsage();
      pump();
      if (activeCount.current === 0 && usageRefreshTimer.current) {
        clearInterval(usageRefreshTimer.current);
        usageRefreshTimer.current = null;
      }
    }
  }

  function enqueue(id: number, file: File) {
    const validation = validateLocalFile(file);
    if (validation) {
      update(id, { state: "failed", message: validation });
      return;
    }
    update(id, { state: "queued", progress: 0, message: undefined });
    queue.current.push({ id, file, folderId });
    pump();
  }

  function cancel(id: number) {
    const controller = controllers.current.get(id);
    if (controller) {
      controller.abort();
      return;
    }
    queue.current = queue.current.filter((task) => task.id !== id);
    update(id, { state: "cancelled", message: "Đã hủy tải lên." });
  }

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    if (!incoming.length) return;
    const added = incoming.map((file) => ({
      id: ++nextId.current,
      file,
      progress: 0,
      state: "queued" as const,
    }));
    setTasks((current) => [...added, ...current]);
    added.forEach((task) => enqueue(task.id, task.file));
  }

  return (
    <div className="upload-panel">
      <label htmlFor="upload-files">
        Tải tệp vào{" "}
        {folderId && folderId !== "root"
          ? "folder đang chọn"
          : "project (chưa phân loại)"}
      </label>
      <div
        className="upload-drop"
        data-dragging={dragging}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <p>
          Kéo thả tệp vào đây hoặc chọn nhiều tệp. PNG, JPEG, WebP, PDF, MP4,
          ZIP; tối đa 512 MiB/tệp.
        </p>
        <input
          id="upload-files"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf,video/mp4,application/zip"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {tasks.length ? (
        <ul className="upload-tasks" aria-label="Tiến độ tải lên">
          {tasks.map((task) => (
            <li key={task.id}>
              <strong>{task.file.name}</strong>
              <span>
                {task.state === "queued"
                  ? "Đang chờ"
                  : task.state === "uploading"
                    ? `${task.progress}%`
                    : task.state === "ready"
                      ? "Đã tải lên"
                      : task.message}
              </span>
              {task.state === "uploading" || task.state === "queued" ? (
                <button
                  type="button"
                  className="text-action"
                  onClick={() => cancel(task.id)}
                >
                  Hủy {task.file.name}
                </button>
              ) : null}
              {task.state === "failed" || task.state === "cancelled" ? (
                <button
                  type="button"
                  className="text-action"
                  onClick={() => enqueue(task.id, task.file)}
                >
                  Thử lại {task.file.name}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
