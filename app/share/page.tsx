import type { Metadata } from "next";
import { SharedDownload } from "@/src/features/share-links/components/shared-download";

export const metadata: Metadata = {
  title: "Tệp được chia sẻ",
  description: "Tải tệp được chia sẻ có thời hạn.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function SharePage() {
  return <SharedDownload />;
}
