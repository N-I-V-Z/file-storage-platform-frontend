const UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const;
const ZERO = BigInt(0);
const TEN = BigInt(10);
const KIB = BigInt(1024);

export function formatBytes(bytes: bigint): string {
  let divisor = BigInt(1);
  let unit = 0;
  while (bytes >= divisor * KIB && unit < UNITS.length - 1) {
    divisor *= KIB;
    unit += 1;
  }
  if (unit === 0) return `${bytes.toLocaleString("vi-VN")} B`;

  const tenths = (bytes * TEN + divisor / BigInt(2)) / divisor;
  const whole = (tenths / TEN).toLocaleString("vi-VN");
  const fraction = tenths % TEN;
  return `${whole}${fraction === ZERO ? "" : `,${fraction}`} ${UNITS[unit]}`;
}

export function usagePercent(used: bigint, quota: bigint): number {
  if (quota <= ZERO) return 0;
  const bounded = used < ZERO ? ZERO : used > quota ? quota : used;
  return Number((bounded * BigInt(100)) / quota);
}
