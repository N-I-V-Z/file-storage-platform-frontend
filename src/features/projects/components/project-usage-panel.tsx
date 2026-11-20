"use client";

import { useProjectUsage } from "../hooks/use-project-usage";
import { formatBytes, usagePercent } from "../usage-format";

export function ProjectUsagePanel({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) {
  const usageQuery = useProjectUsage(userId, projectId);
  const usage = usageQuery.data;

  return (
    <section className="usage-section" aria-labelledby="usage-heading">
      <div className="usage-heading">
        <div>
          <span className="eyebrow">BỘ NHỚ</span>
          <h3 id="usage-heading">Dung lượng lưu trữ</h3>
        </div>
        {usage ? (
          <span className="usage-ratio">
            {formatBytes(BigInt(usage.usedBytes))} /{" "}
            {formatBytes(BigInt(usage.quotaBytes))}
          </span>
        ) : null}
      </div>
      {usageQuery.isPending ? (
        <p className="usage-message" role="status">
          Đang tải dung lượng...
        </p>
      ) : null}
      {usageQuery.isError ? (
        <div className="usage-message">
          <p role="alert">Không thể tải dung lượng.</p>
          <button
            type="button"
            className="text-action"
            onClick={() => void usageQuery.refetch()}
          >
            Thử tải dung lượng
          </button>
        </div>
      ) : null}
      {usage ? (
        <>
          <div
            className="usage-meter"
            role="progressbar"
            aria-label="Dung lượng đã sử dụng"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={usagePercent(
              BigInt(usage.usedBytes),
              BigInt(usage.quotaBytes),
            )}
          >
            <span
              style={{
                width: `${usagePercent(BigInt(usage.usedBytes), BigInt(usage.quotaBytes))}%`,
              }}
            />
          </div>
          <p className="usage-reserved">
            Đang giữ chỗ: {formatBytes(BigInt(usage.reservedBytes))}
          </p>
        </>
      ) : null}
    </section>
  );
}
