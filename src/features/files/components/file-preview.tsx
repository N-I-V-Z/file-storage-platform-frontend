"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { fetchPreview } from "../api/download.api";
import type { StoredFile } from "../schemas/files.schemas";

export function FilePreview({
  projectId,
  file,
  onClose,
}: {
  projectId: string;
  file: StoredFile;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;
    void fetchPreview(projectId, file, controller.signal)
      .then((blob) => {
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : "Không thể xem trước tệp.",
          );
      });
    closeButton.current?.focus();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [projectId, file]);

  return (
    <section
      className="file-preview"
      aria-label={`Xem trước ${file.originalName}`}
    >
      <div className="file-preview-heading">
        <strong>{file.originalName}</strong>
        <button
          ref={closeButton}
          type="button"
          className="text-action"
          onClick={onClose}
        >
          Đóng xem trước
        </button>
      </div>
      {!url && !error ? <p role="status">Đang tải bản xem trước...</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {url && file.contentType.startsWith("image/") ? (
        <Image
          unoptimized
          src={url}
          alt={file.originalName}
          width={960}
          height={640}
        />
      ) : null}
      {url && file.contentType === "application/pdf" ? (
        <iframe src={url} title={`Xem trước ${file.originalName}`} />
      ) : null}
      {url && file.contentType === "video/mp4" ? (
        <video
          src={url}
          controls
          preload="metadata"
          aria-label={`Video ${file.originalName}`}
        />
      ) : null}
    </section>
  );
}
