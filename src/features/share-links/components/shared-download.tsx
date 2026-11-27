"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatBytes } from "@/src/features/projects/usage-format";
import {
  inspectSharedFile,
  saveSharedFile,
  type SharedFile,
} from "../api/shared-download.api";

export function SharedDownload() {
  const [token, setToken] = useState("");
  const [file, setFile] = useState<SharedFile | null>(null);
  const [status, setStatus] = useState("Đang kiểm tra link...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const secret = window.location.hash.slice(1);
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      if (!secret) {
        setStatus("Link chia sẻ không hợp lệ.");
        return;
      }
      setToken(secret);
      void inspectSharedFile(secret, controller.signal)
        .then((result) => {
          setFile(result);
          setStatus("");
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setStatus(
              "Link đã hết hạn, bị thu hồi hoặc tệp không còn khả dụng.",
            );
        });
    });
    return () => controller.abort();
  }, []);

  async function download() {
    if (!file || !token) return;
    setBusy(true);
    setStatus("");
    try {
      await saveSharedFile(token, file);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setStatus(
          error instanceof Error ? error.message : "Không thể tải tệp.",
        );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="share-page">
      <div className="share-card">
        <span className="eyebrow">FILE STORAGE PLATFORM / SHARE</span>
        <h1>Tệp được chia sẻ với bạn</h1>
        <p>Link này chỉ cho phép tải tệp trong thời hạn người gửi đã chọn.</p>
        {file ? (
          <div className="share-file">
            <strong>{file.name}</strong>
            <span>
              {formatBytes(BigInt(file.size))} · {file.contentType}
            </span>
          </div>
        ) : null}
        {status ? (
          <p role="status" className="share-status">
            {status}
          </p>
        ) : null}
        {file ? (
          <button
            type="button"
            className="button button-primary"
            disabled={busy}
            onClick={() => void download()}
          >
            {busy ? "Đang tải..." : "Tải tệp xuống"}
          </button>
        ) : null}
        <Link className="button button-outline" href="/">
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
