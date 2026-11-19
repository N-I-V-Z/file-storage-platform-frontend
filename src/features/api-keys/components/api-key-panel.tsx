"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/src/lib/http/api-client";
import { issueApiKey, revokeApiKey } from "../api/api-keys.api";
import { apiKeyKeys } from "../api/api-keys.keys";
import { useApiKeys } from "../hooks/use-api-keys";
import {
  createApiKeyFormSchema,
  type ApiKey,
  type CreateApiKeyValues,
  type IssuedApiKey,
} from "../schemas/api-keys.schemas";

const scopeOptions = [
  {
    value: "projects:read",
    label: "Xem project",
    description: "Đọc thông tin project bằng API key.",
  },
  {
    value: "files:read",
    label: "Đọc tệp",
    description: "Dành cho API tải tệp ở giai đoạn sau.",
  },
  {
    value: "files:write",
    label: "Ghi tệp",
    description: "Dành cho API tải lên ở giai đoạn sau.",
  },
] as const;

function keyStatus(key: ApiKey): string {
  if (key.revokedAt) return "Đã thu hồi";
  if (key.expiresAt && Date.parse(key.expiresAt) <= Date.now())
    return "Hết hạn";
  return "Đang hoạt động";
}

function displayDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Không có";
}

export function ApiKeyPanel({
  projectId,
  onIssuingChange,
}: {
  projectId: string;
  onIssuingChange?: (busy: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const keysQuery = useApiKeys(projectId);
  const [creating, setCreating] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState<IssuedApiKey | null>(null);
  const [formError, setFormError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const createTrigger = useRef<HTMLButtonElement>(null);
  const copyButton = useRef<HTMLButtonElement>(null);
  const successNotice = useRef<HTMLParagraphElement>(null);
  const returnFocusId = useRef<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeyValues>({
    resolver: zodResolver(createApiKeyFormSchema),
    defaultValues: { name: "", scopes: ["files:read"], expiration: "90" },
  });
  const revokeMutation = useMutation({
    mutationFn: (keyId: string) => revokeApiKey(projectId, keyId),
  });

  useEffect(() => {
    if (issued) copyButton.current?.focus();
  }, [issued]);
  useEffect(() => {
    if (successMessage) successNotice.current?.focus();
  }, [successMessage]);
  useEffect(() => {
    if (!confirmId && returnFocusId.current) {
      document.getElementById(`revoke-${returnFocusId.current}`)?.focus();
      returnFocusId.current = null;
    }
  }, [confirmId]);

  async function submit(values: CreateApiKeyValues) {
    if (issuing) return;
    setIssuing(true);
    onIssuingChange?.(true);
    setFormError("");
    try {
      const result = await issueApiKey(projectId, values);
      setIssued(result);
      setCopyStatus("");
      setCreating(false);
      reset();
      const metadata: ApiKey = {
        id: result.id,
        projectId: result.projectId,
        name: result.name,
        scopes: result.scopes,
        expiresAt: result.expiresAt,
        revokedAt: result.revokedAt,
        lastUsedAt: result.lastUsedAt,
        createdAt: result.createdAt,
      };
      queryClient.setQueryData<ApiKey[]>(
        apiKeyKeys.list(projectId),
        (current = []) => [metadata, ...current],
      );
      void queryClient.invalidateQueries({
        queryKey: apiKeyKeys.list(projectId),
      });
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Không thể cấp API key. Vui lòng thử lại.",
      );
    } finally {
      setIssuing(false);
      onIssuingChange?.(false);
    }
  }

  async function copyToken() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.token);
      setCopyStatus("Đã sao chép API key.");
    } catch {
      setCopyStatus("Không thể sao chép. Hãy chọn và sao chép key thủ công.");
    }
  }

  function closeSecret() {
    setIssued(null);
    setCopyStatus("");
    createTrigger.current?.focus();
  }

  async function confirmRevoke(key: ApiKey) {
    setRevokeError("");
    setSuccessMessage("");
    try {
      await revokeMutation.mutateAsync(key.id);
      setConfirmId(null);
      setSuccessMessage(`Đã thu hồi ${key.name}.`);
      queryClient.setQueryData<ApiKey[]>(
        apiKeyKeys.list(projectId),
        (current = []) =>
          current.map((item) =>
            item.id === key.id
              ? { ...item, revokedAt: new Date().toISOString() }
              : item,
          ),
      );
      void queryClient.invalidateQueries({
        queryKey: apiKeyKeys.list(projectId),
      });
    } catch (error) {
      setRevokeError(
        error instanceof ApiError
          ? error.message
          : "Không thể thu hồi API key. Vui lòng thử lại.",
      );
    }
  }

  return (
    <section className="keys-section" aria-labelledby="keys-heading">
      <div className="keys-heading">
        <div>
          <span className="eyebrow">QUYỀN TRUY CẬP</span>
          <h3 id="keys-heading">API keys</h3>
          <p>Key chỉ hiển thị một lần khi được tạo.</p>
        </div>
        <button
          ref={createTrigger}
          type="button"
          className="button button-primary"
          disabled={Boolean(issued) || issuing}
          aria-expanded={creating}
          aria-controls="create-key-form"
          onClick={() => {
            setFormError("");
            setCreating(true);
          }}
        >
          Tạo API key
        </button>
      </div>

      {issued ? (
        <div
          className="secret-panel"
          role="region"
          aria-label="API key vừa tạo"
        >
          <strong>Hãy lưu API key này ngay</strong>
          <p>Bạn sẽ không thể xem lại sau khi đóng. Giữ key ở nơi an toàn.</p>
          <code className="secret-value">{issued.token}</code>
          <div className="secret-actions">
            <button
              ref={copyButton}
              type="button"
              className="button button-primary"
              onClick={() => void copyToken()}
            >
              Sao chép key
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={closeSecret}
            >
              Đã lưu key
            </button>
          </div>
          {copyStatus && (
            <p className="copy-status" role="status">
              {copyStatus}
            </p>
          )}
        </div>
      ) : null}

      {creating ? (
        <form
          id="create-key-form"
          className="key-form"
          noValidate
          onSubmit={handleSubmit(submit)}
        >
          <div className="field">
            <label htmlFor="key-name">Tên API key</label>
            <input
              id="key-name"
              autoFocus
              placeholder="Ví dụ: Ứng dụng web"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "key-name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p className="field-error" id="key-name-error" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
          <fieldset
            className="scope-fieldset"
            aria-describedby={errors.scopes ? "key-scopes-error" : undefined}
          >
            <legend>Quyền truy cập</legend>
            {scopeOptions.map((scope) => (
              <label className="scope-option" key={scope.value}>
                <input
                  type="checkbox"
                  value={scope.value}
                  {...register("scopes")}
                />
                <span>
                  <strong>{scope.label}</strong>
                  <small>{scope.description}</small>
                </span>
              </label>
            ))}
            {errors.scopes && (
              <p className="field-error" id="key-scopes-error" role="alert">
                {errors.scopes.message}
              </p>
            )}
          </fieldset>
          <div className="field">
            <label htmlFor="key-expiration">Thời hạn</label>
            <select id="key-expiration" {...register("expiration")}>
              <option value="30">30 ngày</option>
              <option value="90">90 ngày</option>
              <option value="365">365 ngày</option>
              <option value="never">Không hết hạn</option>
            </select>
          </div>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="button button-outline"
              disabled={issuing}
              onClick={() => {
                setCreating(false);
                reset();
                setFormError("");
                createTrigger.current?.focus();
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={issuing}
              aria-busy={issuing}
            >
              {issuing ? "Đang cấp..." : "Cấp key"}
            </button>
          </div>
        </form>
      ) : null}

      {successMessage && (
        <p
          ref={successNotice}
          tabIndex={-1}
          className="keys-success"
          role="status"
        >
          {successMessage}
        </p>
      )}
      {keysQuery.isPending ? (
        <p className="keys-message" role="status">
          Đang tải API key...
        </p>
      ) : null}
      {keysQuery.isError && !keysQuery.data ? (
        <div className="keys-message">
          <p role="alert">Không thể tải API key.</p>
          <button
            type="button"
            className="text-action"
            onClick={() => void keysQuery.refetch()}
          >
            Thử lại
          </button>
        </div>
      ) : null}
      {keysQuery.isSuccess && keysQuery.data.length === 0 ? (
        <p className="keys-message">Chưa có API key nào</p>
      ) : null}
      {keysQuery.data && keysQuery.data.length > 0 ? (
        <ul className="key-list">
          {keysQuery.data.map((key) => (
            <li key={key.id} className="key-item">
              <div className="key-item-top">
                <div>
                  <h4>{key.name}</h4>
                  <span className="key-status" data-status={keyStatus(key)}>
                    {keyStatus(key)}
                  </span>
                </div>
                {keyStatus(key) === "Đang hoạt động" && confirmId !== key.id ? (
                  <button
                    id={`revoke-${key.id}`}
                    type="button"
                    className="text-action danger-action"
                    onClick={() => {
                      setConfirmId(key.id);
                      setRevokeError("");
                    }}
                  >
                    Thu hồi {key.name}
                  </button>
                ) : null}
              </div>
              <div className="scope-tags">
                {key.scopes.map((scope) => (
                  <span key={scope}>{scope}</span>
                ))}
              </div>
              <dl className="key-meta">
                <div>
                  <dt>Tạo ngày</dt>
                  <dd>{displayDate(key.createdAt)}</dd>
                </div>
                <div>
                  <dt>Hết hạn</dt>
                  <dd>{displayDate(key.expiresAt)}</dd>
                </div>
                <div>
                  <dt>Dùng gần nhất</dt>
                  <dd>{displayDate(key.lastUsedAt)}</dd>
                </div>
              </dl>
              {confirmId === key.id ? (
                <div className="revoke-confirm">
                  <p>
                    Thu hồi key {key.name}? Ứng dụng dùng key này sẽ mất quyền
                    truy cập ngay. Không thể hoàn tác.
                  </p>
                  {revokeError && (
                    <p className="form-error" role="alert">
                      {revokeError}
                    </p>
                  )}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="button button-outline"
                      disabled={revokeMutation.isPending}
                      onClick={() => {
                        returnFocusId.current = key.id;
                        setConfirmId(null);
                        setRevokeError("");
                      }}
                    >
                      Hủy thu hồi
                    </button>
                    <button
                      type="button"
                      className="button button-danger"
                      disabled={revokeMutation.isPending}
                      aria-busy={revokeMutation.isPending}
                      onClick={() => void confirmRevoke(key)}
                    >
                      {revokeMutation.isPending
                        ? "Đang thu hồi..."
                        : "Xác nhận thu hồi"}
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
