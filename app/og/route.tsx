import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: "#f3f6fa",
        color: "#15253e",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 27,
          fontWeight: 700,
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 10,
            background: "#15253e",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
          }}
        >
          F
        </div>
        File Storage Platform
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 3,
            color: "#2754c7",
          }}
        >
          WORKSPACE LƯU TRỮ CHO NHÀ PHÁT TRIỂN
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            fontWeight: 750,
            lineHeight: 1.08,
            letterSpacing: -3,
          }}
        >
          <span>Tệp của bạn.</span>
          <span>Quyền của bạn.</span>
        </div>
        <div style={{ fontSize: 25, color: "#52647c" }}>
          Project · API key · Dung lượng
        </div>
      </div>
      <div style={{ width: "100%", height: 2, background: "#d8e0eb" }} />
    </div>,
    { width: 1200, height: 630 },
  );
}
