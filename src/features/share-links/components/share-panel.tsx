"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/src/lib/http/api-client";
import type { StoredFile } from "@/src/features/files/schemas/files.schemas";
import { createShareLink, revokeShareLink } from "../api/share-links.api";
import { shareLinkKeys } from "../api/share-links.keys";
import { useShareLinks } from "../hooks/use-share-links";
import type { ShareExpirationHours } from "../schemas/share-links.schemas";

export function SharePanel({
  userId,
  projectId,
  file,
  onClose,
}: {
  userId: string;
  projectId: string;
  file: StoredFile;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const links = useShareLinks(userId, projectId, file.id);
  const [hours, setHours] = useState<ShareExpirationHours>(24);
  const [issuedUrl, setIssuedUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  async function create() {
    setBusy(true);
    setError("");
    setIssuedUrl("");
    try {
      const issued = await createShareLink(projectId, file.id, hours);
      setIssuedUrl(`${window.location.origin}/share#${issued.token}`);
      await queryClient.invalidateQueries({
        queryKey: shareLinkKeys.file(userId, projectId, file.id),
      });
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 404
          ? "Chỉ có thể chia sẻ tệp đã quét và sẵn sàng."
          : "Không thể tạo link chia sẻ. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function revoke(linkId: string) {
    setBusy(true);
    setError("");
    try {
      await revokeShareLink(projectId, file.id, linkId);
      setIssuedUrl("");
      await queryClient.invalidateQueries({
        queryKey: shareLinkKeys.file(userId, projectId, file.id),
      });
    } catch {
      setError("Không thể thu hồi link. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(issuedUrl);
      setNotice("Đã sao chép link.");
    } catch {
      setError(
        "Không thể sao chép tự động. Hãy chọn và sao chép link bên dưới.",
      );
    }
  }

  return (
    <section
      className="share-panel"
      aria-label={`Chia sẻ ${file.originalName}`}
    >
      <div className="share-panel-heading">
        <div>
          <span className="eyebrow">TRUY CẬP CÓ THỜI HẠN</span>
          <h4>Chia sẻ {file.originalName}</h4>
        </div>
        <button
          className="button button-outline"
          type="button"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
      <p>
        Người có link có thể tải tệp mà không cần đăng nhập. Link tự hết hạn;
        bạn cũng có thể thu hồi bất cứ lúc nào.
      </p>
      <div className="share-controls">
        <label htmlFor="share-expiry">Thời hạn</label>
        <select
          id="share-expiry"
          value={hours}
          onChange={(event) =>
            setHours(Number(event.target.value) as ShareExpirationHours)
          }
        >
          <option value={1}>1 giờ</option>
          <option value={24}>24 giờ</option>
          <option value={168}>7 ngày</option>
        </select>
        <button
          className="button button-primary"
          type="button"
          disabled={busy}
          onClick={() => void create()}
        >
          Tạo link
        </button>
      </div>
      {issuedUrl ? (
        <div className="share-issued">
          <label htmlFor="share-issued-url">
            Link mới (chỉ hiển thị lần này)
          </label>
          <div>
            <input
              id="share-issued-url"
              readOnly
              value={issuedUrl}
              onFocus={(event) => event.target.select()}
            />
            <button
              className="button button-outline"
              type="button"
              onClick={() => void copy()}
            >
              Sao chép
            </button>
          </div>
        </div>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
      <h5>Link đã tạo</h5>
      {links.isPending ? <p role="status">Đang tải link...</p> : null}
      {links.isError ? <p role="alert">Không thể tải danh sách link.</p> : null}
      {links.data?.length === 0 ? <p>Chưa có link nào.</p> : null}
      {links.data?.length ? (
        <ul className="share-list">
          {links.data.map((link) => {
            const active =
              !link.revokedAt && new Date(link.expiresAt).getTime() > now;
            return (
              <li key={link.id}>
                <span>
                  {active
                    ? "Đang hoạt động"
                    : link.revokedAt
                      ? "Đã thu hồi"
                      : "Đã hết hạn"}{" "}
                  · Hết hạn {new Date(link.expiresAt).toLocaleString("vi-VN")}
                </span>
                {active ? (
                  <button
                    className="button button-outline"
                    type="button"
                    disabled={busy}
                    onClick={() => void revoke(link.id)}
                  >
                    Thu hồi
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
