type StorageIconKind = "file" | "project";

export function StorageIcon({ kind }: { kind: StorageIconKind }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      {kind === "project" ? (
        <>
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="M3 9h18M9 9v11" stroke="currentColor" strokeWidth="1.7" />
        </>
      ) : (
        <>
          <path
            d="M6 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V3.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M14 3.5V8h4M9 12h6M9 16h6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
